import type { Producto } from "@/types";

export const CATALOG_UPDATED_EVENT = "sushi-catalog-updated";
const LOCAL_PRODUCTOS_KEY = "sushi_productos_local";
const LOCAL_DELETED_KEY = "sushi_productos_deleted";

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

export function readDeletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeDeletedIds(ids: string[]) {
  window.localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(ids));
}

export function writeLocalProductos(productos: Producto[]) {
  window.localStorage.setItem(LOCAL_PRODUCTOS_KEY, JSON.stringify(productos));
  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
}

export function mergeLocalProductos(seedProductos: Producto[]) {
  const local = readLocalProductos();
  const deleted = new Set(readDeletedIds());
  const byId = new Map((local ?? []).map((producto) => [producto.id, producto]));
  const seedIds = new Set(seedProductos.map((producto) => producto.id));
  const merged = seedProductos
    .filter((producto) => !deleted.has(producto.id))
    .map((producto) => byId.get(producto.id) ?? producto);
  const added = (local ?? []).filter(
    (producto) => !seedIds.has(producto.id) && !deleted.has(producto.id)
  );
  return [...merged, ...added];
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
  writeDeletedIds(readDeletedIds().filter((id) => id !== next.id));
  writeLocalProductos(productos);
  return productos;
}

export function deleteLocalProducto(seedProductos: Producto[], productId: string) {
  writeDeletedIds([...new Set([...readDeletedIds(), productId])]);
  const productos = mergeLocalProductos(seedProductos).filter((producto) => producto.id !== productId);
  writeLocalProductos(productos);
  return productos;
}
