"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { GlossaryHint } from "@/components/dashboard/glossary-hint";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { formatCents } from "@/lib/money";
import { bucketColorClasses } from "@/lib/colors";
import { glossaryForBucket } from "@/lib/glossary";
import { deleteAllocationEntry, updateBucketBudget } from "@/app/(app)/dashboard/actions";
import type { BucketWithEntries } from "@/lib/calculations";

export function TrackedBucketCard({ bucket, linkedExpenses = [] }: { bucket: BucketWithEntries; linkedExpenses?: { id: string; label: string; amountCents: number }[] }) {
  const [entries, setEntries] = useState(bucket.entries);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(bucket.budgetCents);
  const isMargin = bucket.name.toLowerCase().includes("margem");
  const [, startTransition] = useTransition();

  const used = linkedExpenses.reduce((acc, e) => acc + e.amountCents, 0);
  const remaining = bucket.budgetCents - used;
  const percent = bucket.budgetCents > 0 ? Math.round((used / bucket.budgetCents) * 100) : 0;
  const colors = bucketColorClasses(bucket.color);
  const overBudget = remaining < 0;
  const glossary = glossaryForBucket(bucket);

  const handleDelete = (entryId: string) => {
    const previous = entries;
    setEntries((current) => current.filter((e) => e.id !== entryId));

    startTransition(async () => {
      try {
        await deleteAllocationEntry(entryId);
      } catch {
        setEntries(previous);
        toast.error("Não foi possível excluir. Tente novamente.");
      }
    });
  };

  return (
    <Card className="relative overflow-hidden border-border/60">
      <span className={`absolute inset-x-0 top-0 h-1 ${colors.accent}`} aria-hidden />
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full text-base ${colors.iconBg}`}
            >
              {bucket.icon}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{bucket.name}</span>
              {glossary && <GlossaryHint title={glossary.title} text={glossary.text} />}
            </span>
          </span>
          <button type="button" disabled={isMargin} onClick={() => { setBudgetInput(bucket.budgetCents); setEditingBudget(true); }} aria-label={isMargin ? "Margem calculada" : `Editar orçamento de ${bucket.name}`}><Badge variant="secondary" className="shrink-0 tabular-nums">{formatCents(bucket.budgetCents)}</Badge></button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editingBudget && <div className="flex gap-2"><CurrencyInput aria-label={`Orçamento de ${bucket.name}`} valueCents={budgetInput} onValueChange={setBudgetInput} /><Button type="button" onClick={() => startTransition(async () => { try { await updateBucketBudget(bucket.id, budgetInput); setEditingBudget(false); toast.success("Orçamento atualizado"); } catch { toast.error("Não foi possível atualizar o orçamento."); } })}>Salvar</Button><Button type="button" variant="outline" onClick={() => setEditingBudget(false)}>Cancelar</Button></div>}
        <div>
          <ColoredProgress
            value={Math.min(percent, 100)}
            indicatorClassName={overBudget ? bucketColorClasses("red").bar : colors.bar}
            className="h-2"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Comprometido <span className="font-medium text-foreground">{formatCents(used)}</span>
            </span>
            <span className={overBudget ? "font-medium text-negative" : "text-muted-foreground"}>
              {overBudget ? "estourou em " : "resta "}
              {formatCents(Math.abs(remaining))}
            </span>
          </div>
        </div>

        {linkedExpenses.length > 0 && <ul className="flex flex-col gap-2 text-sm">{linkedExpenses.map((expense) => <li key={expense.id} className="flex justify-between gap-2"><span className="min-w-0 break-words text-muted-foreground">{expense.label}</span><span className="shrink-0 tabular-nums">{formatCents(expense.amountCents)}</span></li>)}</ul>}
        {entries.length > 0 && (
          <div><p className="mb-2 text-xs text-muted-foreground">Lançamentos antigos para revisão: não entram nos cálculos. Cadastre como despesa e exclua daqui após conferir.</p><ul className="flex flex-col divide-y divide-border/60 text-sm">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 py-2 transition-colors first:pt-0 last:pb-0"
              >
                <span className="text-muted-foreground">
                  {entry.description || "Sem descrição"}
                </span>
                <span className="flex items-center gap-2 font-medium tabular-nums">
                  {formatCents(entry.amountCents)}
                  <ConfirmDeleteButton
                    itemLabel={entry.description || formatCents(entry.amountCents)}
                    ariaLabel="Excluir lançamento"
                    onConfirm={() => handleDelete(entry.id)}
                  />
                </span>
              </li>
            ))}
          </ul></div>
        )}
      </CardContent>
    </Card>
  );
}
