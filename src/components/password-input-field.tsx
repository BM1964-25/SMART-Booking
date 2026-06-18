"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputFieldProps = {
  defaultValue?: string;
  label: string;
  name: string;
};

export function PasswordInputField({ defaultValue = "", label, name }: PasswordInputFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <input
          name={name}
          type={isVisible ? "text" : "password"}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-slate-300 px-3 py-2 pr-11 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={isVisible ? "Passwort verbergen" : "Passwort anzeigen"}
          title={isVisible ? "Passwort verbergen" : "Passwort anzeigen"}
        >
          {isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}
