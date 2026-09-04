"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BatterDialog from "@/components/BatterDialog";
import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import type { Producto, Variante } from "@/types";

function ProductVisual({ producto }: { producto: Producto }) {
  return (
    <img
      src={producto.imagen_url || BRAND.placeholderProductSrc}
      alt={producto.nombre}
      className="aspect-square w-full object-cover"
    />
  );
}

export default function ProductCard({ producto }: { producto: Producto }) {
  const { addItem } = useCart();
  const defaultVariante = producto.variantes?.[0];
  const [variante, setVariante] = useState<Variante | undefined>(defaultVariante);

  const precioVisible = useMemo(() => {
    if (variante) return variante.precio;
    return producto.precio ?? 0;
  }, [producto.precio, variante]);

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-800 bg-black/80 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-950/30">
      <div className="relative">
        <ProductVisual producto={producto} />
        {producto.permite_rebozado && (
          <Badge className="absolute top-3 right-3 border-white/10 bg-black/40 text-amber-100/80 backdrop-blur-sm">
            Rebozado
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-heading text-lg text-zinc-50">{producto.nombre}</h3>
          {producto.descripcion && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {producto.descripcion}
            </p>
          )}
        </div>

        {producto.variantes && producto.variantes.length > 0 ? (
          <div className="flex gap-2">
            {producto.variantes.map((option) => {
              const selected = variante?.nombre === option.nombre;
              return (
                <button
                  key={option.nombre}
                  type="button"
                  onClick={() => setVariante(option)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs transition ${
                    selected
                      ? "border-amber-200/35 bg-amber-200/10 text-amber-100/90"
                      : "border-zinc-700 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <span className="block font-medium">{option.nombre}</span>
                  <span className="text-amber-400">{formatMoney(option.precio)}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <p className="font-heading text-xl text-amber-400">
            {formatMoney(precioVisible)}
          </p>
          {producto.permite_rebozado ? (
            <BatterDialog producto={producto} variante={variante} />
          ) : (
            <Button
              size="sm"
              className="h-10 rounded-full bg-[#25D366] px-4 font-semibold text-white hover:bg-[#20bd5a]"
              onClick={() => {
                addItem(producto, variante);
                toast.success("Agregado al pedido");
              }}
            >
              <Plus className="size-4" />
              Agregar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
