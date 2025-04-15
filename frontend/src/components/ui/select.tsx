// Arquivo: src/components/ui/select.tsx

import { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  "aria-label"?: string;
  children: ReactNode;
}

export function Select({ error, className, "aria-label": ariaLabel, children, ...props }: SelectProps) {
  return (
    <select
      className={`bg-[#222] border text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 ${
        error ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-green-500"
      } ${className || ""}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </select>
  );
}