import type { ReactNode } from "react";
import { CalendarDays, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export function RulesBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#9B2B2B] px-4 py-2.5 text-center text-[12px] font-semibold tracking-wide text-[#F9F7F2]",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-3.5" />
        Retiro: jueves y viernes
      </span>
      <span className="hidden text-[#F9F7F2]/40 sm:inline" aria-hidden>
        ·
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Utensils className="size-3.5" />
        Hasta 20 pz: palito, soja y teriyaki
      </span>
    </div>
  );
}

export function DayChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#9B2B2B] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#F9F7F2]",
        className
      )}
    >
      <CalendarDays className="size-3" />
      Jueves y viernes
    </span>
  );
}

export function IncludeStrip() {
  return (
    <div className="mx-auto mt-4 max-w-md rounded-2xl border border-[#d9c9a3] bg-white px-4 py-3 text-center">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9B2B2B] uppercase">
        Hasta 20 piezas incluye
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {["Palito", "Soja", "Teriyaki"].map((item) => (
          <span
            key={item}
            className="rounded-full bg-[#F3EBD8] px-3 py-1 text-sm font-medium text-[#1A1A1A]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CheckoutNotice({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#9B2B2B]/25 bg-[#F8E8E8] px-3 py-2.5">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#9B2B2B] uppercase">
        {title}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[#1A1A1A]">{children}</p>
    </div>
  );
}
