export function formatMoney(pesos: number) {
  const formatted = Math.round(pesos)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$ ${formatted}`;
}

export function formatPedido(numero: number) {
  return `P-${String(numero).padStart(6, "0")}`;
}

export function formatBoleta(numero: number) {
  return `B-${String(numero).padStart(6, "0")}`;
}

export function piecesFromVariant(nombre?: string) {
  if (!nombre) return 0;
  const match = nombre.match(/(\d+)\s*(pz|piezas)/i);
  return match ? parseInt(match[1], 10) : 0;
}

export function piecesOfLine(item: {
  producto: { categoria_id: string };
  variante?: { nombre?: string };
  cantidad: number;
}) {
  const categoria = item.producto.categoria_id;
  if (categoria === "cat_extras" || categoria === "cat_ceviche") {
    return 0;
  }
  if (item.variante?.nombre) {
    return piecesFromVariant(item.variante.nombre) * item.cantidad;
  }
  if (categoria === "cat_nigiri") {
    return item.cantidad;
  }
  return 0;
}

export function itemUnitPrice(
  precio: number | undefined,
  variantePrecio: number | undefined,
  conRebozado: boolean,
  rebozadoCentavos: number
) {
  const base = variantePrecio ?? precio ?? 0;
  return base + (conRebozado ? rebozadoCentavos : 0);
}
