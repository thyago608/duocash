"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { expenseLines } from "@/db/schema";
import type { BucketWithEntries } from "@/lib/calculations";
import { isMarginBucket } from "@/lib/calculations";

type Expense = typeof expenseLines.$inferSelect;
export type ExpenseValues = { label: string; amountCents: number; allocationBucketId: string | null; onCreditCard: boolean };

export function ExpenseDialog({ line, buckets, triggerLabel, onSubmit }: { line?: Expense; buckets: BucketWithEntries[]; triggerLabel?: string; onSubmit: (values: ExpenseValues) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(line?.label ?? "");
  const [amountCents, setAmountCents] = useState(line?.amountCents ?? 0);
  const [bucketId, setBucketId] = useState(line?.allocationBucketId ?? "");
  const [credit, setCredit] = useState(line?.onCreditCard ?? false);
  const submit = () => {
    if (!label.trim() || amountCents <= 0) return;
    onSubmit({ label: label.trim(), amountCents, allocationBucketId: bucketId || null, onCreditCard: credit });
    setOpen(false);
    if (!line) { setLabel(""); setAmountCents(0); setBucketId(""); setCredit(false); }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button size={line ? "icon-sm" : "sm"} variant={line ? "ghost" : "default"} aria-label={line ? `Editar despesa: ${line.label}` : undefined} />}>
      {line ? <Pencil className="size-4" /> : <><Plus className="size-3.5" />{triggerLabel}</>}
    </DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>{line ? "Editar despesa" : "Novo gasto do dia a dia"}</DialogTitle></DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5"><Label htmlFor="expense-label">Descrição</Label><Input id="expense-label" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="expense-amount">Valor</Label><CurrencyInput id="expense-amount" valueCents={amountCents} onValueChange={setAmountCents} /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="expense-bucket">Alocar em</Label><select id="expense-bucket" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={bucketId} onChange={(e) => setBucketId(e.target.value)}><option value="">Sem alocação (reduz a margem)</option>{buckets.filter((bucket) => bucket.type === "tracked" && (!isMarginBucket(bucket) || bucket.id === bucketId)).map((bucket) => <option key={bucket.id} value={bucket.id}>{bucket.name}</option>)}</select></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={credit} onChange={(e) => setCredit(e.target.checked)} /> Pago com cartão de crédito</label>
      </div>
      <DialogFooter><Button type="button" onClick={submit}>Salvar</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
