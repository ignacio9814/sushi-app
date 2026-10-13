import { isClaseActiva, isComboActiva, isPromoActiva, PROMO } from "@/lib/promo";

export default function PromoBanner() {
  if (!isPromoActiva()) return null;

  const comboOn = isComboActiva();
  const claseOn = isClaseActiva();

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-[#C5A059] bg-[#1A1A1A] text-[#F9F7F2]">
      <img
        src={PROMO.fotoClase}
        alt="Clase de sushi · Día de la Madre"
        className="h-80 w-full object-cover object-[center_20%] sm:h-96"
      />
      <div className="space-y-3 px-5 py-5">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#C5A059] uppercase">
          Día de la Madre
        </p>
        <h2 className="font-heading text-3xl leading-tight">
          {comboOn ? "Combo y clase de sushi" : "Clase de sushi"}
        </h2>
        <p className="text-sm leading-relaxed text-[#F9F7F2]/80">
          El combo se compra del {PROMO.ventaTextoCombo}. La clase, del{" "}
          {PROMO.ventaTextoClase}. El 18 se retiran los pedidos.
        </p>
        <div className="grid gap-2 text-sm">
          {comboOn && (
            <div className="rounded-2xl border border-[#C5A059]/50 bg-white/5 px-4 py-3">
              <p className="font-semibold text-[#C5A059]">Combo Día de la Madre</p>
              <p className="mt-1 text-[#F9F7F2]/80">
                30 piezas · {PROMO.discountPct}% en tu próxima compra · {PROMO.reclamoTexto}
              </p>
            </div>
          )}
          {claseOn && (
            <div className="rounded-2xl border border-[#C5A059]/50 bg-white/5 px-4 py-3">
              <p className="font-semibold text-[#C5A059]">Clase de sushi</p>
              <p className="mt-1 text-[#F9F7F2]/80">
                Experiencia a coordinar · se compra hasta el 18 · {PROMO.reclamoTexto}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
