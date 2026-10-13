export const PROMO = {
  comboId: "p_combo_ellas",
  claseId: "p_clase_sushi",
  categoriaId: "cat_para_ellas",
  start: "2026-10-13",
  end: "2026-10-18",
  discountPct: 15,
  claimDays: 30,
  comboPrecio: 55000,
  ventaTexto: "13 al 18 de octubre",
  reclamoTexto: "30 días para reclamar",
  fotoClase: "/clase-sushi.jpg?v=madre2",
} as const;

export type VoucherTipo = "desc15" | "clase";

export function todayArgentina() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Tucuman",
  });
}

export function isPromoActiva(today = todayArgentina()) {
  return today >= PROMO.start && today <= PROMO.end;
}

export function isComboProduct(producto: { id?: string; promo?: string; nombre?: string }) {
  return producto.id === PROMO.comboId || producto.promo === "combo";
}

export function isClaseProduct(producto: { id?: string; promo?: string; nombre?: string }) {
  if (producto.id === PROMO.claseId || producto.promo === "clase") return true;
  return /clase\s+de\s+sushi/i.test(producto.nombre || "");
}

export function isFoodProduct(producto: { id?: string; promo?: string; nombre?: string; categoria_id?: string }) {
  return producto.categoria_id !== "cat_extras" && !isClaseProduct(producto);
}

export function isPromoCategory(categoriaId: string) {
  return categoriaId === PROMO.categoriaId;
}

export function isCustomerVisibleProduct(producto: {
  id: string;
  disponible: boolean;
  precio?: number;
}) {
  if (!producto.disponible) return false;
  if ((isComboProduct(producto) || isClaseProduct(producto)) && !isPromoActiva()) {
    return false;
  }
  return true;
}

export function addClaimDays(fromMs: number, days = PROMO.claimDays) {
  return fromMs + days * 24 * 60 * 60 * 1000;
}

export function formatFechaCorta(ms: number) {
  return new Date(ms).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Tucuman",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function generateVoucherCode(tipo: VoucherTipo) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return tipo === "clase" ? `CLASE-${suffix}` : `ADAN-${suffix}`;
}

export function normalizeVoucherCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function discountFromTotal(total: number, pct = PROMO.discountPct) {
  if (total <= 0) return 0;
  return Math.round((total * pct) / 100);
}

export function getSiteUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sushi-app-five.vercel.app";
}

export function getClaseFotoUrl() {
  return `${getSiteUrl()}${PROMO.fotoClase}`;
}

export function getClaseVoucherUrl(codigo: string) {
  return `${getSiteUrl()}/clase/${encodeURIComponent(normalizeVoucherCode(codigo))}`;
}
