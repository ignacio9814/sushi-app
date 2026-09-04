export function formatRetiroFranja(desde: string, hasta: string) {
  if (!desde || !hasta) return "";
  return `${desde} a ${hasta}`;
}
