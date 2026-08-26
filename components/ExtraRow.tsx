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
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-3 last:border-0">
      <div>
        <p className="font-heading text-base text-zinc-100">{producto.nombre}</p>
        <p className="font-heading text-sm text-amber-400">
          {formatMoney(producto.precio ?? 0)}
        </p>
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
          variant="outline"
          className="h-9 border-white/15 bg-white/5 px-4 text-amber-100/80 hover:border-amber-200/30 hover:bg-amber-200/10"
          onClick={() => addItem(producto)}
        >
          Agregar
        </Button>
      )}
    </div>
  );
}
