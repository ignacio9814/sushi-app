import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      toastOptions={{
        className: "bg-slate-900 border-slate-700 text-foreground",
      }}
    />
  )
}
