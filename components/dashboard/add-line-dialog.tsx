"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";

export function AddLineDialog({
  triggerLabel,
  title,
  labelPlaceholder,
  onSubmit,
}: {
  triggerLabel: string;
  title: string;
  labelPlaceholder: string;
  onSubmit: (label: string, amountCents: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amountCents, setAmountCents] = useState(0);

  const handleSubmit = () => {
    if (!label.trim() || amountCents <= 0) return;

    onSubmit(label.trim(), amountCents);
    setLabel("");
    setAmountCents(0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-line-label">{labelPlaceholder}</Label>
            <Input
              id="add-line-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-line-amount">Valor</Label>
            <CurrencyInput
              id="add-line-amount"
              valueCents={amountCents}
              onValueChange={setAmountCents}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
