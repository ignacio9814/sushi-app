"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSeedCatalog, subscribeCatalog } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { saveProductChanges, saveProductStock } from "@/lib/update-product";
import type { Categoria, Producto } from "@/types";

function priceLabel(producto: Producto) {
  if (producto.variantes?.length) {
    return producto.variantes
      .map((variante) => `${variante.nombre}: ${formatMoney(variante.precio)}`)
      .join(" · ");
  }
  return formatMoney(producto.precio ?? 0);
}

export default function AdminProducts() {
  const seed = getSeedCatalog();
  const [categorias] = useState<Categoria[]>(seed.categorias);
  const [productos, setProductos] = useState<Producto[]>(seed.productos);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [variantes, setVariantes] = useState<{ nombre: string; precio: string }[]>([]);

  useEffect(() => {
    return subscribeCatalog(({ productos: next }) => {
      setProductos(next);
    });
  }, []);

  const grouped = useMemo(() => {
    return categorias
      .map((categoria) => ({
        categoria,
        productos: productos.filter((producto) => producto.categoria_id === categoria.id),
      }))
      .filter((group) => group.productos.length > 0);
  }, [categorias, productos]);

  const openEdit = (producto: Producto) => {
    setEditing(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || "");
    setPrecio(producto.precio?.toString() || "");
    setVariantes(
      (producto.variantes || []).map((variante) => ({
        nombre: variante.nombre,
        precio: String(variante.precio),
      }))
    );
  };

  const builtProduct = (): Producto | null => {
    if (!editing) return null;
    const next: Producto = {
      ...editing,
      nombre: nombre.trim() || editing.nombre,
      descripcion: descripcion.trim() || undefined,
    };
    delete next.imagen_url;
    if (variantes.length > 0) {
      next.variantes = variantes.map((variante, index) => ({
        nombre: variante.nombre || editing.variantes?.[index]?.nombre || `Opción ${index + 1}`,
        precio: Number(variante.precio) || 0,
      }));
      delete next.precio;
    } else {
      next.precio = Number(precio) || 0;
    }
    return next;
  };

  const handleSave = async () => {
    const next = builtProduct();
    if (!next) return;
    setSaving(true);
    try {
      await saveProductChanges(next);
      setProductos((current) =>
        current.map((item) => (item.id === next.id ? next : item))
      );
      toast.success("Producto actualizado");
      setEditing(null);
    } catch {
      toast.error("No se pudo guardar. Volvé a intentar.");
    } finally {
      setSaving(false);
    }
  };

  const handleStock = async (producto: Producto, disponible: boolean) => {
    try {
      await saveProductStock(producto, disponible);
      setProductos((current) =>
        current.map((item) =>
          item.id === producto.id ? { ...item, disponible } : item
        )
      );
      toast.success(disponible ? "En stock" : "Sacado de stock");
    } catch {
      toast.error("No se pudo cambiar el stock");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#6b6256]">
        Editá precios y sacá de stock lo que no haya. El menú del cliente se actualiza al toque.
      </p>

      {grouped.map(({ categoria, productos: items }) => (
        <section key={categoria.id} className="space-y-3">
          <h3 className="font-heading text-lg tracking-wide text-[#1A1A1A]">
            {categoria.nombre}
          </h3>
          <div className="space-y-3">
            {items.map((producto) => (
              <div
                key={producto.id}
                className={`rounded-2xl border bg-white/70 p-4 ${
                  producto.disponible ? "border-[#d9c9a3]" : "border-[#9B2B2B]/40 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-base text-[#1A1A1A]">{producto.nombre}</h4>
                    <p className="text-sm text-[#9B2B2B]">{priceLabel(producto)}</p>
                    {!producto.disponible && (
                      <p className="mt-1 text-xs font-medium text-[#9B2B2B]">Sin stock</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#d9c9a3]"
                    onClick={() => openEdit(producto)}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    className={`h-11 rounded-full ${
                      producto.disponible
                        ? "bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
                        : "border border-[#d9c9a3] bg-transparent text-[#6b6256]"
                    }`}
                    variant={producto.disponible ? "default" : "outline"}
                    onClick={() => void handleStock(producto, true)}
                  >
                    En stock
                  </Button>
                  <Button
                    type="button"
                    className={`h-11 rounded-full ${
                      !producto.disponible
                        ? "bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
                        : "border border-[#d9c9a3] bg-transparent text-[#6b6256]"
                    }`}
                    variant={!producto.disponible ? "default" : "outline"}
                    onClick={() => void handleStock(producto, false)}
                  >
                    Sacar de stock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="menu-page max-h-[90dvh] overflow-y-auto border-[#d9c9a3] text-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription className="text-[#6b6256]">
              Precios en pesos, sin puntos: 10000 = $ 10.000.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <Input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre"
              />
              <Textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Descripción"
                rows={3}
              />
              {variantes.length > 0
                ? variantes.map((variante, index) => (
                    <label key={variante.nombre} className="block space-y-1 text-sm text-[#6b6256]">
                      Precio {variante.nombre}
                      <Input
                        type="number"
                        value={variante.precio}
                        onChange={(event) =>
                          setVariantes((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, precio: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </label>
                  ))
                : (
                    <label className="block space-y-1 text-sm text-[#6b6256]">
                      Precio
                      <Input
                        type="number"
                        value={precio}
                        onChange={(event) => setPrecio(event.target.value)}
                      />
                    </label>
                  )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
