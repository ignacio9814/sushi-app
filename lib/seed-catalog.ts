import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSeedCatalog } from "@/lib/catalog";

export async function seedCatalogToFirestore() {
  if (!db) {
    throw new Error("Firebase no está configurado");
  }

  const firestore = db;
  const { categorias, productos, configuracion } = getSeedCatalog();
  const batch = writeBatch(firestore);

  categorias.forEach((categoria) => {
    batch.set(doc(firestore, "categorias", categoria.id), categoria);
  });

  productos.forEach((producto) => {
    batch.set(doc(firestore, "productos", producto.id), producto);
  });

  batch.set(
    doc(firestore, "config", "negocio"),
    {
      nombre: process.env.NEXT_PUBLIC_LOCAL_NOMBRE || "Adan Reymundo",
      ...configuracion,
    },
    { merge: true }
  );

  await batch.commit();
}
