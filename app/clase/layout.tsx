import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clase de sushi · Adan Reymundo",
  description: "Vale de clase de sushi. Coordiná tu fecha dentro de los 30 días.",
  openGraph: {
    title: "Clase de sushi · Adan Reymundo",
    description: "Un vale para una clase. Se coordina dentro de los 30 días.",
    images: [
      {
        url: "/clase-sushi.jpg",
        width: 1024,
        height: 1536,
        alt: "Clase de sushi · Adan Reymundo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/clase-sushi.jpg"],
  },
};

export default function ClaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
