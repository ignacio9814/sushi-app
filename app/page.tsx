"use client";

import { useEffect, useState } from "react";
import Cart from "@/components/Cart";
import ProductCard from "@/components/ProductCard";
import BrandLogo, { MenuDivider } from "@/components/BrandLogo";
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
    <div className="menu-page relative min-h-screen pb-32 text-[#1A1A1A]">
      <header>
        <div className="mx-auto flex max-w-2xl flex-col items-center px-5 pt-8 pb-5 text-center">
          <BrandLogo priority size="lg" />
          <p className="mt-2 text-[11px] font-medium tracking-[0.32em] text-[#9B2B2B] uppercase">
            {BRAND.tagline}
          </p>
          <MenuDivider className="mt-4 w-40" />
          <p className="mt-3 text-sm text-[#6b6256]">
            Elegí, armá el pedido y confirmá por WhatsApp
          </p>
          <a
            href={BRAND.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 text-sm tracking-wide text-[#C5A059] hover:text-[#9B2B2B]"
          >
            @{BRAND.instagram} · dudas
          </a>
        </div>
        <div className="sticky top-0 z-40 border-y border-[#d9c9a3] bg-[#F9F7F2]/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium tracking-wide whitespace-nowrap transition ${
                activeCategory === "all"
                  ? "bg-[#9B2B2B] text-[#F9F7F2]"
                  : "border border-[#d9c9a3] text-[#6b6256] hover:border-[#C5A059]"
              }`}
            >
              Todo
            </button>
            {foodCategorias.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() => setActiveCategory(categoria.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium tracking-wide whitespace-nowrap transition ${
                  activeCategory === categoria.id
                    ? "bg-[#9B2B2B] text-[#F9F7F2]"
                    : "border border-[#d9c9a3] text-[#6b6256] hover:border-[#C5A059]"
                }`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-5 py-10">
        {filteredCategorias.map((categoria) => {
          const productosCategoria = visibleProductos.filter(
            (producto) => producto.categoria_id === categoria.id
          );
          if (productosCategoria.length === 0) return null;

          return (
            <section key={categoria.id} className="mb-14">
              <div className="mb-6 text-center">
                <h2 className="font-heading text-3xl tracking-[0.14em] text-[#1A1A1A] uppercase">
                  {categoria.nombre}
                </h2>
                {categoria.descripcion && (
                  <p className="mt-2 text-[11px] tracking-[0.28em] text-[#9B2B2B] uppercase">
                    {categoria.descripcion}
                  </p>
                )}
                <MenuDivider className="mx-auto mt-4 max-w-56" />
              </div>
              <div className="space-y-4">
                {productosCategoria.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-5 pb-10 text-center text-[11px] tracking-[0.2em] text-[#C5A059] uppercase">
        <MenuDivider className="mb-2 w-32" />
        <p>Sabor, calidad y pasión</p>
        <p>WhatsApp {BRAND.whatsappLocal}</p>
        <a href={BRAND.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-[#9B2B2B]">
          @{BRAND.instagram}
        </a>
        <Link href="/login" className="inline-flex items-center gap-1 text-[#8a8174] hover:text-[#9B2B2B]">
          <Lock className="size-3" />
          Cocina
        </Link>
      </footer>
      <Cart />
    </div>
  );
}
