import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import sushiData from "../firebase_seed_sushi.json";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  CATALOG_UPDATED_EVENT,
  mergeLocalProductos,
} from "@/lib/local-catalog";
import type { Categoria, Producto, SushiData } from "@/types";

const seed = sushiData as SushiData;

export function getSeedCatalog() {
  return {
    categorias: [...seed.categorias].sort((a, b) => a.orden - b.orden),
    productos: seed.productos,
    configuracion: seed.configuracion,
  };
}

function localCatalog() {
  const fallback = getSeedCatalog();
  return {
    categorias: fallback.categorias,
    productos: mergeLocalProductos(fallback.productos),
  };
}

export function subscribeCatalog(
  onData: (data: { categorias: Categoria[]; productos: Producto[] }) => void
) {
  const fallback = localCatalog();
  onData(fallback);

  const emitLocal = () => onData(localCatalog());

  if (!isFirebaseConfigured || !db) {
    if (typeof window !== "undefined") {
      window.addEventListener(CATALOG_UPDATED_EVENT, emitLocal);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(CATALOG_UPDATED_EVENT, emitLocal);
      }
    };
  }

  let categorias = fallback.categorias;
  let productos = fallback.productos;

  const unsubCategorias = onSnapshot(
    query(collection(db, "categorias"), orderBy("orden")),
    (snapshot) => {
      if (!snapshot.empty) {
        categorias = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Categoria, "id">),
        }));
        onData({ categorias, productos });
      }
    }
  );

  const unsubProductos = onSnapshot(
    query(collection(db, "productos"), orderBy("nombre")),
    (snapshot) => {
      if (!snapshot.empty) {
        productos = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Producto, "id">),
        }));
        onData({ categorias, productos });
      }
    }
  );

  return () => {
    unsubCategorias();
    unsubProductos();
  };
}
