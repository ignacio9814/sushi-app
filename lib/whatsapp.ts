import { formatBoleta, formatMoney, formatPedido } from "@/lib/money";
import { BRAND } from "@/lib/brand";
import { MEDIO_PAGO_LABEL, type Pedido } from "@/types";

export function getWhatsAppPhone() {
  return (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5493816025882").replace(/\D/g, "");
}

export function buildWhatsAppMessage(pedido: Pedido, boletaUrl?: string) {
  const emitida = Boolean(pedido.boletaEmitida);
  const codigo = emitida ? formatBoleta(pedido.numero) : formatPedido(pedido.numero);
  const lines = [
    `*${BRAND.name}*`,
    emitida ? `Boleta ${codigo}` : `Nuevo pedido ${codigo}`,
    "",
    `Cliente: ${pedido.clienteNombre}`,
    `Tel: ${pedido.clienteTelefono}`,
  ];

  if (pedido.direccion) {
    lines.push(`Dir: ${pedido.direccion}`);
  }

  if (pedido.horarioRetiro) {
    lines.push(`Retiro: ${pedido.horarioRetiro}`);
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

  lines.push("", `*Total: ${formatMoney(pedido.totalCentavos)}*`);

  if (emitida && pedido.medioPago) {
    lines.push(`Pago: ${MEDIO_PAGO_LABEL[pedido.medioPago]} · COBRADO`);
  } else {
    lines.push("Pago: a coordinar");
  }

  if (emitida && boletaUrl) {
    lines.push("", `Boleta: ${boletaUrl}`);
  }

  return lines.join("\n");
}

export function getWhatsAppUrl(pedido: Pedido, boletaUrl?: string) {
  const phone = getWhatsAppPhone();
  const text = encodeURIComponent(buildWhatsAppMessage(pedido, boletaUrl));
  return phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

export function openWhatsApp(pedido: Pedido, boletaUrl?: string) {
  const url = getWhatsAppUrl(pedido, boletaUrl);
  const opened = window.open(url, "_blank");
  if (!opened) {
    window.location.assign(url);
  }
}
