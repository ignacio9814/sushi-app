"use client";

import { useState } from "react";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminProducts from "@/components/admin/AdminProducts";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [tab, setTab] = useState<"pedidos" | "menu">("pedidos");

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl">Cocina</h2>
        <p className="text-sm text-[#6b6256]">Pedidos en vivo. La boleta se emite al cobrar y cerrar.</p>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Button
          variant={tab === "pedidos" ? "default" : "outline"}
          className={`h-11 rounded-none ${
            tab === "pedidos"
              ? "bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
              : "border-[#d9c9a3] bg-transparent text-[#1A1A1A]"
          }`}
          onClick={() => setTab("pedidos")}
        >
          Pedidos
        </Button>
        <Button
          variant={tab === "menu" ? "default" : "outline"}
          className={`h-11 rounded-none ${
            tab === "menu"
              ? "bg-[#9B2B2B] text-[#F9F7F2] hover:bg-[#7f2020]"
              : "border-[#d9c9a3] bg-transparent text-[#1A1A1A]"
          }`}
          onClick={() => setTab("menu")}
        >
          Menú
        </Button>
      </div>
      {tab === "pedidos" ? <AdminOrders /> : <AdminProducts />}
    </div>
  );
}
