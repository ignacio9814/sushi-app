"use client";

import { useEffect, useState } from "react";
import Cart from "@/components/Cart";
import ProductCard from "@/components/ProductCard";
import BrandLogo, { PeruStripe } from "@/components/BrandLogo";
import { getSeedCatalog, subscribeCatalog } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";
import type { Categoria, Producto } from "@/types";
import { Lock } from "lucide-react";
import Link from "next/link";

const initialCatalog = getSeedCatalog();

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>(initialCatalog.categorias);
  const [productos, setProductos] = useState<Producto[]>(initialCatalog.productos);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    return subscribeCatalog(({ categorias: cats, productos: prods }) => {
      setCategorias(cats);
      setProductos(prods);
    });
  }, []);

  const visibleProductos = productos.filter((producto) => producto.disponible);
  const foodCategorias = categorias.filter((categoria) => categoria.id !== "cat_extras");
  const filteredCategorias =
    activeCategory === "all"
      ? foodCategorias
      : foodCategorias.filter((categoria) => categoria.id === activeCategory);

  return (
    <div className="relative min-h-screen bg-black pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.07),transparent_46%)]" />
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <BrandLogo priority size="md" />
          <p className="hidden text-sm tracking-wide text-amber-200/80 sm:block">
            {BRAND.tagline} · Pedí por WhatsApp
          </p>
        </div>
        <PeruStripe />
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${
              activeCategory === "all"
                ? "border-amber-200/35 bg-amber-200/10 text-amber-100/90"
                : "border-zinc-800 text-zinc-400"
            }`}
          >
            Todo
          </button>
          {foodCategorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              onClick={() => setActiveCategory(categoria.id)}
              className={`rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${
                activeCategory === categoria.id
                  ? "border-amber-200/35 bg-amber-200/10 text-amber-100/90"
                  : "border-zinc-800 text-zinc-400"
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8">
        {filteredCategorias.map((categoria) => {
          const productosCategoria = visibleProductos.filter(
            (producto) => producto.categoria_id === categoria.id
          );
          if (productosCategoria.length === 0) return null;

          return (
            <section key={categoria.id} className="mb-12">
              <div className="mb-5">
                <h2 className="font-heading text-2xl text-zinc-50">{categoria.nombre}</h2>
                {categoria.descripcion && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                    {categoria.descripcion}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productosCategoria.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-8 text-xs text-zinc-600">
        <span>El local confirma por WhatsApp y emite la boleta al cobrar</span>
        <Link href="/login" className="inline-flex items-center gap-1 hover:text-amber-400">
          <Lock className="size-3" />
          Cocina
        </Link>
      </footer>
      <Cart />
    </div>
  );
}
