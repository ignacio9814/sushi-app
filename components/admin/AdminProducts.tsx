"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Edit, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getSeedCatalog } from "@/lib/catalog";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatMoney } from "@/lib/money";
import { seedCatalogToFirestore } from "@/lib/seed-catalog";
import type { Producto } from "@/types";

export default function AdminProducts() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    precio5: "",
    precio10: "",
    precio: "",
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setProductos(getSeedCatalog().productos);
      return;
    }

    const q = query(collection(db, "productos"), orderBy("nombre"));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProductos(getSeedCatalog().productos);
        return;
      }
      setProductos(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Producto, "id">),
        }))
      );
    });
  }, []);

  const handleToggleDisponible = async (productoId: string, disponible: boolean) => {
    if (!db) {
      toast.error("Conectá Firebase para cambiar el stock en vivo.");
      return;
    }
    try {
      await updateDoc(doc(db, "productos", productoId), { disponible });
      toast.success(disponible ? "Producto visible" : "Producto agotado");
    } catch {
      toast.error("No se pudo actualizar la disponibilidad");
    }
  };

  const handleEditClick = (producto: Producto) => {
    setEditingProduct(producto);
    setEditForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio5: producto.variantes?.[0]?.precio?.toString() || "",
      precio10: producto.variantes?.[1]?.precio?.toString() || "",
      precio: producto.precio?.toString() || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !db) return;

    try {
      const updateData: Record<string, unknown> = {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
      };

      if (editingProduct.variantes && editingProduct.variantes.length > 0) {
        updateData.variantes = [
          { nombre: "5 pz", precio: parseInt(editForm.precio5, 10) || 0 },
          { nombre: "10 pz", precio: parseInt(editForm.precio10, 10) || 0 },
        ];
      } else if (editingProduct.precio !== undefined) {
        updateData.precio = parseInt(editForm.precio, 10) || 0;
      }

      await updateDoc(doc(db, "productos", editingProduct.id), updateData);
      toast.success("Producto actualizado");
      setEditingProduct(null);
    } catch {
      toast.error("No se pudo guardar el producto");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCatalogToFirestore();
      toast.success("Menú cargado en Firebase");
    } catch {
      toast.error("No se pudo cargar el menú");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      {isFirebaseConfigured && (
        <Button variant="outline" onClick={handleSeed} disabled={seeding}>
          {seeding ? "Cargando menú..." : "Cargar menú inicial en Firebase"}
        </Button>
      )}

      {productos.map((producto) => (
        <div
          key={producto.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800">
                  <Package className="size-5 text-[#c41e3a]" />
                </div>
                <h3 className="font-heading font-semibold">{producto.nombre}</h3>
              </div>
              <p className="mb-2 line-clamp-1 text-sm text-zinc-400">
                {producto.descripcion}
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-amber-400">
                {producto.variantes ? (
                  <>
                    <span>5pz: {formatMoney(producto.variantes[0]?.precio || 0)}</span>
                    <span className="text-zinc-500">|</span>
                    <span>10pz: {formatMoney(producto.variantes[1]?.precio || 0)}</span>
                  </>
                ) : producto.precio ? (
                  <span>{formatMoney(producto.precio)}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={producto.disponible}
                  onCheckedChange={(checked) =>
                    handleToggleDisponible(producto.id, checked)
                  }
                />
                <span className="text-sm text-zinc-400">
                  {producto.disponible ? "Visible" : "Agotado"}
                </span>
              </div>

              <Dialog
                open={editingProduct?.id === producto.id}
                onOpenChange={(nextOpen) => !nextOpen && setEditingProduct(null)}
              >
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(producto)}
                    />
                  }
                >
                  <Edit className="size-4" />
                </DialogTrigger>
                <DialogContent className="border-zinc-800 bg-zinc-950">
                  <DialogHeader>
                    <DialogTitle>Editar producto</DialogTitle>
                    <DialogDescription>
                      Los precios se cargan en pesos (10000 = $ 10.000).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <Input
                      value={editForm.nombre}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nombre: e.target.value })
                      }
                      placeholder="Nombre"
                    />
                    <Textarea
                      value={editForm.descripcion}
                      onChange={(e) =>
                        setEditForm({ ...editForm, descripcion: e.target.value })
                      }
                      placeholder="Descripción"
                      rows={3}
                    />
                    {editingProduct?.variantes && editingProduct.variantes.length > 0 ? (
                      <>
                        <Input
                          type="number"
                          value={editForm.precio5}
                          onChange={(e) =>
                            setEditForm({ ...editForm, precio5: e.target.value })
                          }
                          placeholder="Precio 5 pz"
                        />
                        <Input
                          type="number"
                          value={editForm.precio10}
                          onChange={(e) =>
                            setEditForm({ ...editForm, precio10: e.target.value })
                          }
                          placeholder="Precio 10 pz"
                        />
                      </>
                    ) : (
                      <Input
                        type="number"
                        value={editForm.precio}
                        onChange={(e) =>
                          setEditForm({ ...editForm, precio: e.target.value })
                        }
                        placeholder="Precio (centavos)"
                      />
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} className="bg-[#c41e3a]">
                      Guardar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
