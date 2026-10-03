"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import ExtraRow from "@/components/ExtraRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MEDIO_PAGO_LABEL, type MedioPago, type Pedido } from "@/types";
import { BUSINESS, formatIncluyeItems } from "@/lib/business";
import { formatRetiroEstimado, RETIRO_HORAS } from "@/lib/retiro";
import { useCart } from "@/store/useCart";
import { isExtraProduct, type Producto } from "@/types";

type CheckoutStep = "comida" | "extras" | "datos" | "pago";

const STEPS: CheckoutStep[] = ["comida", "extras", "datos", "pago"];
const PAGOS_CLIENTE: MedioPago[] = ["efectivo", "transferencia"];

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getTotalItems,
    getTotalPieces,
    clearCart,
    clearExtras,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [sentPedido, setSentPedido] = useState<Pedido | null>(null);
  const [step, setStep] = useState<CheckoutStep>("comida");
  const [sending, setSending] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [retiroHora, setRetiroHora] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
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
  const totalPieces = getTotalPieces();
  const incluyeItems = formatIncluyeItems(totalPieces);
  const stepIndex = STEPS.indexOf(step);

  const titles: Record<CheckoutStep, string> = {
    comida: "Tu pedido",
    extras: "Extras",
    datos: "Tus datos",
    pago: "¿Cómo vas a pagar?",
  };

  const hints: Record<CheckoutStep, string> = {
    comida: "Revisá cantidades y seguí al siguiente paso.",
    extras: "¿Te gustaría agregar algo más?",
    datos: "Nombre, WhatsApp y un horario de retiro (20 a 22 hs).",
    pago: "Elegí una opción. Sin esto no se puede enviar el pedido.",
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setStep("comida");
      setMedioPago("");
    }
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
      toast.error("Indicá el horario estimado de retiro.");
      setStep("datos");
      return;
    }
    if (medioPago !== "efectivo" && medioPago !== "transferencia") {
      toast.error("Elegí si vas a pagar en efectivo o por transferencia.");
      setStep("pago");
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
        medioPago,
      });
      clearCart();
      setOpen(false);
      setNombre("");
      setTelefono("");
      setDireccion("");
      setRetiroHora("");
      setMedioPago("");
      setNotas("");
      setSentPedido(pedido);
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
    if (step === "pago") setStep("datos");
  };

  return (
    <>
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
              <ol className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[11px] [scrollbar-width:none] sm:gap-2 sm:text-xs [&::-webkit-scrollbar]:hidden">
                {STEPS.map((id, index) => (
                  <li key={id} className="flex flex-1 items-center gap-2">
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full ${
                        index <= stepIndex
                          ? "bg-[#C5A059] text-[#1A1A1A]"
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
                      {id === "comida"
                        ? "Pedido"
                        : id === "extras"
                          ? "Extra"
                          : id === "datos"
                            ? "Datos"
                            : "Pago"}
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
                <div className="rounded-2xl border-2 border-[#C5A059] bg-[#C5A059]/18 px-4 py-4">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
                    Tu pedido ya incluye
                  </p>
                  {totalPieces > 0 && (
                    <ul className="mt-2 space-y-1 text-base font-medium text-[#1A1A1A]">
                      {incluyeItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <p
                    className={
                      totalPieces > 0
                        ? "mt-2 text-sm text-[#6b6256]"
                        : "mt-2 text-base font-medium leading-snug text-[#1A1A1A]"
                    }
                  >
                    {BUSINESS.salsaTexto}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-heading text-lg text-[#1A1A1A]">
                    ¿Te gustaría agregar algo más?
                  </p>
                  <p className="text-sm text-[#6b6256]">
                    Es opcional. Si no, seguí al siguiente paso.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d9c9a3] bg-white px-4">
                  {extras.map((producto) => (
                    <ExtraRow key={producto.id} producto={producto} />
                  ))}
                </div>
              </div>
            ) : step === "datos" ? (
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
                      <span className="text-sm text-[#1A1A1A]">Horario de retiro (20 a 22 hs)</span>
                      <select
                        value={retiroHora}
                        onChange={(e) => setRetiroHora(e.target.value)}
                        required
                        className="h-10 w-full rounded-xl border border-[#d9c9a3] bg-[#F9F7F2] px-3 text-sm text-[#1A1A1A]"
                      >
                        <option value="">Elegí la hora</option>
                        {RETIRO_HORAS.map((hora) => (
                          <option key={hora} value={hora}>
                            {hora} hs
                          </option>
                        ))}
                      </select>
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
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-[#C5A059] bg-[#C5A059]/18 px-4 py-4">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
                    Obligatorio
                  </p>
                  <p className="mt-2 font-heading text-xl leading-snug text-[#1A1A1A]">
                    ¿Vas a pagar en efectivo o por transferencia?
                  </p>
                  <p className="mt-2 text-sm text-[#6b6256]">
                    Tocá una opción. El pedido no se envía hasta que elijas.
                  </p>
                </div>
                <div className="grid gap-3">
                  {PAGOS_CLIENTE.map((opcion) => {
                    const selected = medioPago === opcion;
                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => setMedioPago(opcion)}
                        className={`rounded-2xl border-2 px-4 py-5 text-left transition ${
                          selected
                            ? "border-[#C5A059] bg-[#C5A059]/20"
                            : "border-[#d9c9a3] bg-white"
                        }`}
                      >
                        <p className="font-heading text-2xl text-[#1A1A1A]">
                          {MEDIO_PAGO_LABEL[opcion]}
                        </p>
                        <p className="mt-1 text-sm text-[#6b6256]">
                          {opcion === "efectivo"
                            ? "Pagás al retirar en el local."
                            : "El local te pasa los datos por WhatsApp."}
                        </p>
                        {selected && (
                          <p className="mt-3 text-sm font-semibold text-[#9B2B2B]">
                            Elegido
                          </p>
                        )}
                      </button>
                    );
                  })}
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
                  className="h-14 w-full bg-[#1A1A1A] text-base font-semibold text-white hover:bg-[#333]"
                >
                  Siguiente
                </Button>
              )}
              {step === "extras" && (
                <>
                  <Button
                    onClick={() => setStep("datos")}
                    className="h-14 w-full bg-[#1A1A1A] text-base font-semibold text-white hover:bg-[#333]"
                  >
                    {extraItems.length > 0 ? "Siguiente" : "No, continuar"}
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
                  onClick={() => {
                    if (!nombre.trim() || !telefono.trim()) {
                      toast.error("Dejanos nombre y WhatsApp para confirmar el pedido.");
                      return;
                    }
                    if (!retiroHora) {
                      toast.error("Indicá el horario estimado de retiro.");
                      return;
                    }
                    setStep("pago");
                  }}
                  className="h-14 w-full bg-[#1A1A1A] text-base font-semibold text-white hover:bg-[#333]"
                >
                  Siguiente
                </Button>
              )}
              {step === "pago" && (
                <>
                  {!medioPago && (
                    <p className="text-center text-sm font-medium text-[#9B2B2B]">
                      Elegí efectivo o transferencia para continuar
                    </p>
                  )}
                  <Button
                    onClick={handleCheckout}
                    disabled={sending || !medioPago}
                    variant="outline"
                    className="h-14 w-full border-transparent bg-[#25D366] text-base font-semibold text-white hover:bg-[#20bd5a] disabled:bg-[#9ad5b3] disabled:text-white"
                  >
                    {sending
                      ? "Enviando..."
                      : medioPago
                        ? `Enviar · ${MEDIO_PAGO_LABEL[medioPago]}`
                        : "Enviar pedido por WhatsApp"}
                  </Button>
                </>
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

    <Dialog open={Boolean(sentPedido)} onOpenChange={(next) => !next && setSentPedido(null)}>
      <DialogContent
        overlayClassName="bg-black/45 backdrop-blur-none"
        className="border-[#d9c9a3] bg-[#F9F7F2] text-[#1A1A1A] sm:max-w-md"
      >
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="font-heading text-2xl">Pedido enviado</DialogTitle>
          <DialogDescription className="text-base text-[#6b6256]">
            {sentPedido ? (
              <>
                Pedido {sentPedido.numeroFormateado}
                {sentPedido.medioPago
                  ? ` · ${MEDIO_PAGO_LABEL[sentPedido.medioPago]}`
                  : ""}
                . Te confirmamos por WhatsApp.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {sentPedido && (
          <div className="flex flex-col gap-2">
            <a
              href={getWhatsAppUrl(sentPedido)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#20bd5a]"
            >
              Abrir WhatsApp
            </a>
            <Button
              variant="ghost"
              className="w-full text-[#6b6256]"
              onClick={() => setSentPedido(null)}
            >
              Seguir en el menú
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
