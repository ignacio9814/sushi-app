export const BUSINESS = {
  name: "Adan Reymundo",
  tagline: "Cocina nikkei · Pedí y confirmá por WhatsApp",
  rebozadoPesos: 3000,
  salsaMaxPiezas: 20,
  salsaTexto: "Hasta 20 piezas incluye 1 salsa soja y 1 teriyaki",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "").replace(/\D/g, ""),
} as const;
