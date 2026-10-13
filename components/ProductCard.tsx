"use client";

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import BatterDialog from "@/components/BatterDialog";
import { formatMoney } from "@/lib/money";
import { isClaseProduct, isComboProduct, PROMO } from "@/lib/promo";
import { useCart } from "@/store/useCart";
import type { Producto, Variante } from "@/types";

export default function ProductCard({ producto }: { producto: Producto }) {
  const { addItem } = useCart();
  const defaultVariante = producto.variantes?.[0];
  const [variante, setVariante] = useState<Variante | undefined>(defaultVariante);
  const combo = isComboProduct(producto);
  const clase = isClaseProduct(producto);
  const destacado = combo || clase;
  const imagen = clase ? PROMO.fotoClase : producto.imagen_url;

  const precioVisible = useMemo(() => {
    if (variante) return variante.precio;
    return producto.precio ?? 0;
  }, [producto.precio, variante]);

  const detalles = producto.descripcion
    ?.split(/\n+| · |\s*[·•|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  const canAdd = !clase || precioVisible > 0;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-white/50 p-5 shadow-[0_12px_28px_rgba(26,26,26,0.06)] ${
        destacado ? "border-2 border-[#C5A059]" : "border-[#e0d2b0]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-[#F9F7F2]/20 to-[#C5A059]/15" />
      <div className="relative">
      {(clase || imagen) && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-[#d9c9a3]">
          <img
            src={clase ? PROMO.fotoClase : imagen}
            alt={producto.nombre}
            className={clase ? "h-80 w-full object-cover object-[center_54%]" : "h-56 w-full object-cover object-center"}
          />
        </div>
      )}
      {destacado && (
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
          Día de la Madre · {clase ? PROMO.ventaTextoClase : PROMO.ventaTextoCombo}
        </p>
      )}
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold tracking-wide text-[#1A1A1A] uppercase">
          {producto.nombre}
        </h3>
        <p className="shrink-0 text-base font-medium text-[#9B2B2B]">
          {clase && precioVisible <= 0 ? "Precio en cocina" : formatMoney(precioVisible)}
        </p>
      </div>

      {combo && (
        <p className="mt-1 text-sm text-[#6b6256]">30 piezas · edición limitada</p>
      )}

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

      {combo && (
        <div className="mt-3 rounded-xl border border-[#C5A059] bg-[#C5A059]/15 px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
            Un privilegio exclusivo
          </p>
          <p className="mt-1 text-sm font-medium text-[#1A1A1A]">
            {PROMO.discountPct}% de descuento en tu próxima compra.
          </p>
          <p className="mt-1 text-sm text-[#6b6256]">
            Se compra del {PROMO.ventaTextoCombo}. {PROMO.reclamoTexto}.
          </p>
        </div>
      )}

      {clase && (
        <div className="mt-3 rounded-xl border border-[#C5A059] bg-[#C5A059]/15 px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
            Experiencia
          </p>
          <p className="mt-1 text-sm font-medium text-[#1A1A1A]">
            Clase de sushi a coordinar con el local.
          </p>
          <p className="mt-1 text-sm text-[#6b6256]">
            Se compra del {PROMO.ventaTextoClase}. {PROMO.reclamoTexto}.
          </p>
        </div>
      )}

      {producto.permite_rebozado && (
        <p className="mt-2 text-[12px] text-[#8A6E2F]">Se puede rebozar</p>
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
                    ? "border-[#C5A059] bg-[#C5A059]/20 text-[#1A1A1A]"
                    : "border-[#d9c9a3] bg-white/80 text-[#6b6256]"
                }`}
              >
                <span className="flex items-center gap-1 font-medium">
                  {selected && <Check className="size-3.5 text-[#C5A059]" />}
                  {option.nombre}
                </span>
                <span className={selected ? "text-[#1A1A1A]" : "text-[#6b6256]"}>
                  {formatMoney(option.precio)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        {!canAdd ? (
          <p className="text-sm text-[#6b6256]">Cocina está definiendo el precio.</p>
        ) : producto.permite_rebozado ? (
          <BatterDialog producto={producto} variante={variante} />
        ) : (
          <Button
            size="sm"
            className="h-9 rounded-full bg-[#1A1A1A] px-4 text-xs tracking-[0.16em] text-[#F9F7F2] uppercase hover:bg-[#333]"
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
