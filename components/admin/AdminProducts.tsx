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
import { isAvailable } from "@/lib/local-stock";
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

  const handleStock = (producto: Producto, disponible: boolean) => {
    if (isAvailable(producto) === disponible) return;
    setProductos((current) =>
      current.map((item) =>
        item.id === producto.id ? { ...item, disponible } : item
      )
    );
    try {
      void saveProductStock(producto, disponible);
      toast.success(
        disponible
          ? "Guardado: volvió al menú del cliente"
          : "Guardado: el cliente ya no lo ve"
      );
    } catch {
      toast.error("No se pudo guardar el stock. Probá de nuevo.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#6b6256]">
        Verde = se vende. Rojo = el cliente no lo ve. El cambio queda guardado al tocarlo.
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
                className={`rounded-2xl border bg-white p-4 ${
                  isAvailable(producto) ? "border-[#d9c9a3]" : "border-[#9B2B2B]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-base text-[#1A1A1A]">{producto.nombre}</h4>
                    <p className="text-sm text-[#9B2B2B]">{priceLabel(producto)}</p>
                    <p
                      className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
                        isAvailable(producto)
                          ? "bg-[#E7F6EC] text-[#1F8A4C]"
                          : "bg-[#F8E8E8] text-[#9B2B2B]"
                      }`}
                    >
                      {isAvailable(producto) ? "En stock" : "Sin stock"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#d9c9a3] bg-white"
                    onClick={() => openEdit(producto)}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`h-12 rounded-full text-sm font-semibold ${
                      isAvailable(producto)
                        ? "bg-[#1F8A4C] text-white"
                        : "border border-[#d9c9a3] bg-white text-[#6b6256]"
                    }`}
                    onClick={() => handleStock(producto, true)}
                  >
                    En stock
                  </button>
                  <button
                    type="button"
                    className={`h-12 rounded-full text-sm font-semibold ${
                      !isAvailable(producto)
                        ? "bg-[#9B2B2B] text-white"
                        : "border border-[#d9c9a3] bg-white text-[#6b6256]"
                    }`}
                    onClick={() => handleStock(producto, false)}
                  >
                    Sin stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent
          overlayClassName="bg-black/45 backdrop-blur-none"
          className="max-h-[90dvh] overflow-y-auto border-[#d9c9a3] bg-[#F9F7F2] text-[#1A1A1A]"
        >
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`h-12 rounded-full text-sm font-semibold ${
                    isAvailable(editing)
                      ? "bg-[#1F8A4C] text-white"
                      : "border border-[#d9c9a3] bg-white text-[#6b6256]"
                  }`}
                  onClick={() => {
                    setEditing({ ...editing, disponible: true });
                    handleStock(editing, true);
                  }}
                >
                  En stock
                </button>
                <button
                  type="button"
                  className={`h-12 rounded-full text-sm font-semibold ${
                    !isAvailable(editing)
                      ? "bg-[#9B2B2B] text-white"
                      : "border border-[#d9c9a3] bg-white text-[#6b6256]"
                  }`}
                  onClick={() => {
                    setEditing({ ...editing, disponible: false });
                    handleStock(editing, false);
                  }}
                >
                  Sin stock
                </button>
              </div>
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
