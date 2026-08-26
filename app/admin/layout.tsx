"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push("/login");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Verificando acceso...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <h1 className="font-heading text-xl text-amber-200">Panel cocina</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
