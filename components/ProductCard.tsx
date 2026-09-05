"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import BatterDialog from "@/components/BatterDialog";
import { BUSINESS } from "@/lib/business";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import type { Producto, Variante } from "@/types";

export default function ProductCard({ producto }: { producto: Producto }) {
  const { addItem } = useCart();
  const defaultVariante = producto.variantes?.[0];
  const [variante, setVariante] = useState<Variante | undefined>(defaultVariante);

  const precioVisible = useMemo(() => {
    if (variante) return variante.precio;
    return producto.precio ?? 0;
  }, [producto.precio, variante]);

  const detalles = producto.descripcion
    ?.split(/\s*[·•|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#e0d2b0] bg-white/50 p-5 shadow-[0_12px_28px_rgba(26,26,26,0.06)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-[#F9F7F2]/20 to-[#C5A059]/15" />
      <div className="relative">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold tracking-wide text-[#1A1A1A] uppercase">
          {producto.nombre}
        </h3>
        <p className="shrink-0 text-base font-medium text-[#9B2B2B]">
          {formatMoney(precioVisible)}
        </p>
      </div>

      {detalles && detalles.length > 0 && (
        <ul className="mt-2 ml-1 space-y-1 border-l border-[#C5A059] pl-4">
          {detalles.map((detalle) => (
            <li key={detalle} className="flex gap-2 text-sm leading-relaxed text-[#1A1A1A]">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#9B2B2B]" />
              <span>{detalle}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[12px] leading-relaxed text-[#6b6256]">
        {BUSINESS.retiroTexto}
      </p>

      {producto.permite_rebozado && (
        <p className="mt-1 text-[11px] tracking-[0.18em] text-[#C5A059] uppercase">
          Se puede rebozar
        </p>
      )}

      {producto.variantes && producto.variantes.length > 0 ? (
        <div className="mt-3 flex gap-2">
          {producto.variantes.map((option) => {
            const selected = variante?.nombre === option.nombre;
            return (
              <button
                key={option.nombre}
                type="button"
                onClick={() => setVariante(option)}
                className={`flex-1 rounded-xl border px-3 py-2 text-left text-xs tracking-wide uppercase transition ${
                  selected
                    ? "border-[#9B2B2B] bg-[#9B2B2B]/8 text-[#9B2B2B]"
                    : "border-[#d9c9a3] text-[#6b6256]"
                }`}
              >
                <span className="block font-medium">{option.nombre}</span>
                <span className="text-[#9B2B2B]">{formatMoney(option.precio)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        {producto.permite_rebozado ? (
          <BatterDialog producto={producto} variante={variante} />
        ) : (
          <Button
            size="sm"
            className="h-9 rounded-full bg-[#9B2B2B] px-4 text-xs tracking-[0.16em] text-[#F9F7F2] uppercase hover:bg-[#7f2020]"
            onClick={() => {
              addItem(producto, variante);
              toast.success("Agregado al pedido");
            }}
          >
            <Plus className="size-3.5" />
            Agregar
          </Button>
        )}
      </div>
      </div>
    </article>
  );
}
