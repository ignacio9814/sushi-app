import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function PeruStripe({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-0.5 w-full overflow-hidden", className)} aria-hidden>
      <span className="h-full w-1/3 bg-[#c41e3a]" />
      <span className="h-full w-1/3 bg-white" />
      <span className="h-full w-1/3 bg-[#c41e3a]" />
    </div>
  );
}

export default function BrandLogo({
  className,
  priority = false,
  size = "md",
}: {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-12 w-auto",
    md: "h-20 w-auto",
    lg: "h-40 w-auto",
  };

  return (
    <Image
      src={BRAND.logoSrc}
      alt={BRAND.name}
      width={640}
      height={640}
      priority={priority}
      className={cn("object-contain", sizes[size], className)}
    />
  );
}
