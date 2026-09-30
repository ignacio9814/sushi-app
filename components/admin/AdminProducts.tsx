"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { createProduct, deleteProduct, saveProductChanges, saveProductStock } from "@/lib/update-product";
import type { Categoria, Producto } from "@/types";

function priceLabel(producto: Producto) {
  if (producto.variantes?.length) {
    return producto.variantes
      .map((variante) => `${variante.nombre}: ${formatMoney(variante.precio)}`)
      .join(" · ");
  }
  return formatMoney(producto.precio ?? 0);
}

function usesPortions(categoriaId: string) {
  return categoriaId === "cat_infaltables" || categoriaId === "cat_autor";
}

function newProductDraft(categoria: Categoria): Producto {
  const portions = usesPortions(categoria.id);
  return {
    id: `p_${Date.now()}`,
    categoria_id: categoria.id,
    nombre: "",
    descripcion: "",
    disponible: true,
    permite_rebozado: portions,
    ...(portions
      ? {
          variantes: [
            { nombre: "5 pz", precio: 0 },
            { nombre: "10 pz", precio: 0 },
          ],
        }
      : { precio: 0 }),
  };
}

export default function AdminProducts() {
  const seed = getSeedCatalog();
  const [categorias, setCategorias] = useState<Categoria[]>(seed.categorias);
  const [productos, setProductos] = useState<Producto[]>(seed.productos);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [variantes, setVariantes] = useState<{ nombre: string; precio: string }[]>([]);
  const [rebozado, setRebozado] = useState(false);

  useEffect(() => {
    return subscribeCatalog(({ categorias: cats, productos: next }) => {
      setCategorias(cats);
      setProductos(next);
    });
  }, []);

  const grouped = useMemo(() => {
    return categorias.map((categoria) => ({
      categoria,
      productos: productos.filter((producto) => producto.categoria_id === categoria.id),
    }));
  }, [categorias, productos]);

  const fillForm = (producto: Producto) => {
    setEditing(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || "");
    setPrecio(producto.precio?.toString() || "");
    setRebozado(Boolean(producto.permite_rebozado));
    setVariantes(
      (producto.variantes || []).map((variante) => ({
        nombre: variante.nombre,
        precio: String(variante.precio || ""),
      }))
    );
  };

  const openEdit = (producto: Producto) => {
    setIsNew(false);
    fillForm(producto);
  };

  const openCreate = (categoria: Categoria) => {
    setIsNew(true);
    fillForm(newProductDraft(categoria));
  };

  const builtProduct = (): Producto | null => {
    if (!editing) return null;
    const trimmedName = nombre.trim();
    if (!trimmedName) return null;

    const next: Producto = {
      ...editing,
      nombre: trimmedName,
      descripcion: descripcion.trim() || undefined,
      permite_rebozado: usesPortions(editing.categoria_id) ? rebozado : undefined,
    };
    delete next.imagen_url;

    if (variantes.length > 0) {
      const filled = variantes
        .map((variante, index) => ({
          nombre: variante.nombre.trim() || editing.variantes?.[index]?.nombre || `Opción ${index + 1}`,
          precio: Number(variante.precio) || 0,
        }))
        .filter((variante) => variante.precio > 0);
      if (filled.length === 0) return null;
      next.variantes = filled;
      delete next.precio;
    } else {
      const value = Number(precio) || 0;
      if (value <= 0) return null;
      next.precio = value;
      delete next.variantes;
    }
    return next;
  };

  const handleSave = async () => {
    const next = builtProduct();
    if (!next) {
      toast.error("Completá el nombre y un precio.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createProduct(next);
        toast.success("Producto agregado al menú");
      } else {
        await saveProductChanges(next);
        toast.success("Producto actualizado");
      }
      setEditing(null);
      setIsNew(false);
    } catch {
      toast.error("No se pudo guardar. Volvé a intentar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteProduct(deleting);
      toast.success("Producto eliminado del menú");
      setDeleting(null);
      if (editing?.id === deleting.id) {
        setEditing(null);
        setIsNew(false);
      }
    } catch {
      toast.error("No se pudo eliminar. Volvé a intentar.");
    } finally {
      setSaving(false);
    }
  };

  const handleStock = (producto: Producto, disponible: boolean) => {
    if (isAvailable(producto) === disponible) return;
    setProductos((current) =>
      current.map((item) => (item.id === producto.id ? { ...item, disponible } : item))
    );
    if (editing?.id === producto.id) {
      setEditing({ ...editing, disponible });
    }
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
        Verde = se vende. Rojo = el cliente no lo ve. En cada sección podés agregar, editar o eliminar.
      </p>

      {grouped.map(({ categoria, productos: items }) => (
        <section key={categoria.id} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg tracking-wide text-[#1A1A1A]">
              {categoria.nombre}
            </h3>
            <Button
              size="sm"
              className="rounded-full bg-[#1A1A1A] text-[#F9F7F2] hover:bg-[#333]"
              onClick={() => openCreate(categoria)}
            >
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#d9c9a3] bg-white px-4 py-5 text-sm text-[#6b6256]">
                Todavía no hay productos acá. Tocá Agregar para sumar uno.
              </p>
            ) : (
              items.map((producto) => (
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
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-[#d9c9a3] bg-white"
                        onClick={() => openEdit(producto)}
                      >
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-full border-[#d9c9a3] bg-white text-[#9B2B2B]"
                        onClick={() => setDeleting(producto)}
                        aria-label={`Eliminar ${producto.nombre}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
              ))
            )}
          </div>
        </section>
      ))}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setIsNew(false);
          }
        }}
      >
        <DialogContent
          overlayClassName="bg-black/45 backdrop-blur-none"
          className="max-h-[90dvh] overflow-y-auto border-[#d9c9a3] bg-[#F9F7F2] text-[#1A1A1A]"
        >
          <DialogHeader>
            <DialogTitle>{isNew ? "Agregar producto" : "Editar producto"}</DialogTitle>
            <DialogDescription className="text-[#6b6256]">
              {isNew
                ? "Nombre, precio y listo. El cliente lo ve en el menú."
                : "Precios en pesos, sin puntos: 10000 = $ 10.000."}
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
                placeholder="Descripción (opcional)"
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
                    if (!isNew) handleStock(editing, true);
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
                    if (!isNew) handleStock(editing, false);
                  }}
                >
                  Sin stock
                </button>
              </div>
              {usesPortions(editing.categoria_id) && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`h-12 rounded-full text-sm font-semibold ${
                      rebozado
                        ? "bg-[#1A1A1A] text-[#F9F7F2]"
                        : "border border-[#d9c9a3] bg-white text-[#6b6256]"
                    }`}
                    onClick={() => setRebozado(true)}
                  >
                    Se puede rebozar
                  </button>
                  <button
                    type="button"
                    className={`h-12 rounded-full text-sm font-semibold ${
                      !rebozado
                        ? "bg-[#1A1A1A] text-[#F9F7F2]"
                        : "border border-[#d9c9a3] bg-white text-[#6b6256]"
                    }`}
                    onClick={() => setRebozado(false)}
                  >
                    Sin rebozado
                  </button>
                </div>
              )}
              {variantes.length > 0
                ? variantes.map((variante, index) => (
                    <label key={`${variante.nombre}-${index}`} className="block space-y-1 text-sm text-[#6b6256]">
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
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditing(null);
                setIsNew(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
            >
              {saving ? "Guardando..." : isNew ? "Agregar al menú" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent
          overlayClassName="bg-black/45 backdrop-blur-none"
          className="border-[#d9c9a3] bg-[#F9F7F2] text-[#1A1A1A]"
        >
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription className="text-[#6b6256]">
              {deleting
                ? `¿Sacar “${deleting.nombre}” del menú? El cliente ya no lo va a ver.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={saving}
              className="rounded-full bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
            >
              {saving ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
