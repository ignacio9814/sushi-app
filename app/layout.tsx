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
  title: "Adan Reymundo · Pedidos",
  description: "Cocina nikkei. Pedí por WhatsApp; el local emite la boleta al cerrar el pedido.",
  icons: { icon: "/logo.png" },
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
