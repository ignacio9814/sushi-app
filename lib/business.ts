export const BUSINESS = {
  name: "Adan Reymundo",
  tagline: "Cocina nikkei · Pedí y confirmá por WhatsApp",
  rebozadoPesos: 3000,
  salsaMaxPiezas: 20,
  salsaTexto: "Hasta 20 piezas incluye un palito, una salsa soja y una salsa teriyaki.",
  retiroTexto: "Retiro solo jueves y viernes.",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5493816025882").replace(/\D/g, ""),
} as const;
