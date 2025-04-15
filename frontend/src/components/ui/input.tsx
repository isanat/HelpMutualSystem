// Arquivo: src/components/ui/input.tsx

import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  "aria-label"?: string;
  icon?: ReactNode;
}

export function Input({ error, className, "aria-label": ariaLabel, icon, ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={`bg-[#222] border text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 ${
          error ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-green-500"
        } ${icon ? "pl-10" : ""} ${className || ""}`}
        aria-label={ariaLabel}
        {...props}
      />
    </div>
  );
}