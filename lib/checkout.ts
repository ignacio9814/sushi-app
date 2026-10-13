import { isClaseProduct, isComboProduct, isFoodProduct, PROMO } from "@/lib/promo";
import { formatRetiroEstimado } from "@/lib/retiro";
import { isExtraProduct, type CartItem } from "@/types";

export function summarizeCart(items: CartItem[]) {
  const foodItems = items.filter((item) => isFoodProduct(item.producto));
  const extraItems = items.filter((item) => isExtraProduct(item.producto));
  const claseItems = items.filter((item) => isClaseProduct(item.producto));
  const comboItems = items.filter((item) => isComboProduct(item.producto));
  const claseQty = claseItems.reduce((total, item) => total + item.cantidad, 0);
  const comboQty = comboItems.reduce((total, item) => total + item.cantidad, 0);
  const hasClase = claseQty > 0;
  const hasFood = foodItems.length > 0;
  const hasCombo = comboQty > 0;
  const mixed = hasClase && hasFood;

  return {
    foodItems,
    extraItems,
    claseItems,
    comboItems,
    claseQty,
    comboQty,
    hasClase,
    hasFood,
    hasCombo,
    mixed,
    needsExtras: hasFood,
    needsRetiro: hasFood,
    checkoutItems: hasFood ? items : items.filter((item) => !isExtraProduct(item.producto)),
  };
}

export type CartSummary = ReturnType<typeof summarizeCart>;

export function formatPedidoHorario(summary: CartSummary, retiroHora: string) {
  const claseNota = `clase a coordinar (${PROMO.claimDays} días)`;
  if (summary.hasFood && summary.hasClase) {
    return `${formatRetiroEstimado(retiroHora)} · ${claseNota}`;
  }
  if (summary.hasClase) return claseNota;
  return formatRetiroEstimado(retiroHora);
}

export function cartExplicacion(summary: CartSummary) {
  const lines: string[] = [];
  if (summary.hasFood) {
    lines.push("La comida se retira en el local, de 20 a 22 hs.");
  }
  if (summary.hasClase) {
    lines.push(`La clase se coordina por WhatsApp. Tenés ${PROMO.claimDays} días.`);
  }
  if (summary.hasCombo) {
    lines.push(
      `El combo incluye un ${PROMO.discountPct}% para tu próxima compra, no para este pedido.`
    );
  }
  return lines;
}

export function itemPedidoNota(producto: { id?: string; promo?: string; nombre?: string }) {
  if (isClaseProduct(producto)) return "Experiencia · se coordina";
  if (isComboProduct(producto)) return "Combo · se retira";
  return "";
}
