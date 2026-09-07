"use client";

import BrandLogo, { MenuDivider } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";

export default function WelcomeGate({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F9F7F2] px-5 py-10 text-[#1A1A1A]">
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center text-center">
        <BrandLogo priority size="md" />
        <MenuDivider className="mt-5 w-36" />
        <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-[#9B2B2B] uppercase">
          Antes de pedir
        </p>

        <div className="mt-5 w-full space-y-4 rounded-2xl border border-[#d9c9a3] bg-white px-5 py-5 text-left">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
              Retiro
            </p>
            <p className="mt-1 text-base font-medium">Solo jueves y viernes</p>
            <p className="mt-0.5 text-sm text-[#6b6256]">Pedí con anticipación</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
              Dirección
            </p>
            <p className="mt-1 text-base font-medium">{BRAND.address}</p>
            <p className="text-sm text-[#6b6256]">{BRAND.city}</p>
            <a
              href={BRAND.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-[#C5A059] hover:text-[#9B2B2B]"
            >
              Ver en el mapa
            </a>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
              Hasta 20 piezas
            </p>
            <p className="mt-1 text-base font-medium">Palito, soja y teriyaki</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-8 h-12 w-full rounded-full bg-[#25D366] text-sm font-semibold tracking-wide text-white hover:bg-[#20bd5a]"
        >
          Ver el menú
        </button>
      </div>
    </div>
  );
}
