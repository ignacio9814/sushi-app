import type { Producto } from "@/types";

export const CATALOG_UPDATED_EVENT = "sushi-catalog-updated";
const LOCAL_PRODUCTOS_KEY = "sushi_productos_local";

export function readLocalProductos(): Producto[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PRODUCTOS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Producto[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLocalProductos(productos: Producto[]) {
  window.localStorage.setItem(LOCAL_PRODUCTOS_KEY, JSON.stringify(productos));
  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
}

export function mergeLocalProductos(seedProductos: Producto[]) {
  const local = readLocalProductos();
  if (!local?.length) return seedProductos;
  const byId = new Map(local.map((producto) => [producto.id, producto]));
  return seedProductos.map((producto) => byId.get(producto.id) ?? producto);
}

export function upsertLocalProducto(seedProductos: Producto[], next: Producto) {
  const current = mergeLocalProductos(seedProductos);
  let found = false;
  const productos = current.map((producto) => {
    if (producto.id !== next.id) return producto;
    found = true;
    return next;
  });
  if (!found) productos.push(next);
  writeLocalProductos(productos);
  return productos;
}
