"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import ExtraRow from "@/components/ExtraRow";
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
import { getSeedCatalog, subscribeCatalog } from "@/lib/catalog";
import { createOrder } from "@/lib/create-order";
import { formatMoney } from "@/lib/money";
import { openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/store/useCart";
import BrandLogo from "@/components/BrandLogo";
import { isExtraProduct, type Producto } from "@/types";

type CheckoutStep = "comida" | "extras" | "datos";

const STEPS: CheckoutStep[] = ["comida", "extras", "datos"];

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getTotalPieces,
    getTotalItems,
    includesFreeSauces,
    clearCart,
    clearExtras,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("comida");
  const [sending, setSending] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [extras, setExtras] = useState<Producto[]>(() =>
    getSeedCatalog().productos.filter(
      (producto) => producto.disponible && isExtraProduct(producto)
    )
  );

  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  useEffect(() => {
    return subscribeCatalog(({ productos }) => {
      setExtras(
        productos.filter((producto) => producto.disponible && isExtraProduct(producto))
      );
    });
  }, []);

  const foodItems = items.filter((item) => !isExtraProduct(item.producto));
  const extraItems = items.filter((item) => isExtraProduct(item.producto));
  const total = getTotal();
  const totalPieces = getTotalPieces();
  const totalItems = getTotalItems();
  const qualifiesForFreeSauces = includesFreeSauces();
  const stepIndex = STEPS.indexOf(step);

  const titles: Record<CheckoutStep, string> = {
    comida: "Tu pedido",
    extras: "Extras",
    datos: "Tus datos",
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setStep("comida");
  };

  const handleCheckout = async () => {
    if (foodItems.length === 0) {
      toast.error("Elegí al menos un plato antes de enviar.");
      setStep("comida");
      return;
    }
    if (!nombre.trim() || !telefono.trim()) {
      toast.error("Dejanos nombre y WhatsApp para confirmar el pedido.");
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
      clearCart();
      setOpen(false);
      setNombre("");
      setTelefono("");
      setDireccion("");
      setNotas("");
      toast.success(`Pedido ${pedido.numeroFormateado} enviado a cocina`);
      openWhatsApp(pedido);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo registrar el pedido. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    if (step === "extras") setStep("comida");
    if (step === "datos") setStep("extras");
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            size="lg"
            variant="outline"
            className="fixed right-4 bottom-4 z-50 h-16 w-16 rounded-full border-[#25D366]/55 bg-[#25D366]/20 p-0 text-white shadow-lg shadow-[#25D366]/10 backdrop-blur-md hover:bg-[#25D366]/35"
          />
        }
      >
        <span className="relative">
          <ShoppingBag className="size-7" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#25D366]/50 bg-black/80 text-xs font-bold text-[#25D366]">
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
              {step !== "comida" && foodItems.length > 0 && (
                <Button variant="ghost" size="icon-sm" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <BrandLogo size="sm" />
              {titles[step]}
              {step === "comida" && (
                <span className="text-amber-400">({foodItems.length})</span>
              )}
            </SheetTitle>
            {foodItems.length > 0 && (
              <p className="text-xs tracking-wide text-zinc-500">
                Paso {stepIndex + 1} de 3
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {foodItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-zinc-500">
                <ShoppingBag className="mb-3 size-10 opacity-40" />
                <p>Elegí primero tu comida</p>
              </div>
            ) : step === "comida" ? (
              <div className="space-y-3">
                {foodItems.map((item) => {
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
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
                    Pedidos de hasta {totalPieces} piezas incluyen 1 soja y 1 teriyaki
                  </div>
                )}
              </div>
            ) : step === "extras" ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Palitos, wasabi, salsas extra… o seguí sin nada más.
                </p>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-4">
                  {extras.map((producto) => (
                    <ExtraRow key={producto.id} producto={producto} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {extraItems.length > 0 && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-300">
                    {extraItems.map((item) => (
                      <p key={item.producto.id}>
                        {item.cantidad}× {item.producto.nombre}
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <p className="font-heading text-sm text-zinc-300">
                    ¿Cómo te contactamos?
                  </p>
                  <p className="text-xs text-zinc-500">
                    Cocina confirma el pedido. La boleta la arma el local al cobrar.
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

          {foodItems.length > 0 && (
            <div className="space-y-3 border-t border-zinc-800 p-4">
              <div className="flex items-center justify-between font-heading text-xl">
                <span>Total</span>
                <span className="text-amber-400">{formatMoney(total)}</span>
              </div>
              {step === "comida" && (
                <Button
                  onClick={() => setStep("extras")}
                  className="h-12 w-full bg-amber-200/15 text-base font-heading tracking-wide text-amber-100 uppercase hover:bg-amber-200/25"
                >
                  Continuar a extras
                </Button>
              )}
              {step === "extras" && (
                <>
                  <Button
                    onClick={() => setStep("datos")}
                    className="h-12 w-full bg-amber-200/15 text-base font-heading tracking-wide text-amber-100 uppercase hover:bg-amber-200/25"
                  >
                    {extraItems.length > 0 ? "Continuar" : "Continuar sin extras"}
                  </Button>
                  {extraItems.length > 0 && (
                    <Button
                      onClick={() => {
                        clearExtras();
                        setStep("datos");
                      }}
                      variant="ghost"
                      className="w-full text-zinc-400"
                    >
                      Quitar extras y continuar
                    </Button>
                  )}
                </>
              )}
              {step === "datos" && (
                <Button
                  onClick={handleCheckout}
                  disabled={sending}
                  variant="outline"
                  className="h-12 w-full border-[#25D366]/55 bg-[#25D366]/20 text-base font-heading tracking-wide text-white uppercase backdrop-blur-sm hover:bg-[#25D366]/35"
                >
                  {sending ? "Enviando..." : "Enviar pedido por WhatsApp"}
                </Button>
              )}
              {step === "comida" && (
                <Button onClick={clearCart} variant="ghost" className="w-full text-zinc-400">
                  Vaciar carrito
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
