import { formatMoney } from "@/lib/money";
import { BRAND } from "@/lib/brand";
import type { Pedido } from "@/types";

export function getWhatsAppPhone() {
  return (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "").replace(/\D/g, "");
}

export function buildWhatsAppMessage(pedido: Pedido, boletaUrl?: string) {
  const lines = [
    `*${BRAND.name}*`,
    `Pedido ${pedido.numeroFormateado}`,
    "",
    `Cliente: ${pedido.clienteNombre}`,
    `Tel: ${pedido.clienteTelefono}`,
  ];

  if (pedido.direccion) {
    lines.push(`Dir: ${pedido.direccion}`);
  }

  lines.push("", "*Detalle*");

  pedido.items.forEach((item, index) => {
    const variante = item.varianteNombre ? ` (${item.varianteNombre})` : "";
    const rebozado = item.conRebozado ? " + rebozado" : "";
    lines.push(
      `${index + 1}. ${item.cantidad}x ${item.nombre}${variante}${rebozado} — ${formatMoney(item.subtotal)}`
    );
  });

  if (pedido.incluyeSalsasGratis) {
    lines.push("", "Incluye 1 salsa soja y 1 teriyaki");
  }

  if (pedido.notas) {
    lines.push("", `Notas: ${pedido.notas}`);
  }

  lines.push(
    "",
    `*Total: ${formatMoney(pedido.totalCentavos)}*`,
    `Pago: ${pedido.pago === "cobrado" ? "COBRADO" : "PENDIENTE"}`
  );

  if (boletaUrl) {
    lines.push("", `Comprobante: ${boletaUrl}`);
  }

  return lines.join("\n");
}

export function openWhatsApp(pedido: Pedido, boletaUrl?: string) {
  const phone = getWhatsAppPhone();
  const text = encodeURIComponent(buildWhatsAppMessage(pedido, boletaUrl));
  const url = phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
  window.open(url, "_blank");
}
