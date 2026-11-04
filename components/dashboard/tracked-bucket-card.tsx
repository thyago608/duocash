"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { GlossaryHint } from "@/components/dashboard/glossary-hint";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { formatCents } from "@/lib/money";
import { bucketColorClasses } from "@/lib/colors";
import { glossaryForBucket } from "@/lib/glossary";
import { createAllocationEntry, deleteAllocationEntry } from "@/app/(app)/dashboard/actions";
import type { BucketWithEntries } from "@/lib/calculations";

export function TrackedBucketCard({ bucket }: { bucket: BucketWithEntries }) {
  const [entries, setEntries] = useState(bucket.entries);
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState("");
  const [, startTransition] = useTransition();

  const used = entries.reduce((acc, e) => acc + e.amountCents, 0);
  const remaining = bucket.budgetCents - used;
  const percent = bucket.budgetCents > 0 ? Math.round((used / bucket.budgetCents) * 100) : 0;
  const colors = bucketColorClasses(bucket.color);
  const overBudget = remaining < 0;
  const glossary = glossaryForBucket(bucket);

  const handleSubmit = () => {
    if (amountCents <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticEntry = {
      id: tempId,
      bucketId: bucket.id,
      amountCents,
      description: description || null,
      createdBy: "",
      createdAt: new Date(),
    };

    setEntries((current) => [optimisticEntry, ...current]);
    setAmountCents(0);
    setDescription("");

    startTransition(async () => {
      try {
        const inserted = await createAllocationEntry({
          bucketId: bucket.id,
          amountCents,
          description: description || undefined,
        });
        setEntries((current) => current.map((e) => (e.id === tempId ? inserted : e)));
        toast.success("Lançamento registrado");
      } catch {
        setEntries((current) => current.filter((e) => e.id !== tempId));
        toast.error("Não foi possível registrar. Tente novamente.");
      }
    });
  };

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
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {formatCents(bucket.budgetCents)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <ColoredProgress
            value={Math.min(percent, 100)}
            indicatorClassName={overBudget ? bucketColorClasses("red").bar : colors.bar}
            className="h-2"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Usado <span className="font-medium text-foreground">{formatCents(used)}</span>
            </span>
            <span className={overBudget ? "font-medium text-negative" : "text-muted-foreground"}>
              {overBudget ? "estourou em " : "resta "}
              {formatCents(Math.abs(remaining))}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <CurrencyInput
            valueCents={amountCents}
            onValueChange={setAmountCents}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className="sm:w-28"
          />
          <Input
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className="flex-1"
          />
          <Button type="button" size="icon" onClick={handleSubmit} aria-label="Registrar lançamento">
            <Plus className="size-4" />
          </Button>
        </div>

        {entries.length > 0 && (
          <ul className="flex flex-col divide-y divide-border/60 text-sm">
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
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
