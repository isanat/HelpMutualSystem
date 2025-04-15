// Arquivo: src/components/ui/card.tsx

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "outline";
  className?: string;
}

export function Card({ children, variant = "default", className }: CardProps) {
  const variantStyles = {
    default: "bg-[#111] p-4 rounded-2xl shadow",
    elevated: "bg-[#111] p-4 rounded-2xl shadow-lg",
    outline: "bg-transparent p-4 rounded-2xl border border-gray-700",
  };

  return (
    <div
      role="region"
      className={`${variantStyles[variant]} text-white ${className || ""}`}
    >
      {children}
    </div>
  );
}