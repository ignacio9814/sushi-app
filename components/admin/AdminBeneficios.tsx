"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  estadoBeneficio,
  markBeneficioUsed,
  subscribeBeneficios,
  type Beneficio,
} from "@/lib/beneficios";
import { formatFechaCorta } from "@/lib/promo";

const FILTROS = ["vigente", "usado", "vencido"] as const;

const FILTRO_LABEL = {
  vigente: "Vigentes",
  usado: "Usados",
  vencido: "Vencidos",
};

const TIPO_LABEL = {
  desc15: "15% próxima compra",
  clase: "Clase de sushi",
};

export default function AdminBeneficios() {
  const [items, setItems] = useState<Beneficio[]>([]);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("vigente");
  const [q, setQ] = useState("");

  useEffect(() => {
    return subscribeBeneficios(setItems);
  }, []);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((item) => estadoBeneficio(item) === filtro)
      .filter((item) => {
        if (!query) return true;
        return (
          item.codigo.toLowerCase().includes(query) ||
          item.clienteNombre.toLowerCase().includes(query) ||
          item.clienteTelefono.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [filtro, items, q]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6b6256]">
        Acá ves quién compró el combo o la clase, el código, hasta cuándo vale y si ya lo
        reclamaron. Si vienen al local sin cargar el código, marcalo usado acá.
      </p>
      <Input
        placeholder="Buscar por código, nombre o WhatsApp"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        {FILTROS.map((opcion) => (
          <Button
            key={opcion}
            variant={filtro === opcion ? "default" : "outline"}
            className={`h-10 rounded-full ${
              filtro === opcion
                ? "bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
                : "border-[#d9c9a3] bg-transparent text-[#1A1A1A]"
            }`}
            onClick={() => setFiltro(opcion)}
          >
            {FILTRO_LABEL[opcion]}
          </Button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-[#6b6256]">No hay beneficios en este estado.</p>
      ) : (
        visible.map((item) => (
          <article
            key={item.codigo}
            className="rounded-2xl border border-[#d9c9a3] bg-white/50 p-4"
          >
            <p className="font-heading text-xl tracking-wide">{item.codigo}</p>
            <p className="text-sm text-[#9B2B2B]">{TIPO_LABEL[item.tipo]}</p>
            <p className="mt-1 text-sm text-[#1A1A1A]">
              {item.clienteNombre} · {item.clienteTelefono}
            </p>
            <p className="text-xs text-[#6b6256]">
              Pedido {item.pedidoNumero} · vence {formatFechaCorta(item.venceAt)}
            </p>
            {item.usado && (
              <p className="mt-1 text-xs text-[#6b6256]">
                Usado {item.usadoAt ? formatFechaCorta(item.usadoAt) : ""}
              </p>
            )}
            {estadoBeneficio(item) === "vigente" && (
              <Button
                className="mt-3 h-11 w-full rounded-full bg-[#1A1A1A] text-[#F9F7F2] hover:bg-[#333]"
                onClick={() => {
                  markBeneficioUsed(item.codigo);
                  toast.success(`${item.codigo} marcado como usado`);
                }}
              >
                {item.tipo === "clase" ? "Marcar clase dada" : "Marcar descuento usado"}
              </Button>
            )}
          </article>
        ))
      )}
    </div>
  );
}
