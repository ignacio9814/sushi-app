"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandLogo, { MenuDivider } from "@/components/BrandLogo";
import { isDemoAdmin, saveAdminSession } from "@/lib/admin-session";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isDemoAdmin(usuario, password)) {
      toast.error("Usuario o contraseña incorrectos");
      setLoading(false);
      return;
    }

    saveAdminSession();
    toast.success("Sesión iniciada");
    router.push("/admin");
    setLoading(false);
  };

  return (
    <div className="menu-page flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 rounded-2xl border border-[#d9c9a3] bg-[#F9F7F2]/90 p-8"
      >
        <div className="text-center">
          <BrandLogo size="lg" className="mx-auto" />
          <MenuDivider className="mx-auto mt-4 max-w-40" />
          <p className="mt-4 text-[11px] tracking-[0.3em] text-[#9B2B2B] uppercase">Staff</p>
          <h1 className="mt-1 font-heading text-3xl tracking-wide text-[#1A1A1A]">Cocina</h1>
          <p className="mt-2 text-sm text-[#6b6256]">
            Acceso de prueba para el local. El cliente no ve este panel.
          </p>
        </div>
        <Input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-[#9B2B2B] text-[#F9F7F2] tracking-[0.16em] uppercase hover:bg-[#7f2020]"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
