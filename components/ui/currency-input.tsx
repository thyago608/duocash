import { Input } from "@/components/ui/input";
import type { ComponentProps } from "react";

function formatCentsPrecise(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CurrencyInput({
  valueCents,
  onValueChange,
  onKeyDown,
  ...props
}: {
  valueCents: number;
  onValueChange: (cents: number) => void;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  return (
    <Input
      {...props}
      inputMode="decimal"
      placeholder={props.placeholder ?? "R$ 0,00"}
      value={valueCents === 0 ? "" : formatCentsPrecise(valueCents)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onValueChange(digits ? parseInt(digits, 10) : 0);
      }}
      onKeyDown={onKeyDown}
    />
  );
}
