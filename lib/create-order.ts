import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatPedido, itemUnitPrice, piecesOfLine } from "@/lib/money";
import {
  REBOZADO_CENTAVOS,
  SALSAS_MAX_PIEZAS,
  type CartItem,
  type MedioPago,
  type Pedido,
  type PedidoEstado,
  type PedidoItem,
  type PedidoPago,
} from "@/types";

export interface CheckoutPayload {
  clienteNombre: string;
  clienteTelefono: string;
  direccion?: string;
  notas?: string;
}

function buildPedidoDraft(
  items: CartItem[],
  payload: CheckoutPayload,
  numero: number,
  id: string
): Pedido {
  const pedidoItems: PedidoItem[] = items.map((item) => {
    const precioUnitario = itemUnitPrice(
      item.producto.precio,
      item.variante?.precio,
      Boolean(item.conRebozado),
      REBOZADO_CENTAVOS
    );
    return {
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      varianteNombre: item.variante?.nombre,
      cantidad: item.cantidad,
      conRebozado: Boolean(item.conRebozado),
      precioUnitario,
      subtotal: precioUnitario * item.cantidad,
    };
  });

  const piezas = items.reduce((total, item) => total + piecesOfLine(item), 0);

  const totalCentavos = pedidoItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id,
    numero,
    numeroFormateado: formatPedido(numero),
    createdAt: Date.now(),
    clienteNombre: payload.clienteNombre.trim(),
    clienteTelefono: payload.clienteTelefono.trim(),
    direccion: payload.direccion?.trim() || undefined,
    notas: payload.notas?.trim() || undefined,
    items: pedidoItems,
    totalCentavos,
    piezas,
    incluyeSalsasGratis: piezas > 0 && piezas <= SALSAS_MAX_PIEZAS,
    estado: "pendiente",
    pago: "pendiente",
    boletaEmitida: false,
  };
}

const LOCAL_PEDIDOS_KEY = "sushi_pedidos_local";
const LOCAL_COUNTER_KEY = "sushi_boleta_counter";
export const PEDIDOS_UPDATED_EVENT = "sushi-pedidos-updated";

function nextLocalNumero() {
  const current = Number(window.localStorage.getItem(LOCAL_COUNTER_KEY) || "0");
  const next = current + 1;
  window.localStorage.setItem(LOCAL_COUNTER_KEY, String(next));
  return next;
}

function readLocalPedidos(): Record<string, Pedido> {
  try {
    const raw = window.localStorage.getItem(LOCAL_PEDIDOS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Pedido>) : {};
  } catch {
    return {};
  }
}

export function getLocalPedido(id: string): Pedido | null {
  return readLocalPedidos()[id] ?? null;
}

export function getLocalPedidos(): Pedido[] {
  return Object.values(readLocalPedidos()).sort((a, b) => b.createdAt - a.createdAt);
}

function saveLocalPedido(pedido: Pedido) {
  const all = readLocalPedidos();
  all[pedido.id] = pedido;
  window.localStorage.setItem(LOCAL_PEDIDOS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(PEDIDOS_UPDATED_EVENT));
}

export async function updatePedidoRecord(
  pedido: Pedido,
  data: {
    estado?: PedidoEstado;
    pago?: PedidoPago;
    medioPago?: MedioPago;
    boletaEmitida?: boolean;
    cerradoAt?: number;
  }
) {
  const next: Pedido = { ...pedido, ...data };

  if (!isFirebaseConfigured || !db || pedido.id.startsWith("local-")) {
    saveLocalPedido(next);
    return next;
  }

  const { id: _id, createdAt: _createdAt, ...rest } = next;
  await updateDoc(doc(db, "pedidos", pedido.id), rest);
  return next;
}

export async function closePedido(pedido: Pedido, medioPago: MedioPago) {
  return updatePedidoRecord(pedido, {
    medioPago,
    pago: "cobrado",
    boletaEmitida: true,
    estado: "entregado",
    cerradoAt: Date.now(),
  });
}

export async function createOrder(
  items: CartItem[],
  payload: CheckoutPayload
): Promise<Pedido> {
  if (items.length === 0) {
    throw new Error("El carrito está vacío");
  }

  if (!isFirebaseConfigured || !db) {
    const numero = nextLocalNumero();
    const id = `local-${numero}`;
    const pedido = buildPedidoDraft(items, payload, numero, id);
    saveLocalPedido(pedido);
    return pedido;
  }

  const firestore = db;
  return runTransaction(firestore, async (transaction) => {
    const counterRef = doc(firestore, "config", "sistema");
    const counterSnap = await transaction.get(counterRef);
    const numero = (counterSnap.data()?.ultimoBoleta ?? 0) + 1;
    const pedidoRef = doc(collection(firestore, "pedidos"));
    const pedido = buildPedidoDraft(items, payload, numero, pedidoRef.id);

    transaction.set(
      counterRef,
      { ultimoBoleta: numero, updatedAt: serverTimestamp() },
      { merge: true }
    );
    transaction.set(pedidoRef, {
      ...pedido,
      createdAt: serverTimestamp(),
    });

    return pedido;
  });
}
