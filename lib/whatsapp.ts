import { formatBoleta, formatMoney, formatPedido } from "@/lib/money";
import { BRAND } from "@/lib/brand";
import { MEDIO_PAGO_LABEL, type Pedido } from "@/types";

export function toWhatsAppPhone(value: string) {
  const raw = value.replace(/\D/g, "");
  if (raw.startsWith("54")) return raw;
  if (raw.startsWith("9") && raw.length >= 11) return `54${raw}`;
  if (raw.length === 10) return `549${raw}`;
  return raw;
}

export function getWhatsAppPhone() {
  return toWhatsAppPhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "3816025882") || "5493816025882";
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
    lines.push("", "Incluye un palito, una salsa soja y una salsa teriyaki");
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

export function getWhatsAppUrl(pedido: Pedido, boletaUrl?: string, phone?: string) {
  const destino = toWhatsAppPhone(phone || "") || getWhatsAppPhone();
  const params = new URLSearchParams({
    phone: destino,
    text: buildWhatsAppMessage(pedido, boletaUrl),
  });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

export function openWhatsApp(pedido: Pedido, boletaUrl?: string, phone?: string) {
  window.location.assign(getWhatsAppUrl(pedido, boletaUrl, phone));
}
