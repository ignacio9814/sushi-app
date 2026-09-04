"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import BatterDialog from "@/components/BatterDialog";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import type { Producto, Variante } from "@/types";

const KIND_LABEL: Record<string, string> = {
  cat_infaltables: "Roll clásico",
  cat_autor: "Roll de autor",
  cat_nigiri: "Nigiri",
  cat_ceviche: "Ceviche",
};

export default function ProductCard({ producto }: { producto: Producto }) {
  const { addItem } = useCart();
  const defaultVariante = producto.variantes?.[0];
  const [variante, setVariante] = useState<Variante | undefined>(defaultVariante);

  const precioVisible = useMemo(() => {
    if (variante) return variante.precio;
    return producto.precio ?? 0;
  }, [producto.precio, variante]);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-800/90 bg-zinc-950/80 p-5 shadow-[0_0_0_1px_rgba(212,175,55,0.04)] transition hover:-translate-y-0.5 hover:border-amber-200/25 hover:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-amber-200/70 uppercase">
            {KIND_LABEL[producto.categoria_id] || "Plato"}
          </p>
          <h3 className="font-heading mt-1 text-xl text-zinc-50">{producto.nombre}</h3>
        </div>
        {producto.permite_rebozado && (
          <span className="shrink-0 rounded-full border border-amber-200/25 bg-amber-200/10 px-2.5 py-1 text-[11px] text-amber-100">
            Rebozado
          </span>
        )}
      </div>

      {producto.descripcion && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{producto.descripcion}</p>
      )}

      {producto.variantes && producto.variantes.length > 0 ? (
        <div className="mt-4 flex gap-2">
          {producto.variantes.map((option) => {
            const selected = variante?.nombre === option.nombre;
            return (
              <button
                key={option.nombre}
                type="button"
                onClick={() => setVariante(option)}
                className={`flex-1 rounded-xl border px-3 py-2 text-left text-xs transition ${
                  selected
                    ? "border-amber-200/50 bg-amber-200/10 text-amber-50"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="block font-medium">{option.nombre}</span>
                <span className="text-amber-400">{formatMoney(option.precio)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="font-heading text-2xl text-amber-300">{formatMoney(precioVisible)}</p>
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
    </article>
  );
}
