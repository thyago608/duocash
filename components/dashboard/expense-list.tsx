"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ExpenseDialog, type ExpenseValues } from "@/components/dashboard/expense-dialog";
import { StatementImportDialog } from "@/components/dashboard/statement-import-dialog";
import type { BucketWithEntries } from "@/lib/calculations";
import { AddLineDialog } from "@/components/dashboard/add-line-dialog";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { formatCents } from "@/lib/money";
import {
  toggleExpensePaid,
  createExpenseLine,
  deleteExpenseLine,
  updateExpenseLine,
} from "@/app/(app)/dashboard/actions";
import type { expenseLines } from "@/db/schema";
import type { LayoutVariant } from "@/lib/use-layout-variant";

type ExpenseLine = typeof expenseLines.$inferSelect;

export function ExpenseList({
  monthId,
  monthLabel,
  lines,
  section,
  buckets,
  variant = "groups",
}: {
  monthId: string;
  monthLabel: string;
  lines: ExpenseLine[];
  section: "fixed" | "punctual";
  buckets: BucketWithEntries[];
  variant?: LayoutVariant;
}) {
  const [rows, setRows] = useState(lines);
  const [, startTransition] = useTransition();
  const compact = variant === "groups";

  const handleToggle = (id: string, checked: boolean) => {
    const previous = rows;
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, isPaid: checked } : row)),
    );

    startTransition(async () => {
      try {
        await toggleExpensePaid(id, checked);
        toast.success(checked ? "Marcado como pago" : "Marcação removida");
      } catch {
        setRows(previous);
        toast.error("Não foi possível salvar. Tente novamente.");
      }
    });
  };

  const handleAdd = (label: string, amountCents: number, allocationBucketId: string | null = null, onCreditCard = false) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticLine: ExpenseLine = {
      id: tempId,
      monthId,
      section,
      allocationBucketId,
      onCreditCard,
      label,
      chipLabel: null,
      amountCents,
      isPaid: true,
      paidBy: null,
      paidAt: new Date(),
      orderIndex: rows.length,
    };

    setRows((current) => [...current, optimisticLine]);

    startTransition(async () => {
      try {
        const inserted = await createExpenseLine({ monthId, label, amountCents, section, allocationBucketId, onCreditCard });
        setRows((current) => current.map((r) => (r.id === tempId ? inserted : r)));
        toast.success("Despesa registrada");
      } catch {
        setRows((current) => current.filter((r) => r.id !== tempId));
        toast.error("Não foi possível registrar. Tente novamente.");
      }
    });
  };

  const handleEdit = (line: ExpenseLine, values: ExpenseValues) => {
    const previous = rows;
    setRows((current) => current.map((row) => row.id === line.id ? { ...row, ...values } : row));
    startTransition(async () => {
      try {
        const updated = await updateExpenseLine(line.id, { monthId, section, ...values });
        setRows((current) => current.map((row) => row.id === line.id ? updated : row));
        toast.success("Despesa atualizada");
      } catch { setRows(previous); toast.error("Não foi possível salvar. Tente novamente."); }
    });
  };

  const handleDelete = (lineId: string) => {
    const previous = rows;
    setRows((current) => current.filter((r) => r.id !== lineId));

    startTransition(async () => {
      try {
        await deleteExpenseLine(lineId);
      } catch {
        setRows(previous);
        toast.error("Não foi possível excluir. Tente novamente.");
      }
    });
  };

  const sectionRows = rows.filter((row) => row.section === section);
  const paidTotal = sectionRows
    .filter((row) => row.isPaid)
    .reduce((acc, row) => acc + row.amountCents, 0);
  const grandTotal = sectionRows.reduce((acc, row) => acc + row.amountCents, 0);
  const title = section === "fixed" ? "Despesas fixas" : "Gastos do dia a dia";
  const addLabel = section === "fixed" ? "Cadastrar despesa fixa" : "Cadastrar gasto do dia a dia";

  const row = (line: ExpenseLine) =>
    compact ? (
      <div key={line.id} className="flex min-w-0 flex-col items-stretch gap-2 py-2.5 transition-colors @md:flex-row @md:items-center @md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${
              line.isPaid ? "bg-positive" : "bg-muted-foreground/30"
            }`}
          />
          <span className={`min-w-0 break-words text-sm ${line.isPaid ? "line-through opacity-60" : ""}`}>
            {line.label}
          </span>
          {line.chipLabel && (
            <Badge variant="secondary" className="h-auto max-w-full whitespace-normal break-words text-xs">
              {line.chipLabel}
            </Badge>
          )}
          {section === "punctual" && <Badge variant="secondary" className="text-xs">{buckets.find((bucket) => bucket.id === line.allocationBucketId)?.name ?? "Sem alocação"}</Badge>}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 @md:shrink-0">
          <span
            className={`text-sm font-medium tabular-nums ${
              line.isPaid ? "line-through opacity-60" : ""
            }`}
          >
            {formatCents(line.amountCents)}
          </span>
          <Switch
            size="sm"
            checked={line.isPaid}
            onCheckedChange={(checked) => handleToggle(line.id, checked === true)}
            aria-label={`Pago: ${line.label}`}
          />
          <Badge className={line.isPaid ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground"}>
            {line.isPaid ? "Pago" : "Pendente"}
          </Badge>
          {section === "punctual" && <ExpenseDialog line={line} buckets={buckets} onSubmit={(values) => handleEdit(line, values)} />}
          <ConfirmDeleteButton
            className="ml-auto"
            itemLabel={line.label}
            ariaLabel={`Excluir despesa: ${line.label}`}
            onConfirm={() => handleDelete(line.id)}
          />
        </div>
      </div>
    ) : (
      <div
        key={line.id}
        className={`flex min-w-0 flex-col items-stretch gap-3 rounded-2xl border px-4 py-3 transition-colors @md:flex-row @md:items-center @md:justify-between ${
          line.isPaid ? "border-positive/30 bg-positive/5" : "border-border/60 bg-card"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`size-2.5 shrink-0 rounded-full ${
              line.isPaid ? "bg-positive" : "bg-muted-foreground/30"
            }`}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className={`break-words text-sm font-medium ${line.isPaid ? "line-through opacity-60" : ""}`}>
              {line.label}
            </span>
            {line.chipLabel && (
              <Badge variant="secondary" className="h-auto max-w-full w-fit whitespace-normal break-words text-xs">
                {line.chipLabel}
              </Badge>
            )}
            {section === "punctual" && <Badge variant="secondary" className="w-fit text-xs">{buckets.find((bucket) => bucket.id === line.allocationBucketId)?.name ?? "Sem alocação"}</Badge>}
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3 @md:shrink-0">
          <span
            className={`text-sm font-semibold tabular-nums ${
              line.isPaid ? "line-through opacity-60" : ""
            }`}
          >
            {formatCents(line.amountCents)}
          </span>
          <Switch
            checked={line.isPaid}
            onCheckedChange={(checked) => handleToggle(line.id, checked === true)}
            aria-label={`Pago: ${line.label}`}
          />
          <Badge className={line.isPaid ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground"}>
            {line.isPaid ? "Pago" : "Pendente"}
          </Badge>
          {section === "punctual" && <ExpenseDialog line={line} buckets={buckets} onSubmit={(values) => handleEdit(line, values)} />}
          <ConfirmDeleteButton
            className="ml-auto"
            itemLabel={line.label}
            ariaLabel={`Excluir despesa: ${line.label}`}
            onConfirm={() => handleDelete(line.id)}
          />
        </div>
      </div>
    );

  return (
    <div className="@container flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        {section === "punctual" ? <div className="flex flex-wrap gap-2"><StatementImportDialog monthId={monthId} monthLabel={monthLabel} buckets={buckets} expenses={rows} /><ExpenseDialog buckets={buckets} triggerLabel={addLabel} onSubmit={(values) => handleAdd(values.label, values.amountCents, values.allocationBucketId, values.onCreditCard)} /></div> : <AddLineDialog triggerLabel={addLabel} title="Nova despesa fixa" labelPlaceholder="Para onde foi o dinheiro?" onSubmit={handleAdd} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl bg-positive/10 px-4 py-3">
        <span className="text-sm text-muted-foreground">Pago</span>
        <span className="text-lg font-semibold text-positive tabular-nums">
          {formatCents(paidTotal)}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            de {formatCents(grandTotal)}
          </span>
        </span>
      </div>

      <div className={compact ? "flex flex-col divide-y divide-border/60" : "flex flex-col gap-2"}>
        {sectionRows.map((line) => row(line))}
      </div>
    </div>
  );
}
