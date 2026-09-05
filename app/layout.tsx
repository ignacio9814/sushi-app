import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import MenuBackdrop from "@/components/MenuBackdrop";
import { Toaster } from "@/components/ui/toast";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sushi-app-five.vercel.app"),
  title: "Adan Reymundo · Pedidos",
  description: "Cocina nikkei. Pedí por WhatsApp; el local emite la boleta al cerrar el pedido.",
  applicationName: "Adan Reymundo",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Adan Reymundo",
    title: "Adan Reymundo · Cocina nikkei",
    description: "Pedí rolls, nigiri y ceviche. Confirmá por WhatsApp.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Adan Reymundo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adan Reymundo · Cocina nikkei",
    description: "Pedí rolls, nigiri y ceviche. Confirmá por WhatsApp.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-transparent">
        <MenuBackdrop />
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
