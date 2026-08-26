"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/brand";
import { getSeedCatalog, subscribeCatalog } from "@/lib/catalog";
import { isFirebaseConfigured } from "@/lib/firebase";
import { formatMoney } from "@/lib/money";
import { seedCatalogToFirestore } from "@/lib/seed-catalog";
import {
  clearProductPhoto,
  saveProductChanges,
  saveProductPhotoFile,
  saveProductStock,
} from "@/lib/update-product";
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
  const [seeding, setSeeding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [variantes, setVariantes] = useState<{ nombre: string; precio: string }[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeCatalog(({ productos: next }) => {
      setProductos(next);
    });
  }, []);

  const grouped = useMemo(() => {
    return categorias
      .map((categoria) => ({
        categoria,
        productos: productos.filter(
          (producto) => producto.categoria_id === categoria.id
        ),
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
    setPhotoUrl(producto.imagen_url || "");
  };

  const builtProduct = (): Producto | null => {
    if (!editing) return null;
    const next: Producto = {
      ...editing,
      nombre: nombre.trim() || editing.nombre,
      descripcion: descripcion.trim() || undefined,
    };
    if (variantes.length > 0) {
      next.variantes = variantes.map((variante, index) => ({
        nombre: variante.nombre || editing.variantes?.[index]?.nombre || `Opción ${index + 1}`,
        precio: Number(variante.precio) || 0,
      }));
      delete next.precio;
    } else {
      next.precio = Number(precio) || 0;
    }
    if (photoUrl.trim()) next.imagen_url = photoUrl.trim();
    else delete next.imagen_url;
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
      toast.success(
        isFirebaseConfigured ? "Producto actualizado" : "Guardado en este dispositivo"
      );
      setEditing(null);
    } catch {
      toast.error("No se pudo guardar. Revisá Firebase o volvé a intentar.");
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
      toast.success(disponible ? "En stock" : "Sin stock");
    } catch {
      toast.error("No se pudo cambiar el stock");
    }
  };

  const handlePhotoFile = async (file: File) => {
    if (!editing) return;
    setSaving(true);
    try {
      const url = await saveProductPhotoFile(editing, file);
      setPhotoUrl(url);
      const next = { ...editing, imagen_url: url };
      setEditing(next);
      setProductos((current) =>
        current.map((item) => (item.id === next.id ? next : item))
      );
      toast.success("Foto actualizada");
    } catch {
      toast.error("No se pudo subir la foto");
    } finally {
      setSaving(false);
    }
  };

  const handleClearPhoto = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await clearProductPhoto(editing);
      setPhotoUrl("");
      const { imagen_url: _drop, ...rest } = editing;
      setEditing(rest);
      toast.success("Foto quitada");
    } catch {
      toast.error("No se pudo quitar la foto");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Cambiá fotos, precios y marcá sin stock. El menú del cliente se actualiza al toque.
      </p>
      {isFirebaseConfigured && (
        <Button variant="outline" onClick={handleSeed} disabled={seeding}>
          {seeding ? "Cargando menú..." : "Cargar menú inicial en Firebase"}
        </Button>
      )}
      {!isFirebaseConfigured && (
        <p className="rounded-lg border border-amber-200/20 bg-amber-200/5 px-3 py-2 text-sm text-amber-100/80">
          Modo demo: los cambios quedan en este celular/computadora hasta conectar Firebase.
        </p>
      )}

      {grouped.map(({ categoria, productos: items }) => (
        <section key={categoria.id} className="space-y-3">
          <h3 className="font-heading text-lg text-zinc-200">{categoria.nombre}</h3>
          <div className="space-y-3">
            {items.map((producto) => {
              const photo = producto.imagen_url || BRAND.placeholderProductSrc;
              return (
                <div
                  key={producto.id}
                  className={`rounded-lg border bg-zinc-900/80 p-3 ${
                    producto.disponible ? "border-zinc-800" : "border-zinc-800 opacity-70"
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={photo}
                      alt=""
                      className="size-16 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-heading text-base">{producto.nombre}</h4>
                          <p className="text-sm text-amber-400">{priceLabel(producto)}</p>
                          {!producto.disponible && (
                            <p className="text-xs text-zinc-400">Sin stock</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(producto)}
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                      </div>
                      <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-zinc-300">
                          {producto.disponible ? "En stock" : "Sin stock"}
                        </span>
                        <Switch
                          checked={producto.disponible}
                          onCheckedChange={(checked) => handleStock(producto, checked)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-zinc-800 bg-zinc-950">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>
              Precios en pesos, sin puntos: 10000 = $ 10.000.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <img
                  src={photoUrl || BRAND.placeholderProductSrc}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handlePhotoFile(file);
                  event.target.value = "";
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Subir foto
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => void handleClearPhoto()}
                  >
                    Quitar
                  </Button>
                )}
              </div>
              <Input
                value={photoUrl}
                onChange={(event) => setPhotoUrl(event.target.value)}
                placeholder="O pegá una URL de foto"
              />
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
                    <label key={variante.nombre} className="block space-y-1 text-sm text-zinc-400">
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
                    <label className="block space-y-1 text-sm text-zinc-400">
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
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="border border-amber-200/30 bg-amber-200/10 text-amber-100/90 hover:bg-amber-200/20"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
