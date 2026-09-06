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
} from "@/components/ui/sheet";
import { getSeedCatalog, subscribeCatalog } from "@/lib/catalog";
import { createOrder } from "@/lib/create-order";
import { formatMoney } from "@/lib/money";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { formatRetiroEstimado } from "@/lib/retiro";
import { useCart } from "@/store/useCart";
import { isExtraProduct, type Producto } from "@/types";

type CheckoutStep = "comida" | "extras" | "datos";

const STEPS: CheckoutStep[] = ["comida", "extras", "datos"];

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getTotalItems,
    clearCart,
    clearExtras,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("comida");
  const [sending, setSending] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [retiroHora, setRetiroHora] = useState("");
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
  const totalItems = getTotalItems();
  const stepIndex = STEPS.indexOf(step);

  const titles: Record<CheckoutStep, string> = {
    comida: "Tu pedido",
    extras: "Extras",
    datos: "Tus datos",
  };

  const hints: Record<CheckoutStep, string> = {
    comida: "Revisá cantidades y seguí al siguiente paso.",
    extras: "Opcional. Sumá palitos o salsas, o continuá sin nada más.",
    datos: "Nombre, WhatsApp y un horario estimado de retiro.",
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
    if (!retiroHora) {
      toast.error("Indicá un horario estimado de retiro.");
      return;
    }

    setSending(true);
    try {
      const pedido = await createOrder(items, {
        clienteNombre: nombre,
        clienteTelefono: telefono,
        direccion,
        horarioRetiro: formatRetiroEstimado(retiroHora),
        notas,
      });
      clearCart();
      setOpen(false);
      setNombre("");
      setTelefono("");
      setDireccion("");
      setRetiroHora("");
      setNotas("");
      toast.success(`Pedido ${pedido.numeroFormateado} enviado a cocina`);
      window.location.assign(getWhatsAppUrl(pedido));
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
      {totalItems > 0 && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cart-bar-enter fixed inset-x-3 z-50 flex h-16 items-center justify-between rounded-2xl bg-[#25D366] px-5 text-left text-white shadow-[0_12px_40px_rgba(37,211,102,0.45)] bottom-[max(0.75rem,env(safe-area-inset-bottom))] hover:bg-[#20bd5a]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
              <ShoppingBag className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold">Ver pedido</span>
              <span className="block text-sm text-white/85">
                {totalItems} {totalItems === 1 ? "producto" : "productos"}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-lg font-bold">{formatMoney(total)}</span>
        </button>
      )}
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/45 backdrop-blur-none"
        className="flex h-[92dvh] max-h-[92dvh] min-h-0 w-full flex-col gap-0 overflow-hidden rounded-t-3xl border-[#d9c9a3] bg-[#F9F7F2] pt-[env(safe-area-inset-top)] text-[#1A1A1A] data-[side=bottom]:h-[92dvh] data-[side=bottom]:max-h-[92dvh] sm:max-w-none"
      >
        <div className="flex min-h-0 flex-1 flex-col bg-[#F9F7F2]">
          <SheetHeader className="shrink-0 border-b border-[#d9c9a3] bg-[#F9F7F2]">
            <SheetTitle className="flex items-center gap-2 text-xl">
              {step !== "comida" && foodItems.length > 0 && (
                <Button variant="ghost" size="icon-sm" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              {titles[step]}
              {step === "comida" && foodItems.length > 0 && (
                <span className="text-[#9B2B2B]">({foodItems.length})</span>
              )}
            </SheetTitle>
            {foodItems.length > 0 && (
              <ol className="mt-3 flex items-center gap-2 text-xs">
                {STEPS.map((id, index) => (
                  <li key={id} className="flex flex-1 items-center gap-2">
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full ${
                        index <= stepIndex
                          ? "bg-[#9B2B2B] text-[#F9F7F2]"
                          : "bg-[#eee6d6] text-[#8a8174]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={
                        index <= stepIndex ? "font-medium text-[#1A1A1A]" : "text-[#8a8174]"
                      }
                    >
                      {id === "comida" ? "Pedido" : id === "extras" ? "Extras" : "Datos"}
                    </span>
                    {index < STEPS.length - 1 && (
                      <span className="h-px flex-1 bg-[#d9c9a3]" />
                    )}
                  </li>
                ))}
              </ol>
            )}
            {foodItems.length > 0 && (
              <p className="mt-3 text-sm text-[#6b6256]">{hints[step]}</p>
            )}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F9F7F2] p-4 [-webkit-overflow-scrolling:touch]">
            {foodItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-[#8a8174]">
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
                      className="rounded-2xl border border-[#d9c9a3] bg-white p-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-heading text-base">{item.producto.nombre}</p>
                          {item.variante && (
                            <p className="text-sm text-[#6b6256]">{item.variante.nombre}</p>
                          )}
                          {item.conRebozado && (
                            <p className="mt-1 text-xs text-[#9B2B2B]">+ Rebozado</p>
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
                        <p className="font-semibold text-[#9B2B2B]">
                          {formatMoney(itemTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : step === "extras" ? (
              <div className="space-y-3">
                <p className="text-sm text-[#6b6256]">
                  Palitos, wasabi, salsas extra… o seguí sin nada más.
                </p>
                <div className="rounded-2xl border border-[#d9c9a3] bg-white px-4">
                  {extras.map((producto) => (
                    <ExtraRow key={producto.id} producto={producto} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {extraItems.length > 0 && (
                  <div className="rounded-2xl border border-[#d9c9a3] bg-white p-3 text-sm text-[#1A1A1A]">
                    {extraItems.map((item) => (
                      <p key={item.producto.id}>
                        {item.cantidad}× {item.producto.nombre}
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-3 rounded-2xl border border-[#d9c9a3] bg-white p-3">
                  <p className="font-heading text-sm text-[#1A1A1A]">
                    ¿Cómo te contactamos?
                  </p>
                  <p className="text-xs text-[#8a8174]">
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
                  <div className="space-y-2">
                    <label className="block space-y-1">
                      <span className="text-sm text-[#1A1A1A]">Horario estimado de retiro</span>
                      <Input
                        type="time"
                        value={retiroHora}
                        onChange={(e) => setRetiroHora(e.target.value)}
                        required
                      />
                    </label>
                  </div>
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
            <div className="shrink-0 space-y-3 border-t border-[#d9c9a3] bg-[#F9F7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between font-heading text-xl">
                <span>Total</span>
                <span className="text-[#9B2B2B]">{formatMoney(total)}</span>
              </div>
              {step === "comida" && (
                <Button
                  onClick={() => setStep("extras")}
                  className="h-14 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#20bd5a]"
                >
                  Siguiente
                </Button>
              )}
              {step === "extras" && (
                <>
                  <Button
                    onClick={() => setStep("datos")}
                    className="h-14 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#20bd5a]"
                  >
                    {extraItems.length > 0 ? "Siguiente" : "Siguiente, sin extras"}
                  </Button>
                  {extraItems.length > 0 && (
                    <Button
                      onClick={() => {
                        clearExtras();
                        setStep("datos");
                      }}
                      variant="ghost"
                      className="w-full text-[#8a8174]"
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
                  className="h-14 w-full border-transparent bg-[#25D366] text-base font-semibold text-white hover:bg-[#20bd5a]"
                >
                  {sending ? "Enviando..." : "Enviar pedido por WhatsApp"}
                </Button>
              )}
              {step === "comida" && (
                <Button onClick={clearCart} variant="ghost" className="w-full text-[#8a8174]">
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
