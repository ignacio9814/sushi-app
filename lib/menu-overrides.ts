import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Producto } from "@/types";

export type ProductPatch = Partial<
  Pick<Producto, "disponible" | "nombre" | "descripcion" | "precio" | "variantes">
> & { updatedAt?: number };

const OVERRIDES_PATH = ["config", "menu_overrides"] as const;

export function applyProductPatches(
  productos: Producto[],
  patches: Record<string, ProductPatch> | null
) {
  if (!patches) return productos;
  return productos.map((producto) => {
    const patch = patches[producto.id];
    if (!patch) return producto;
    const { updatedAt: _updatedAt, ...fields } = patch;
    return { ...producto, ...fields, id: producto.id };
  });
}

export function patchFromProduct(producto: Producto): ProductPatch {
  const patch: ProductPatch = {
    disponible: producto.disponible,
    nombre: producto.nombre,
    updatedAt: Date.now(),
  };
  if (producto.descripcion !== undefined) patch.descripcion = producto.descripcion;
  if (producto.precio !== undefined) patch.precio = producto.precio;
  if (producto.variantes !== undefined) patch.variantes = producto.variantes;
  return patch;
}

export async function saveMenuOverride(producto: Producto) {
  if (!db) return;
  const ref = doc(db, ...OVERRIDES_PATH);
  const snap = await getDoc(ref);
  const current = (snap.data()?.productos ?? {}) as Record<string, ProductPatch>;
  await setDoc(ref, {
    productos: {
      ...current,
      [producto.id]: patchFromProduct(producto),
    },
    updatedAt: Date.now(),
  });
}

export function subscribeMenuOverrides(
  onData: (patches: Record<string, ProductPatch>) => void
) {
  if (!db) return () => {};
  return onSnapshot(doc(db, ...OVERRIDES_PATH), (snapshot) => {
    const productos = snapshot.data()?.productos;
    if (productos && typeof productos === "object") {
      onData(productos as Record<string, ProductPatch>);
    }
  });
}
