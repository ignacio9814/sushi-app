import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatBoleta, itemUnitPrice, piecesOfLine } from "@/lib/money";
import {
  REBOZADO_CENTAVOS,
  SALSAS_MAX_PIEZAS,
  type CartItem,
  type Pedido,
  type PedidoItem,
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
    numeroFormateado: formatBoleta(numero),
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
  };
}

const LOCAL_PEDIDOS_KEY = "sushi_pedidos_local";
const LOCAL_COUNTER_KEY = "sushi_boleta_counter";

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
