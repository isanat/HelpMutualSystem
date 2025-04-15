// Arquivo: src/components/ui/button.tsx

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "danger" | "purple" | "outline" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "default",
  className,
  loading,
  icon,
  children,
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded-2xl font-semibold text-white transition duration-200 flex items-center justify-center gap-2";
  const variants = {
    default: "bg-green-500 hover:bg-green-600",
    danger: "bg-red-500 hover:bg-red-600",
    purple: "bg-purple-600 hover:bg-purple-700",
    outline: "bg-transparent border border-gray-700 hover:bg-gray-700",
    ghost: "bg-transparent hover:bg-gray-700",
  };

  return (
    <button
      className={clsx(base, variants[variant], className)}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin h-5 w-5" />}
      {icon && !loading && icon}
      {children}
    </button>
  );
}