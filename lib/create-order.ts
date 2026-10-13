import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  issueBeneficio,
  loadRemoteBeneficios,
  redeemBeneficio,
  validateDiscountCode,
} from "@/lib/beneficios";
import { includedSets } from "@/lib/business";
import { formatPedido, itemUnitPrice, piecesOfLine } from "@/lib/money";
import { countMatchingItems, discountFromTotal, isClaseProduct, isComboProduct } from "@/lib/promo";
import {
  REBOZADO_CENTAVOS,
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
  horarioRetiro?: string;
  notas?: string;
  medioPago: MedioPago;
  codigoBeneficio?: string;
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
    horarioRetiro: payload.horarioRetiro?.trim() || undefined,
    notas: payload.notas?.trim() || undefined,
    items: pedidoItems,
    totalCentavos,
    piezas,
    incluyeSalsasGratis: includedSets(piezas) > 0,
    estado: "pendiente",
    pago: "pendiente",
    medioPago: payload.medioPago,
    boletaEmitida: false,
  };
}

function applyDiscount(pedido: Pedido, payload: CheckoutPayload) {
  const codigo = payload.codigoBeneficio?.trim();
  if (!codigo) return pedido;
  const check = validateDiscountCode(codigo);
  if (!check.ok) {
    throw new Error(check.error);
  }
  const descuentoCentavos = discountFromTotal(pedido.totalCentavos);
  return {
    ...pedido,
    descuentoCodigo: check.beneficio.codigo,
    descuentoCentavos,
    totalCentavos: Math.max(0, pedido.totalCentavos - descuentoCentavos),
  };
}

function attachIssuedVouchers(pedido: Pedido, items: CartItem[]) {
  const vouchers = [];
  const comboQty = countMatchingItems(items, isComboProduct);
  const claseQty = countMatchingItems(items, isClaseProduct);

  for (let index = 0; index < comboQty; index += 1) {
    const issued = issueBeneficio({
      tipo: "desc15",
      clienteNombre: pedido.clienteNombre,
      clienteTelefono: pedido.clienteTelefono,
      pedidoId: pedido.id,
      pedidoNumero: pedido.numeroFormateado,
      createdAt: pedido.createdAt,
    });
    vouchers.push({
      codigo: issued.codigo,
      tipo: issued.tipo,
      venceAt: issued.venceAt,
    });
  }

  for (let index = 0; index < claseQty; index += 1) {
    const issued = issueBeneficio({
      tipo: "clase",
      clienteNombre: pedido.clienteNombre,
      clienteTelefono: pedido.clienteTelefono,
      pedidoId: pedido.id,
      pedidoNumero: pedido.numeroFormateado,
      createdAt: pedido.createdAt,
    });
    vouchers.push({
      codigo: issued.codigo,
      tipo: issued.tipo,
      venceAt: issued.venceAt,
    });
  }

  return vouchers.length ? { ...pedido, vouchers } : pedido;
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
  saveLocalPedido(next);

  if (!isFirebaseConfigured || !db || pedido.id.startsWith("local-")) {
    return next;
  }

  try {
    const { id: _id, createdAt: _createdAt, ...rest } = next;
    await updateDoc(doc(db, "pedidos", pedido.id), JSON.parse(JSON.stringify(rest)));
  } catch (error) {
    console.error("No se pudo actualizar el pedido en Firebase; queda en este dispositivo.", error);
  }
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

  await loadRemoteBeneficios();

  const numeroLocal = nextLocalNumero();
  let localPedido = applyDiscount(
    buildPedidoDraft(items, payload, numeroLocal, `local-${numeroLocal}`),
    payload
  );
  localPedido = attachIssuedVouchers(localPedido, items);
  if (localPedido.descuentoCodigo) {
    redeemBeneficio(localPedido.descuentoCodigo, localPedido.id);
  }
  saveLocalPedido(localPedido);

  if (!isFirebaseConfigured || !db) {
    return localPedido;
  }

  const firestore = db;
  try {
    return await runTransaction(firestore, async (transaction) => {
    const counterRef = doc(firestore, "config", "sistema");
    const counterSnap = await transaction.get(counterRef);
    const numero = (counterSnap.data()?.ultimoBoleta ?? 0) + 1;
    const pedidoRef = doc(collection(firestore, "pedidos"));
    const pedido = {
      ...applyDiscount(buildPedidoDraft(items, payload, numero, pedidoRef.id), payload),
      vouchers: localPedido.vouchers,
    };

    transaction.set(
      counterRef,
      { ultimoBoleta: numero, updatedAt: serverTimestamp() },
      { merge: true }
    );
    transaction.set(pedidoRef, {
      ...JSON.parse(JSON.stringify(pedido)),
      createdAt: serverTimestamp(),
    });

      return pedido;
    });
  } catch (error) {
    console.error("Firebase no guardó el pedido; queda en este dispositivo.", error);
    return localPedido;
  }
}
