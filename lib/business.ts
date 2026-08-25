export const BUSINESS = {
  name: "Adan Reymundo",
  tagline: "Cocina nikkei · Pedí y confirmá por WhatsApp",
  rebozadoPesos: 3000,
  salsaMaxPiezas: 20,
  salsaTexto: "1 Salsa Teriyaki y 1 Salsa Soja gratis",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "").replace(/\D/g, ""),
} as const;
