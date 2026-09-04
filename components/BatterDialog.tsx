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
            className="h-9 rounded-full bg-[#9B2B2B] px-4 text-xs tracking-[0.16em] text-[#F9F7F2] uppercase hover:bg-[#7f2020]"
          />
        }
      >
        <Plus className="size-4" />
        Agregar
      </DialogTrigger>
      <DialogContent className="menu-page border-[#d9c9a3] text-[#1A1A1A] sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center font-heading text-xl">
            ¿Rebozar y freír?
          </DialogTitle>
          <DialogDescription className="text-center text-base text-[#6b6256]">
            Por{" "}
            <span className="font-semibold text-[#9B2B2B]">
              {formatMoney(REBOZADO_CENTAVOS)}
            </span>{" "}
            extra, el roll sale rebozado y frito.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleAddClassic}
            variant="outline"
            className="h-11 w-full border-[#d9c9a3] text-[#1A1A1A] hover:bg-[#efe6d4]"
          >
            <ChefHat className="mr-2 size-4" />
            Agregar clásico
          </Button>
          <Button
            onClick={handleAddBattered}
            className="h-11 w-full bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
          >
            <Flame className="mr-2 size-4" />
            Agregar rebozado (+{formatMoney(REBOZADO_CENTAVOS)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
