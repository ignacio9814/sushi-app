"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalPedido } from "@/lib/create-order";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatBoleta, formatMoney, formatPedido } from "@/lib/money";
import { openWhatsApp } from "@/lib/whatsapp";
import BrandLogo, { PeruStripe } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import { MEDIO_PAGO_LABEL, type Pedido } from "@/types";

export default function PedidoPage() {
  const params = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    if (id.startsWith("local-") || !isFirebaseConfigured || !db) {
      setPedido(getLocalPedido(id));
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "pedidos", id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Omit<Pedido, "id" | "createdAt"> & {
          createdAt?: { toMillis?: () => number } | number;
        };
        const createdAt =
          typeof data.createdAt === "number"
            ? data.createdAt
            : data.createdAt?.toMillis?.() ?? Date.now();
        setPedido({ ...data, id: snapshot.id, createdAt });
      } else {
        setPedido(getLocalPedido(id));
      }
      setLoading(false);
    });

    return () => unsub();
  }, [params.id]);

  if (loading) {
    return <p className="p-8 text-center text-zinc-400">Cargando comprobante...</p>;
  }

  if (!pedido) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-zinc-400">No encontramos este pedido.</p>
        <Button render={<Link href="/" />}>Volver al menú</Button>
      </div>
    );
  }

  const fecha = new Date(pedido.createdAt).toLocaleString("es-AR");
  const emitida = Boolean(pedido.boletaEmitida);
  const codigo = emitida ? formatBoleta(pedido.numero) : formatPedido(pedido.numero);

  return (
    <div className="min-h-screen bg-black px-4 py-8 print:bg-white print:text-black">
      <div className="mx-auto max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 print:border-black print:bg-white">
        <BrandLogo size="md" className="mx-auto print:invert-0" />
        <PeruStripe className="mx-auto mt-3 max-w-48" />
        <p className="mt-4 text-center text-xs tracking-[0.25em] text-amber-400 uppercase print:text-black">
          {BRAND.name}
        </p>
        <h1 className="mt-1 font-heading text-3xl">
          {emitida ? `Boleta ${codigo}` : `Pedido ${codigo}`}
        </h1>
        <p className="mt-1 text-sm text-zinc-400 print:text-zinc-600">{fecha}</p>
        <p className="mt-4 text-sm">
          {pedido.clienteNombre} · {pedido.clienteTelefono}
        </p>
        {pedido.direccion && <p className="text-sm text-zinc-400">{pedido.direccion}</p>}
        {pedido.horarioRetiro && (
          <p className="text-sm text-amber-200 print:text-black">
            Retiro: {pedido.horarioRetiro}
          </p>
        )}

        <div className="mt-6 space-y-2 border-t border-zinc-800 pt-4 print:border-black">
          {pedido.items.map((item, index) => (
            <div key={`${item.productoId}-${index}`} className="flex justify-between text-sm">
              <span>
                {item.cantidad}x {item.nombre}
                {item.varianteNombre ? ` (${item.varianteNombre})` : ""}
                {item.conRebozado ? " + rebozado" : ""}
              </span>
              <span>{formatMoney(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {pedido.incluyeSalsasGratis && (
          <p className="mt-4 text-sm text-amber-400 print:text-black">
            Incluye 1 salsa soja y 1 teriyaki
          </p>
        )}

        {pedido.notas && (
          <p className="mt-3 text-sm text-zinc-400">Notas: {pedido.notas}</p>
        )}

        <div className="mt-6 flex items-end justify-between border-t border-zinc-800 pt-4 print:border-black">
          <p className="text-sm text-zinc-400 print:text-zinc-600">
            {emitida && pedido.medioPago
              ? `Pago: ${MEDIO_PAGO_LABEL[pedido.medioPago]}`
              : "Pago: pendiente de cierre"}
          </p>
          <p className="font-heading text-2xl text-amber-400 print:text-black">
            {formatMoney(pedido.totalCentavos)}
          </p>
        </div>

        <p className="mt-4 text-xs text-zinc-500 print:text-zinc-600">
          {emitida
            ? "Boleta interna emitida al cerrar el pedido. No es factura fiscal."
            : "Comanda de cocina. La boleta se emite cuando el local cobra y cierra el pedido."}
        </p>

        <div className="mt-6 flex flex-col gap-2 print:hidden">
          {emitida && (
            <>
              <Button
                variant="outline"
                className="h-11 border-[#25D366]/55 bg-[#25D366]/20 text-white hover:bg-[#25D366]/35"
                onClick={() => openWhatsApp(pedido, window.location.href)}
              >
                Enviar boleta por WhatsApp
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 size-4" />
                Imprimir boleta
              </Button>
            </>
          )}
          <Button variant="ghost" render={<Link href="/" />}>
            Volver al menú
          </Button>
        </div>
      </div>
    </div>
  );
}
