"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandLogo, { MenuDivider } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import {
  getClaseFotoUrl,
  getClaseVoucherUrl,
  normalizeVoucherCode,
  PROMO,
} from "@/lib/promo";

export default function ClaseVoucherPage() {
  const params = useParams<{ codigo: string }>();
  const codigo = normalizeVoucherCode(params.codigo || "");
  const foto = getClaseFotoUrl();
  const vale = getClaseVoucherUrl(codigo);
  const mail = useMemo(() => {
    const subject = `Tu clase de sushi · ${BRAND.name}`;
    const body = [
      `Hola, te regalo una clase de sushi en ${BRAND.name}.`,
      "",
      `Código: ${codigo}`,
      `Vale: ${vale}`,
      `Foto: ${foto}`,
      "",
      `Hay que coordinarla dentro de los ${PROMO.claimDays} días.`,
      `WhatsApp: ${BRAND.whatsappLocal}`,
    ].join("\n");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [codigo, foto, vale]);

  const whatsapp = useMemo(() => {
    const text = [
      `*${BRAND.name}*`,
      "Vale de clase de sushi",
      "",
      `Código: *${codigo}*`,
      `Coordinar dentro de ${PROMO.claimDays} días.`,
      "",
      `Foto: ${foto}`,
      `Vale: ${vale}`,
    ].join("\n");
    const url = new URL(getWhatsAppChatUrl());
    url.searchParams.set("text", text);
    return url.toString();
  }, [codigo, foto, vale]);

  return (
    <div className="menu-page min-h-screen px-5 py-10 text-[#1A1A1A]">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <BrandLogo size="md" />
        <MenuDivider className="mt-4 w-32" />
        <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-[#9B2B2B] uppercase">
          Vale de experiencia
        </p>
        <h1 className="mt-2 font-heading text-3xl">Clase de sushi</h1>
        <p className="mt-2 text-sm text-[#6b6256]">
          Código {codigo || "CLASE"}. Coordiná dentro de {PROMO.claimDays} días.
        </p>
        <div className="mt-6 w-full overflow-hidden rounded-3xl border border-[#C5A059] bg-white shadow-[0_16px_40px_rgba(26,26,26,0.08)]">
          <img src="/clase-sushi.jpg" alt="Clase de sushi" className="w-full object-cover" />
        </div>
        <p className="mt-4 text-sm text-[#6b6256]">
          {BRAND.address}, {BRAND.city}
        </p>
        <div className="mt-6 grid w-full gap-2">
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#25D366] text-sm font-semibold text-white hover:bg-[#20bd5a]"
          >
            Enviar por WhatsApp
          </a>
          <a
            href={mail}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#d9c9a3] bg-white text-sm font-medium text-[#1A1A1A]"
          >
            Enviar por mail
          </a>
          <a
            href="/clase-sushi.jpg"
            download="clase-sushi-adan-reymundo.jpg"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#d9c9a3] bg-white text-sm font-medium text-[#1A1A1A]"
          >
            Guardar la foto
          </a>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center text-sm text-[#6b6256]"
          >
            Volver al menú
          </Link>
        </div>
        <p className="mt-4 text-xs text-[#8a8174]">
          WhatsApp muestra la foto al abrir el vale. El mail lleva el mismo enlace.
        </p>
      </div>
    </div>
  );
}
