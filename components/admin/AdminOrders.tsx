"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  closePedido,
  getLocalPedidos,
  PEDIDOS_UPDATED_EVENT,
  updatePedidoRecord,
} from "@/lib/create-order";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatBoleta, formatMoney, formatPedido } from "@/lib/money";
import { openWhatsApp } from "@/lib/whatsapp";
import {
  MEDIO_PAGO_LABEL,
  type MedioPago,
  type Pedido,
  type PedidoEstado,
} from "@/types";

const ESTADOS: PedidoEstado[] = [
  "pendiente",
  "en_preparacion",
  "listo",
  "entregado",
  "cancelado",
];

const ESTADO_LABEL: Record<PedidoEstado, string> = {
  pendiente: "Nuevo",
  en_preparacion: "En cocina",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const MEDIOS: MedioPago[] = ["efectivo", "transferencia", "mercadopago"];

function normalizePedido(id: string, data: Record<string, unknown>): Pedido {
  const createdAtRaw = data.createdAt as { toMillis?: () => number } | number | undefined;
  const createdAt =
    typeof createdAtRaw === "number"
      ? createdAtRaw
      : createdAtRaw?.toMillis?.() ?? Date.now();

  return {
    ...(data as Omit<Pedido, "id" | "createdAt">),
    id,
    createdAt,
  };
}

function mergePedidos(locals: Pedido[], remote: Pedido[]) {
  const remoteIds = new Set(remote.map((pedido) => pedido.id));
  return [...locals.filter((pedido) => !remoteIds.has(pedido.id)), ...remote].sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export default function AdminOrders() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [medioPorPedido, setMedioPorPedido] = useState<Record<string, MedioPago>>({});
  const [cerrando, setCerrando] = useState<string | null>(null);

  useEffect(() => {
    const refreshLocals = () => {
      const locals = getLocalPedidos();
      setPedidos((current) => {
        const remote = current.filter((pedido) => !pedido.id.startsWith("local-"));
        return mergePedidos(locals, remote);
      });
    };

    setPedidos(getLocalPedidos());
    window.addEventListener(PEDIDOS_UPDATED_EVENT, refreshLocals);

    if (!isFirebaseConfigured || !db) {
      return () => window.removeEventListener(PEDIDOS_UPDATED_EVENT, refreshLocals);
    }

    const q = query(collection(db, "pedidos"), orderBy("numero", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const remote = snapshot.docs.map((docSnap) =>
        normalizePedido(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
      setPedidos(mergePedidos(getLocalPedidos(), remote));
    });

    return () => {
      unsub();
      window.removeEventListener(PEDIDOS_UPDATED_EVENT, refreshLocals);
    };
  }, []);

  const handleEstado = async (pedido: Pedido, estado: PedidoEstado) => {
    try {
      const next = await updatePedidoRecord(pedido, { estado });
      setPedidos((current) => current.map((item) => (item.id === next.id ? next : item)));
    } catch {
      toast.error("No se pudo actualizar el pedido");
    }
  };

  const handleCerrar = async (pedido: Pedido) => {
    const medio = medioPorPedido[pedido.id] || pedido.medioPago;
    if (!medio) {
      toast.error("Elegí el medio de pago para cerrar y emitir la boleta.");
      return;
    }
    setCerrando(pedido.id);
    try {
      const next = await closePedido(pedido, medio);
      setPedidos((current) => current.map((item) => (item.id === next.id ? next : item)));
      toast.success(`Boleta ${formatBoleta(next.numero)} emitida`);
    } catch {
      toast.error("No se pudo cerrar el pedido");
    } finally {
      setCerrando(null);
    }
  };

  if (pedidos.length === 0) {
    return <p className="text-zinc-400">Todavía no hay pedidos.</p>;
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => {
        const emitida = Boolean(pedido.boletaEmitida);
        const codigo = emitida ? formatBoleta(pedido.numero) : formatPedido(pedido.numero);
        const medio = medioPorPedido[pedido.id] || pedido.medioPago;

        return (
          <article
            key={pedido.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl">{codigo}</h3>
                <p className="text-sm text-zinc-400">
                  {pedido.clienteNombre} · {pedido.clienteTelefono}
                </p>
                {pedido.horarioRetiro && (
                  <p className="text-sm text-amber-200/80">Retiro: {pedido.horarioRetiro}</p>
                )}
                <p className="text-xs text-zinc-500">
                  {new Date(pedido.createdAt).toLocaleString("es-AR")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-lg text-amber-400">
                  {formatMoney(pedido.totalCentavos)}
                </p>
                <p className="text-xs text-zinc-500">
                  {emitida
                    ? `Cobrado · ${pedido.medioPago ? MEDIO_PAGO_LABEL[pedido.medioPago] : "Pago"}`
                    : "Sin boleta"}
                </p>
              </div>
            </div>
            <ul className="mb-3 space-y-1 text-sm text-zinc-300">
              {pedido.items.map((item, index) => (
                <li key={`${pedido.id}-${index}`}>
                  {item.cantidad}x {item.nombre}
                  {item.varianteNombre ? ` (${item.varianteNombre})` : ""}
                  {item.conRebozado ? " + rebozado" : ""}
                </li>
              ))}
            </ul>
            {pedido.incluyeSalsasGratis && (
              <p className="mb-3 text-xs text-amber-400">Salsas gratis incluidas</p>
            )}
            {pedido.notas && (
              <p className="mb-3 text-xs text-zinc-400">Notas: {pedido.notas}</p>
            )}

            <p className="mb-2 text-xs tracking-wide text-zinc-500 uppercase">Estado</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {ESTADOS.map((estado) => (
                <Button
                  key={estado}
                  size="sm"
                  variant={pedido.estado === estado ? "default" : "outline"}
                  onClick={() => void handleEstado(pedido, estado)}
                >
                  {ESTADO_LABEL[estado]}
                </Button>
              ))}
            </div>

            {!emitida && pedido.estado !== "cancelado" && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-3">
                <p className="text-sm text-zinc-300">Cerrar pedido y emitir boleta</p>
                <div className="flex flex-wrap gap-2">
                  {MEDIOS.map((opcion) => (
                    <Button
                      key={opcion}
                      size="sm"
                      variant={medio === opcion ? "default" : "outline"}
                      onClick={() =>
                        setMedioPorPedido((current) => ({
                          ...current,
                          [pedido.id]: opcion,
                        }))
                      }
                    >
                      {MEDIO_PAGO_LABEL[opcion]}
                    </Button>
                  ))}
                </div>
                <Button
                  className="h-11 w-full border border-amber-200/30 bg-amber-200/10 text-amber-100 hover:bg-amber-200/20"
                  disabled={cerrando === pedido.id}
                  onClick={() => void handleCerrar(pedido)}
                >
                  {cerrando === pedido.id ? "Cerrando..." : "Cobrar y emitir boleta"}
                </Button>
              </div>
            )}

            {emitida && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/pedido/${pedido.id}`}
                  className="inline-flex h-9 items-center rounded-lg border border-zinc-700 px-3 text-sm text-amber-400"
                >
                  Ver / imprimir boleta
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    openWhatsApp(
                      pedido,
                      `${window.location.origin}/pedido/${pedido.id}`
                    )
                  }
                >
                  Enviar boleta por WhatsApp
                </Button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
