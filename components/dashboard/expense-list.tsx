"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AddLineDialog } from "@/components/dashboard/add-line-dialog";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { formatCents } from "@/lib/money";
import {
  toggleExpensePaid,
  createExpenseLine,
  deleteExpenseLine,
} from "@/app/(app)/dashboard/actions";
import type { expenseLines } from "@/db/schema";
import type { LayoutVariant } from "@/lib/use-layout-variant";

type ExpenseLine = typeof expenseLines.$inferSelect;

export function ExpenseList({
  monthId,
  lines,
  variant = "compact",
}: {
  monthId: string;
  lines: ExpenseLine[];
  variant?: LayoutVariant;
}) {
  const [rows, setRows] = useState(lines);
  const [, startTransition] = useTransition();
  const compact = variant === "compact";

  const [fixedOpen, setFixedOpen] = useState(true);

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

  const handleAdd = (label: string, amountCents: number) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticLine: ExpenseLine = {
      id: tempId,
      monthId,
      section: "punctual",
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
        const inserted = await createExpenseLine({ monthId, label, amountCents });
        setRows((current) => current.map((r) => (r.id === tempId ? inserted : r)));
        toast.success("Despesa registrada");
      } catch {
        setRows((current) => current.filter((r) => r.id !== tempId));
        toast.error("Não foi possível registrar. Tente novamente.");
      }
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

  const fixedLines = rows.filter((r) => r.section === "fixed");
  const punctualLines = rows.filter((r) => r.section === "punctual");
  const fixedTotal = fixedLines.reduce((acc, r) => acc + r.amountCents, 0);
  const paidTotal = rows.filter((r) => r.isPaid).reduce((acc, r) => acc + r.amountCents, 0);
  const grandTotal = rows.reduce((acc, r) => acc + r.amountCents, 0);

  const row = (line: ExpenseLine) =>
    compact ? (
      <div key={line.id} className="flex items-center justify-between gap-3 py-2.5 transition-colors">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${
              line.isPaid ? "bg-positive" : "bg-muted-foreground/30"
            }`}
          />
          <span className={`truncate text-sm ${line.isPaid ? "line-through opacity-60" : ""}`}>
            {line.label}
          </span>
          {line.chipLabel && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {line.chipLabel}
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
          <ConfirmDeleteButton
            itemLabel={line.label}
            ariaLabel={`Excluir despesa: ${line.label}`}
            onConfirm={() => handleDelete(line.id)}
          />
        </div>
      </div>
    ) : (
      <div
        key={line.id}
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
          line.isPaid ? "border-positive/30 bg-positive/5" : "border-border/60 bg-card"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`size-2.5 shrink-0 rounded-full ${
              line.isPaid ? "bg-positive" : "bg-muted-foreground/30"
            }`}
          />
          <div className="flex flex-col gap-1">
            <span className={`text-sm font-medium ${line.isPaid ? "line-through opacity-60" : ""}`}>
              {line.label}
            </span>
            {line.chipLabel && (
              <Badge variant="secondary" className="w-fit text-xs">
                {line.chipLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <ConfirmDeleteButton
            itemLabel={line.label}
            ariaLabel={`Excluir despesa: ${line.label}`}
            onConfirm={() => handleDelete(line.id)}
          />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Saídas</h3>
        <AddLineDialog
          triggerLabel="Cadastrar nova saída"
          title="Nova saída"
          labelPlaceholder="Para onde foi o dinheiro?"
          onSubmit={handleAdd}
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-positive/10 px-4 py-3">
        <span className="text-sm text-muted-foreground">Pago</span>
        <span className="text-lg font-semibold text-positive tabular-nums">
          {formatCents(paidTotal)}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            de {formatCents(grandTotal)}
          </span>
        </span>
      </div>

      <div className={compact ? "flex flex-col divide-y divide-border/60" : "flex flex-col gap-2"}>
        <button
          type="button"
          onClick={() => setFixedOpen(!fixedOpen)}
          className="flex items-center justify-between px-1 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          <span className="flex items-center gap-1">
            <ChevronRight className={`size-3.5 transition-transform ${fixedOpen ? "rotate-90" : ""}`} />
            Fixas
          </span>
          <span className="text-xs font-normal tracking-normal text-foreground/70 normal-case">
            {fixedLines.length} itens • {formatCents(fixedTotal)}
          </span>
        </button>
        {fixedOpen && fixedLines.map((line) => row(line))}

        <p className="mt-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Pontuais
        </p>
        {punctualLines.map((line) => row(line))}
      </div>
    </div>
  );
}
