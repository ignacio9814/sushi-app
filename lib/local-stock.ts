export const STOCK_UPDATED_EVENT = "sushi-stock-updated";
const STOCK_KEY = "sushi_stock_local";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function isAvailable(producto: { disponible?: unknown }) {
  return producto.disponible === true || producto.disponible === "true";
}

export function readLocalStock(): Record<string, boolean> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STOCK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([id, value]) => [id, value === true || value === "true"])
    );
  } catch {
    return {};
  }
}

export function writeLocalStock(productId: string, disponible: boolean) {
  const next = { ...readLocalStock(), [productId]: disponible };
  window.localStorage.setItem(STOCK_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(STOCK_UPDATED_EVENT));
}

export function applyLocalStock<T extends { id: string; disponible?: unknown }>(productos: T[]) {
  const stock = readLocalStock();
  return productos.map((producto) => {
    if (producto.id in stock) {
      return { ...producto, disponible: stock[producto.id] };
    }
    return { ...producto, disponible: isAvailable(producto) };
  });
}
