"use client";

import { useState } from "react";
import { ChefHat, Flame, Plus } from "lucide-react";
import { toast } from "sonner";
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
    toast.success("Agregado al pedido");
  };

  const handleAddBattered = () => {
    addItem(producto, variante, true);
    setOpen(false);
    toast.success("Agregado al pedido");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="h-10 rounded-full bg-[#25D366] px-4 font-semibold text-white hover:bg-[#20bd5a]"
          />
        }
      >
        <Plus className="size-4" />
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
            className="h-11 w-full border-amber-500/40 text-amber-100 hover:bg-amber-500/15"
          >
            <ChefHat className="mr-2 size-4" />
            Agregar clásico
          </Button>
          <Button
            onClick={handleAddBattered}
            className="h-11 w-full border border-amber-200/30 bg-amber-200/10 text-amber-100/90 hover:bg-amber-200/20"
          >
            <Flame className="mr-2 size-4" />
            Agregar rebozado (+{formatMoney(REBOZADO_CENTAVOS)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
