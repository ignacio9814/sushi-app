"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLocalPedidos } from "@/lib/create-order";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatMoney } from "@/lib/money";
import type { Pedido, PedidoEstado, PedidoPago } from "@/types";

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

function normalizePedido(
  id: string,
  data: Record<string, unknown>
): Pedido {
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

export default function AdminOrders() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    const locals = getLocalPedidos();
    setPedidos(locals);

    if (!isFirebaseConfigured || !db) {
      return;
    }

    const q = query(collection(db, "pedidos"), orderBy("numero", "desc"));
    return onSnapshot(q, (snapshot) => {
      const remote = snapshot.docs.map((docSnap) =>
        normalizePedido(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
      const remoteIds = new Set(remote.map((pedido) => pedido.id));
      setPedidos([
        ...locals.filter((pedido) => !remoteIds.has(pedido.id)),
        ...remote,
      ]);
    });
  }, []);

  const updatePedido = async (
    pedido: Pedido,
    data: { estado?: PedidoEstado; pago?: PedidoPago }
  ) => {
    if (!db || pedido.id.startsWith("local-")) {
      toast.error("Este pedido es local. Conectá Firebase para gestionarlo en vivo.");
      return;
    }
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), data);
    } catch {
      toast.error("No se pudo actualizar el pedido");
    }
  };

  if (pedidos.length === 0) {
    return <p className="text-zinc-400">Todavía no hay pedidos.</p>;
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => (
        <article
          key={pedido.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-xl">{pedido.numeroFormateado}</h3>
              <p className="text-sm text-zinc-400">
                {pedido.clienteNombre} · {pedido.clienteTelefono}
              </p>
              <p className="text-xs text-zinc-500">
                {new Date(pedido.createdAt).toLocaleString("es-AR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading text-lg text-amber-400">
                {formatMoney(pedido.totalCentavos)}
              </p>
              <p className="text-xs text-zinc-500">
                {pedido.pago === "cobrado" ? "Cobrado" : "Pago pendiente"}
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
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((estado) => (
              <Button
                key={estado}
                size="sm"
                variant={pedido.estado === estado ? "default" : "outline"}
                onClick={() => updatePedido(pedido, { estado })}
              >
                {ESTADO_LABEL[estado]}
              </Button>
            ))}
            <Button
              size="sm"
              variant={pedido.pago === "cobrado" ? "default" : "outline"}
              onClick={() =>
                updatePedido(pedido, {
                  pago: pedido.pago === "cobrado" ? "pendiente" : "cobrado",
                })
              }
            >
              {pedido.pago === "cobrado" ? "Cobrado" : "Marcar cobrado"}
            </Button>
            <a
              href={`/pedido/${pedido.id}`}
              className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-[#c41e3a] hover:underline"
            >
              Ver boleta
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
