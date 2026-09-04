"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import type { Producto } from "@/types";

export default function ExtraRow({ producto }: { producto: Producto }) {
  const { items, addItem, updateQuantity } = useCart();
  const inCart = items.find((item) => item.producto.id === producto.id);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#d9c9a3] py-3 last:border-0">
      <div>
        <p className="text-sm font-semibold tracking-wide text-[#1A1A1A] uppercase">
          {producto.nombre}
        </p>
        <p className="text-sm text-[#9B2B2B]">{formatMoney(producto.precio ?? 0)}</p>
      </div>
      {inCart ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => updateQuantity(producto.id, inCart.cantidad - 1)}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-6 text-center font-medium">{inCart.cantidad}</span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => updateQuantity(producto.id, inCart.cantidad + 1)}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="h-9 rounded-none bg-[#9B2B2B] px-4 text-xs tracking-[0.14em] text-[#F9F7F2] uppercase hover:bg-[#7f2020]"
          onClick={() => addItem(producto)}
        >
          Agregar
        </Button>
      )}
    </div>
  );
}
