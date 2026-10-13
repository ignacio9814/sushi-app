import { formatBoleta, formatMoney, formatPedido } from "@/lib/money";
import { BRAND } from "@/lib/brand";
import {
  formatFechaCorta,
  getClaseFotoUrl,
  getClaseVoucherUrl,
  isClasePedidoItem,
  PROMO,
} from "@/lib/promo";
import { MEDIO_PAGO_LABEL, type Pedido, type PedidoItem } from "@/types";

function lineItem(item: PedidoItem, index: number) {
  const variante = item.varianteNombre ? ` (${item.varianteNombre})` : "";
  const rebozado = item.conRebozado ? " + rebozado" : "";
  return `${index}. ${item.cantidad}x ${item.nombre}${variante}${rebozado} — ${formatMoney(item.subtotal)}`;
}

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

  const comida = pedido.items.filter((item) => !isClasePedidoItem(item));
  const clases = pedido.items.filter((item) => isClasePedidoItem(item));

  if (pedido.horarioRetiro) {
    if (comida.length && clases.length) {
      const [retiroComida] = pedido.horarioRetiro.split(" · ");
      lines.push(`Retiro comida: ${retiroComida}`);
      lines.push(`Clase: a coordinar (${PROMO.claimDays} días)`);
    } else if (clases.length) {
      lines.push(`Clase: ${pedido.horarioRetiro}`);
    } else {
      lines.push(`Retiro: ${pedido.horarioRetiro}`);
    }
  }

  if (pedido.medioPago) {
    lines.push(`Pago: *${MEDIO_PAGO_LABEL[pedido.medioPago]}*`);
  }

  if (comida.length && clases.length) {
    lines.push("", "*Para retirar*");
    comida.forEach((item, index) => {
      lines.push(lineItem(item, index + 1));
    });
    lines.push("", "*Experiencia a coordinar*");
    clases.forEach((item, index) => {
      lines.push(lineItem(item, comida.length + index + 1));
    });
  } else {
    lines.push("", "*Detalle*");
    pedido.items.forEach((item, index) => {
      lines.push(lineItem(item, index + 1));
    });
  }

  if (pedido.notas) {
    lines.push("", `Notas: ${pedido.notas}`);
  }

  if (pedido.descuentoCentavos && pedido.descuentoCodigo) {
    lines.push(
      "",
      `Descuento ${PROMO.discountPct}% (${pedido.descuentoCodigo}): -${formatMoney(pedido.descuentoCentavos)}`
    );
  }

  if (pedido.vouchers?.length) {
    lines.push("", "*Beneficios*");
    pedido.vouchers.forEach((voucher) => {
      if (voucher.tipo === "desc15") {
        lines.push(
          `15% próxima compra: *${voucher.codigo}* (válido hasta ${formatFechaCorta(voucher.venceAt)})`
        );
      } else {
        lines.push(
          `Clase de sushi: *${voucher.codigo}* a coordinar hasta ${formatFechaCorta(voucher.venceAt)}`
        );
        lines.push(`Foto de la clase: ${getClaseFotoUrl()}`);
        lines.push(`Vale: ${getClaseVoucherUrl(voucher.codigo)}`);
      }
    });
  }

  lines.push("", `*Total: ${formatMoney(pedido.totalCentavos)}*`);

  if (emitida && pedido.medioPago) {
    lines.push(`Pago: ${MEDIO_PAGO_LABEL[pedido.medioPago]} · COBRADO`);
  } else if (pedido.medioPago) {
    lines.push(`Pago: ${MEDIO_PAGO_LABEL[pedido.medioPago]}`);
  } else {
    lines.push("Pago: a coordinar");
  }

  if (emitida && boletaUrl) {
    lines.push("", `Boleta: ${boletaUrl}`);
  }

  return lines.join("\n");
}

export function getWhatsAppChatUrl(phone?: string) {
  const destino = toWhatsAppPhone(phone || "") || getWhatsAppPhone();
  return `https://wa.me/${destino}`;
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
