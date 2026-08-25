"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import BrandLogo, { PeruStripe } from "@/components/BrandLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirebaseConfigured || !auth) {
      toast.message("Firebase no está configurado: entrando en modo demo.");
      router.push("/admin");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Sesión iniciada");
      router.push("/admin");
    } catch {
      toast.error("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-6"
      >
        <div className="text-center">
          <BrandLogo size="lg" className="mx-auto" />
          <PeruStripe className="mx-auto mt-4 max-w-40" />
          <p className="mt-4 text-xs tracking-[0.3em] text-[#c41e3a] uppercase">Staff</p>
          <h1 className="mt-1 font-heading text-3xl text-amber-200">Cocina</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Acceso solo para el local. El cliente no ve este panel.
          </p>
        </div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required={isFirebaseConfigured}
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={isFirebaseConfigured}
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-[#c41e3a] hover:bg-red-700"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
