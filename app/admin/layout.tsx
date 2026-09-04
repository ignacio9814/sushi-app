"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { clearAdminSession, hasAdminSession } from "@/lib/admin-session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const handleLogout = () => {
    clearAdminSession();
    router.push("/login");
  };

  if (!ready) {
    return (
      <div className="menu-page flex min-h-screen items-center justify-center text-[#6b6256]">
        Verificando acceso...
      </div>
    );
  }

  return (
    <div className="menu-page min-h-screen text-[#1A1A1A]">
      <header className="border-b border-[#d9c9a3] bg-[#F9F7F2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <h1 className="font-heading text-xl tracking-wide text-[#1A1A1A]">Panel cocina</h1>
          </div>
          <Button
            variant="outline"
            className="rounded-none border-[#d9c9a3]"
            onClick={handleLogout}
          >
            Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
