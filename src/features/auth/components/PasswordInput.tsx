"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/common/utils/utils";

type PasswordInputProps = {
  id: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  inputClassName: string;
  errorInputClassName: string;
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({
  id,
  label,
  placeholder,
  registration,
  error,
  inputClassName,
  errorInputClassName,
  showLabel,
  hideLabel,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-brand-black">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          {showPassword ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
          {showPassword ? hideLabel : showLabel}
        </button>
      </div>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder={placeholder}
        {...registration}
        className={cn(inputClassName, error ? errorInputClassName : "")}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
