"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BatterDialog from "@/components/BatterDialog";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import type { Producto, Variante } from "@/types";

const CATEGORY_ACCENT: Record<string, string> = {
  cat_infaltables: "from-red-950 via-black to-zinc-950",
  cat_autor: "from-amber-950 via-black to-zinc-950",
  cat_nigiri: "from-rose-950 via-black to-zinc-950",
  cat_ceviche: "from-red-950 via-zinc-900 to-black",
  cat_extras: "from-stone-900 via-black to-zinc-950",
};

function ProductVisual({ producto }: { producto: Producto }) {
  if (producto.imagen_url) {
    return (
      <img
        src={producto.imagen_url}
        alt={producto.nombre}
        className="aspect-square w-full object-cover"
      />
    );
  }

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-gradient-to-br ${CATEGORY_ACCENT[producto.categoria_id] ?? "from-zinc-900 to-zinc-950"}`}
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_20%,rgba(196,30,58,0.45),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(212,175,55,0.18),transparent_40%)]" />
      <div className="absolute inset-x-6 top-1/3 h-px bg-[#c41e3a]/40" />
      <div className="absolute inset-y-6 left-1/2 w-px bg-amber-500/20" />
      <span className="absolute inset-0 flex items-center justify-center font-heading text-5xl text-amber-100/70">
        寿司
      </span>
    </div>
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
    <article className="overflow-hidden rounded-lg border border-zinc-800 bg-black/80 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c41e3a]/50 hover:shadow-lg hover:shadow-red-950/40">
      <div className="relative">
        <ProductVisual producto={producto} />
        {producto.permite_rebozado && (
          <Badge className="absolute top-3 right-3 bg-amber-500/20 text-amber-300">
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
                      ? "border-[#c41e3a] bg-[#c41e3a]/15 text-red-100"
                      : "border-zinc-700 text-zinc-400 hover:border-[#c41e3a]/40"
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
              variant="outline"
              className="h-9 border-[#c41e3a]/60 px-4 text-red-200 hover:bg-[#c41e3a] hover:text-white"
              onClick={() => addItem(producto, variante)}
            >
              Agregar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
