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
    <div className="relative min-h-screen bg-black pb-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.07),transparent_46%)]" />
      <header>
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-6 pb-4 text-center">
          <BrandLogo priority size="md" />
          <p className="mt-2 text-[11px] font-medium tracking-[0.28em] text-amber-200/75 uppercase">
            {BRAND.tagline}
          </p>
          <p className="mt-1 text-sm text-zinc-400">Elegí, armá el pedido y confirmá por WhatsApp</p>
        </div>
        <div className="sticky top-0 z-40 border-b border-zinc-900 bg-black/95 backdrop-blur">
          <PeruStripe />
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                activeCategory === "all"
                  ? "bg-amber-200 text-black"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              Todo
            </button>
            {foodCategorias.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() => setActiveCategory(categoria.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  activeCategory === categoria.id
                    ? "bg-amber-200 text-black"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
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
