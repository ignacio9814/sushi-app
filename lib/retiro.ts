export const RETIRO_HORAS = ["20", "21", "22"] as const;

export function formatRetiroEstimado(hora: string) {
  if (!hora) return "";
  return `estimado ${hora} hs`;
}
