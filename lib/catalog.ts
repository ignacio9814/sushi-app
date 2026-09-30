import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import sushiData from "../firebase_seed_sushi.json";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  CATALOG_UPDATED_EVENT,
  mergeLocalProductos,
} from "@/lib/local-catalog";
import { applyLocalStock, STOCK_UPDATED_EVENT } from "@/lib/local-stock";
import { applyMenuOverrides, subscribeMenuOverrides, type MenuOverridesState } from "@/lib/menu-overrides";
import type { Categoria, Producto, SushiData } from "@/types";

const seed = sushiData as SushiData;

export function getSeedCatalog() {
  return {
    categorias: [...seed.categorias].sort((a, b) => a.orden - b.orden),
    productos: seed.productos,
    configuracion: seed.configuracion,
  };
}

export function getLocalCatalog() {
  const fallback = getSeedCatalog();
  return {
    categorias: fallback.categorias,
    productos: applyLocalStock(mergeLocalProductos(fallback.productos)),
  };
}

export function subscribeCatalog(
  onData: (data: { categorias: Categoria[]; productos: Producto[] }) => void
) {
  const fallback = getLocalCatalog();
  onData(fallback);

  let categorias = fallback.categorias;
  let remoteProductos: Producto[] | null = null;
  let remoteOverrides: MenuOverridesState | null = null;

  const emit = () => {
    const base = applyMenuOverrides(
      remoteProductos ?? getSeedCatalog().productos,
      remoteOverrides
    );
    onData({
      categorias,
      productos: applyLocalStock(mergeLocalProductos(base)),
    });
  };

  if (typeof window !== "undefined") {
    window.addEventListener(CATALOG_UPDATED_EVENT, emit);
    window.addEventListener(STOCK_UPDATED_EVENT, emit);
  }

  const unsubCategorias =
    isFirebaseConfigured && db
      ? onSnapshot(query(collection(db, "categorias"), orderBy("orden")), (snapshot) => {
          if (!snapshot.empty) {
            categorias = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<Categoria, "id">),
            }));
            emit();
          }
        })
      : () => {};

  const unsubProductos =
    isFirebaseConfigured && db
      ? onSnapshot(query(collection(db, "productos"), orderBy("nombre")), (snapshot) => {
          if (!snapshot.empty) {
            remoteProductos = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<Producto, "id">),
            }));
            emit();
          }
        })
      : () => {};

  const unsubOverrides = subscribeMenuOverrides((overrides) => {
    remoteOverrides = overrides;
    emit();
  });

  return () => {
    unsubCategorias();
    unsubProductos();
    unsubOverrides();
    if (typeof window !== "undefined") {
      window.removeEventListener(CATALOG_UPDATED_EVENT, emit);
      window.removeEventListener(STOCK_UPDATED_EVENT, emit);
    }
  };
}
