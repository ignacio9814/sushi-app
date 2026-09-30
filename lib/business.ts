export const BUSINESS = {
  name: "Adan Reymundo",
  tagline: "Cocina nikkei · Pedí y confirmá por WhatsApp",
  rebozadoPesos: 3000,
  salsaCadaPiezas: 20,
  salsaTexto:
    "Cada 20 piezas incluye 1 par de palitos chinos, 1 salsa de soja y 1 salsa teriyaki.",
  retiroTexto: "Retiro solo jueves y viernes, de 20 a 22 hs.",
  retiroCorto: "Jueves y viernes · 20 a 22 hs",
  incluidoCorto: "Palitos, soja y teriyaki",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5493816025882").replace(/\D/g, ""),
} as const;

export function includedSets(piezas: number) {
  if (piezas <= 0) return 0;
  return Math.ceil(piezas / BUSINESS.salsaCadaPiezas);
}

export function formatIncluyeItems(piezas: number) {
  const sets = Math.max(1, includedSets(piezas));
  if (sets === 1) {
    return ["1 par de palitos chinos", "1 salsa de soja", "1 salsa teriyaki"];
  }
  return [
    `${sets} pares de palitos chinos`,
    `${sets} salsas de soja`,
    `${sets} salsas teriyaki`,
  ];
}
