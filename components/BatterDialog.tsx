"use client";

import { useState } from "react";
import { ChefHat, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/store/useCart";
import { REBOZADO_CENTAVOS, type Producto, type Variante } from "@/types";

interface BatterDialogProps {
  producto: Producto;
  variante?: Variante;
}

export default function BatterDialog({ producto, variante }: BatterDialogProps) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  const handleAddClassic = () => {
    addItem(producto, variante, false);
    setOpen(false);
  };

  const handleAddBattered = () => {
    addItem(producto, variante, true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-[#c41e3a]/60 px-4 text-red-200 hover:bg-[#c41e3a] hover:text-white"
          />
        }
      >
        Agregar
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-xl">
            ¿Rebozar y freír?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Por{" "}
            <span className="font-semibold text-amber-400">
              {formatMoney(REBOZADO_CENTAVOS)}
            </span>{" "}
            extra, el roll sale rebozado y frito.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleAddClassic}
            variant="outline"
            className="h-11 w-full border-[#c41e3a]/40 text-red-100 hover:bg-[#c41e3a] hover:text-white"
          >
            <ChefHat className="mr-2 size-4" />
            Agregar clásico
          </Button>
          <Button
            onClick={handleAddBattered}
            className="h-11 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
          >
            <Flame className="mr-2 size-4" />
            Agregar rebozado (+{formatMoney(REBOZADO_CENTAVOS)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
