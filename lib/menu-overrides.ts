import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Producto } from "@/types";

export type ProductPatch = Partial<
  Pick<
    Producto,
    | "disponible"
    | "nombre"
    | "descripcion"
    | "precio"
    | "variantes"
    | "permite_rebozado"
    | "categoria_id"
  >
> & { updatedAt?: number };

export type MenuOverridesState = {
  productos: Record<string, ProductPatch>;
  added: Record<string, Producto>;
  deleted: string[];
};

const OVERRIDES_PATH = ["config", "menu_overrides"] as const;

function emptyOverrides(): MenuOverridesState {
  return { productos: {}, added: {}, deleted: [] };
}

export function parseMenuOverrides(data: Record<string, unknown> | undefined): MenuOverridesState {
  if (!data) return emptyOverrides();
  const productos =
    data.productos && typeof data.productos === "object"
      ? (data.productos as Record<string, ProductPatch>)
      : {};
  const added =
    data.added && typeof data.added === "object" ? (data.added as Record<string, Producto>) : {};
  const deleted = Array.isArray(data.deleted)
    ? data.deleted.filter((id): id is string => typeof id === "string")
    : [];
  return { productos, added, deleted };
}

export function applyMenuOverrides(
  productos: Producto[],
  overrides: MenuOverridesState | null
) {
  if (!overrides) return productos;
  const deleted = new Set(overrides.deleted);
  const patched = productos
    .filter((producto) => !deleted.has(producto.id))
    .map((producto) => {
      const patch = overrides.productos[producto.id];
      if (!patch) return producto;
      const { updatedAt: _updatedAt, ...fields } = patch;
      return { ...producto, ...fields, id: producto.id };
    });
  const existingIds = new Set(patched.map((producto) => producto.id));
  const added = Object.values(overrides.added).filter(
    (producto) => producto?.id && !deleted.has(producto.id) && !existingIds.has(producto.id)
  );
  return [...patched, ...added];
}

export function patchFromProduct(producto: Producto): ProductPatch {
  const patch: ProductPatch = {
    disponible: producto.disponible,
    nombre: producto.nombre,
    categoria_id: producto.categoria_id,
    updatedAt: Date.now(),
  };
  if (producto.descripcion !== undefined) patch.descripcion = producto.descripcion;
  if (producto.precio !== undefined) patch.precio = producto.precio;
  if (producto.variantes !== undefined) patch.variantes = producto.variantes;
  if (producto.permite_rebozado !== undefined) patch.permite_rebozado = producto.permite_rebozado;
  return patch;
}

async function readOverridesDoc() {
  if (!db) return emptyOverrides();
  const snap = await getDoc(doc(db, ...OVERRIDES_PATH));
  return parseMenuOverrides(snap.data());
}

async function writeOverridesDoc(next: MenuOverridesState) {
  if (!db) return;
  await setDoc(
    doc(db, ...OVERRIDES_PATH),
    JSON.parse(
      JSON.stringify({
        ...next,
        updatedAt: Date.now(),
      })
    )
  );
}

export async function saveMenuOverride(producto: Producto) {
  if (!db) return;
  const current = await readOverridesDoc();
  const added = { ...current.added };
  if (added[producto.id]) added[producto.id] = producto;
  await writeOverridesDoc({
    productos: {
      ...current.productos,
      [producto.id]: patchFromProduct(producto),
    },
    added,
    deleted: current.deleted.filter((id) => id !== producto.id),
  });
}

export async function saveAddedProduct(producto: Producto) {
  if (!db) return;
  const current = await readOverridesDoc();
  await writeOverridesDoc({
    productos: current.productos,
    added: { ...current.added, [producto.id]: producto },
    deleted: current.deleted.filter((id) => id !== producto.id),
  });
}

export async function saveDeletedProduct(productId: string) {
  if (!db) return;
  const current = await readOverridesDoc();
  const added = { ...current.added };
  delete added[productId];
  const productos = { ...current.productos };
  delete productos[productId];
  await writeOverridesDoc({
    productos,
    added,
    deleted: [...new Set([...current.deleted, productId])],
  });
}

export function subscribeMenuOverrides(onData: (state: MenuOverridesState) => void) {
  if (!db) return () => {};
  return onSnapshot(doc(db, ...OVERRIDES_PATH), (snapshot) => {
    onData(parseMenuOverrides(snapshot.data()));
  });
}
