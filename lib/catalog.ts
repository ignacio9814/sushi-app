import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import sushiData from "../firebase_seed_sushi.json";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { Categoria, Producto, SushiData } from "@/types";

const seed = sushiData as SushiData;

export function getSeedCatalog() {
  return {
    categorias: [...seed.categorias].sort((a, b) => a.orden - b.orden),
    productos: seed.productos,
    configuracion: seed.configuracion,
  };
}

export function subscribeCatalog(
  onData: (data: { categorias: Categoria[]; productos: Producto[] }) => void
) {
  const fallback = getSeedCatalog();
  onData(fallback);

  if (!isFirebaseConfigured || !db) {
    return () => undefined;
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
