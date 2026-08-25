"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createOrder } from "@/lib/create-order";
import { formatMoney } from "@/lib/money";
import { openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/store/useCart";
import BrandLogo from "@/components/BrandLogo";

export default function Cart() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getTotalPieces,
    getTotalItems,
    includesFreeSauces,
    clearCart,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  const total = getTotal();
  const totalPieces = getTotalPieces();
  const totalItems = getTotalItems();
  const qualifiesForFreeSauces = includesFreeSauces();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!nombre.trim() || !telefono.trim()) {
      toast.error("Completá nombre y teléfono para emitir la boleta.");
      return;
    }

    setSending(true);
    try {
      const pedido = await createOrder(items, {
        clienteNombre: nombre,
        clienteTelefono: telefono,
        direccion,
        notas,
      });
      const boletaUrl = `${window.location.origin}/pedido/${pedido.id}`;
      clearCart();
      setOpen(false);
      toast.success(`Boleta ${pedido.numeroFormateado} generada`);
      router.push(`/pedido/${pedido.id}`);
      openWhatsApp(pedido, boletaUrl);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo registrar el pedido. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed right-4 bottom-4 z-50 h-16 w-16 rounded-full border border-[#c41e3a]/40 bg-[#c41e3a] p-0 shadow-2xl hover:bg-red-700"
          />
        }
      >
        <span className="relative">
          <ShoppingBag className="size-7 text-white" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </span>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[92dvh] w-full gap-0 border-zinc-800 bg-zinc-950 sm:max-w-none"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-zinc-800">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <BrandLogo size="sm" />
              Tu pedido
              <span className="text-amber-400">({totalItems})</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-zinc-500">
                <ShoppingBag className="mb-3 size-10 opacity-40" />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const unit = item.variante?.precio || item.producto.precio || 0;
                  const rebozado = item.conRebozado ? 3000 : 0;
                  const itemTotal = (unit + rebozado) * item.cantidad;

                  return (
                    <div
                      key={`${item.producto.id}-${item.variante?.nombre}-${item.conRebozado}`}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-heading text-base">{item.producto.nombre}</p>
                          {item.variante && (
                            <p className="text-sm text-zinc-400">{item.variante.nombre}</p>
                          )}
                          {item.conRebozado && (
                            <p className="mt-1 text-xs text-amber-400">+ Rebozado</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            removeItem(
                              item.producto.id,
                              item.variante?.nombre,
                              item.conRebozado
                            )
                          }
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              updateQuantity(
                                item.producto.id,
                                item.cantidad - 1,
                                item.variante?.nombre,
                                item.conRebozado
                              )
                            }
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">
                            {item.cantidad}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              updateQuantity(
                                item.producto.id,
                                item.cantidad + 1,
                                item.variante?.nombre,
                                item.conRebozado
                              )
                            }
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <p className="font-semibold text-amber-400">
                          {formatMoney(itemTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {qualifiesForFreeSauces && (
                  <div className="rounded-lg border border-[#c41e3a]/30 bg-[#c41e3a]/10 p-3 text-sm text-red-200">
                    Incluye 1 salsa soja y 1 teriyaki ({totalPieces} piezas)
                  </div>
                )}

                <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <p className="font-heading text-sm text-zinc-300">
                    Datos para la boleta
                  </p>
                  <Input
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="WhatsApp / teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Dirección (opcional)"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                  <Textarea
                    placeholder="Notas para cocina (opcional)"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-3 border-t border-zinc-800 p-4">
              <div className="flex items-center justify-between font-heading text-xl">
                <span>Total</span>
                <span className="text-amber-400">{formatMoney(total)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={sending}
                className="h-12 w-full bg-[#c41e3a] text-base font-heading tracking-wide uppercase hover:bg-red-700"
              >
                {sending ? "Generando boleta..." : "Enviar pedido por WhatsApp"}
              </Button>
              <Button
                onClick={clearCart}
                variant="ghost"
                className="w-full text-zinc-400"
              >
                Vaciar carrito
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
