import { deleteField, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSeedCatalog } from "@/lib/catalog";
import { upsertLocalProducto } from "@/lib/local-catalog";
import { saveProductPhoto } from "@/lib/product-image";
import type { Producto } from "@/types";

function payloadFromProduct(producto: Producto) {
  const { id: _id, imagen_url, ...rest } = producto;
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) payload[key] = value;
  }
  if (imagen_url) payload.imagen_url = imagen_url;
  else payload.imagen_url = deleteField();
  return payload;
}

export async function saveProductChanges(next: Producto) {
  if (db) {
    try {
      await updateDoc(doc(db, "productos", next.id), payloadFromProduct(next));
      return;
    } catch {
      // Sin menú en Firebase todavía: se guarda en el dispositivo.
    }
  }
  upsertLocalProducto(getSeedCatalog().productos, next);
}

export async function saveProductStock(producto: Producto, disponible: boolean) {
  await saveProductChanges({ ...producto, disponible });
}

export async function saveProductPhotoFile(producto: Producto, file: File) {
  const imagen_url = await saveProductPhoto(producto.id, file);
  await saveProductChanges({ ...producto, imagen_url });
  return imagen_url;
}

export async function clearProductPhoto(producto: Producto) {
  const next = { ...producto };
  delete next.imagen_url;
  await saveProductChanges(next);
}
