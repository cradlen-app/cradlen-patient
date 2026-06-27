"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/common/utils/utils";

type PhoneInputProps = {
  id: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  inputClassName: string;
  errorInputClassName: string;
};

export function PhoneInput({
  id,
  label,
  placeholder,
  registration,
  error,
  inputClassName,
  errorInputClassName,
}: PhoneInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-brand-black">
        {label}
      </label>
      <input
        id={id}
        type="tel"
        autoComplete="tel"
        placeholder={placeholder}
        {...registration}
        className={cn(inputClassName, error ? errorInputClassName : "")}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
