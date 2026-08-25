"use client";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import type { Producto } from "@/types";

export default function ExtraRow({ producto }: { producto: Producto }) {
  const { addItem } = useCart();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-3 last:border-0">
      <p className="font-heading text-base text-zinc-100">{producto.nombre}</p>
      <div className="flex items-center gap-3">
        <span className="font-heading text-lg text-amber-400">
          {formatMoney(producto.precio ?? 0)}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-9 border-[#c41e3a]/60 px-4 text-red-200 hover:bg-[#c41e3a] hover:text-white"
          onClick={() => addItem(producto)}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
}
