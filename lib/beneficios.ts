import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addClaimDays,
  generateVoucherCode,
  normalizeVoucherCode,
  type VoucherTipo,
} from "@/lib/promo";

export interface Beneficio {
  codigo: string;
  tipo: VoucherTipo;
  clienteNombre: string;
  clienteTelefono: string;
  pedidoId: string;
  pedidoNumero: string;
  createdAt: number;
  venceAt: number;
  usado: boolean;
  usadoAt?: number;
  usadoPedidoId?: string;
}

export const BENEFICIOS_UPDATED_EVENT = "sushi-beneficios-updated";
const LOCAL_KEY = "sushi_beneficios";
const REMOTE_PATH = ["config", "beneficios"] as const;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readBeneficios(): Beneficio[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Beneficio[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalBeneficios(items: Beneficio[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(BENEFICIOS_UPDATED_EVENT));
}

function upsertLocal(beneficio: Beneficio) {
  const current = readBeneficios();
  const next = [
    beneficio,
    ...current.filter((item) => item.codigo !== beneficio.codigo),
  ];
  writeLocalBeneficios(next);
  return next;
}

async function writeRemote(items: Beneficio[]) {
  if (!db) return;
  const byCodigo = Object.fromEntries(items.map((item) => [item.codigo, item]));
  await setDoc(doc(db, ...REMOTE_PATH), {
    items: byCodigo,
    updatedAt: Date.now(),
  });
}

export function estadoBeneficio(beneficio: Beneficio, now = Date.now()) {
  if (beneficio.usado) return "usado" as const;
  if (now > beneficio.venceAt) return "vencido" as const;
  return "vigente" as const;
}

export function findBeneficio(codigo: string, list = readBeneficios()) {
  const normalized = normalizeVoucherCode(codigo);
  return list.find((item) => item.codigo === normalized) ?? null;
}

export async function loadRemoteBeneficios() {
  if (!db) return readBeneficios();
  try {
    const snap = await getDoc(doc(db, ...REMOTE_PATH));
    const items = snap.data()?.items;
    if (!items || typeof items !== "object") return readBeneficios();
    const remote = Object.values(items) as Beneficio[];
    const byCodigo = new Map(readBeneficios().map((item) => [item.codigo, item]));
    remote.forEach((item) => {
      if (item?.codigo) byCodigo.set(item.codigo, item);
    });
    writeLocalBeneficios([...byCodigo.values()]);
  } catch {
    // local list is enough if Firebase is down
  }
  return readBeneficios();
}

export function validateDiscountCode(codigo: string, list = readBeneficios()) {
  const beneficio = findBeneficio(codigo, list);
  if (!beneficio || beneficio.tipo !== "desc15") {
    return { ok: false as const, error: "Ese código no existe." };
  }
  const estado = estadoBeneficio(beneficio);
  if (estado === "usado") {
    return { ok: false as const, error: "Ese código ya fue usado." };
  }
  if (estado === "vencido") {
    return { ok: false as const, error: "Ese código ya venció." };
  }
  return { ok: true as const, beneficio };
}

export function issueBeneficio(input: {
  tipo: VoucherTipo;
  clienteNombre: string;
  clienteTelefono: string;
  pedidoId: string;
  pedidoNumero: string;
  createdAt?: number;
}): Beneficio {
  const createdAt = input.createdAt ?? Date.now();
  const beneficio: Beneficio = {
    codigo: generateVoucherCode(input.tipo),
    tipo: input.tipo,
    clienteNombre: input.clienteNombre,
    clienteTelefono: input.clienteTelefono,
    pedidoId: input.pedidoId,
    pedidoNumero: input.pedidoNumero,
    createdAt,
    venceAt: addClaimDays(createdAt),
    usado: false,
  };
  const next = upsertLocal(beneficio);
  void writeRemote(next).catch(() => undefined);
  return beneficio;
}

export function redeemBeneficio(codigo: string, usadoPedidoId: string) {
  const current = findBeneficio(codigo);
  if (!current) return null;
  const next: Beneficio = {
    ...current,
    usado: true,
    usadoAt: Date.now(),
    usadoPedidoId,
  };
  const all = upsertLocal(next);
  void writeRemote(all).catch(() => undefined);
  return next;
}

export function markBeneficioUsed(codigo: string) {
  return redeemBeneficio(codigo, "manual");
}

export function subscribeBeneficios(onData: (items: Beneficio[]) => void) {
  onData(readBeneficios());

  const onLocal = () => onData(readBeneficios());
  if (typeof window !== "undefined") {
    window.addEventListener(BENEFICIOS_UPDATED_EVENT, onLocal);
  }

  const unsubRemote = db
    ? onSnapshot(doc(db, ...REMOTE_PATH), (snapshot) => {
        const items = snapshot.data()?.items;
        if (!items || typeof items !== "object") return;
        const remote = Object.values(items) as Beneficio[];
        const local = readBeneficios();
        const byCodigo = new Map(local.map((item) => [item.codigo, item]));
        remote.forEach((item) => {
          if (!item?.codigo) return;
          const existing = byCodigo.get(item.codigo);
          const existingTime = Math.max(existing?.usadoAt ?? 0, existing?.createdAt ?? 0);
          const remoteTime = Math.max(item.usadoAt ?? 0, item.createdAt ?? 0);
          if (!existing || remoteTime >= existingTime) {
            byCodigo.set(item.codigo, item);
          }
        });
        writeLocalBeneficios([...byCodigo.values()]);
      })
    : () => {};

  return () => {
    unsubRemote();
    if (typeof window !== "undefined") {
      window.removeEventListener(BENEFICIOS_UPDATED_EVENT, onLocal);
    }
  };
}
