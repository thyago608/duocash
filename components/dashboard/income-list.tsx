"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AddLineDialog } from "@/components/dashboard/add-line-dialog";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { formatCents } from "@/lib/money";
import {
  toggleIncomeReceived,
  createIncomeLine,
  deleteIncomeLine,
} from "@/app/(app)/dashboard/actions";
import type { incomeLines } from "@/db/schema";
import type { LayoutVariant } from "@/lib/use-layout-variant";

type IncomeLine = typeof incomeLines.$inferSelect;

export function IncomeList({
  monthId,
  lines,
  variant = "compact",
}: {
  monthId: string;
  lines: IncomeLine[];
  variant?: LayoutVariant;
}) {
  const [rows, setRows] = useState(lines);
  const [, startTransition] = useTransition();
  const compact = variant === "compact";

  const handleToggle = (id: string, checked: boolean) => {
    const previous = rows;
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, isReceived: checked } : row)),
    );

    startTransition(async () => {
      try {
        await toggleIncomeReceived(id, checked);
        toast.success(checked ? "Marcado como recebido" : "Marcação removida");
      } catch {
        setRows(previous);
        toast.error("Não foi possível salvar. Tente novamente.");
      }
    });
  };

  const handleAdd = (label: string, amountCents: number) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticLine: IncomeLine = {
      id: tempId,
      monthId,
      label,
      chipLabel: null,
      amountCents,
      person: "ambos",
      isReceived: true,
      receivedBy: null,
      receivedAt: new Date(),
      orderIndex: rows.length,
    };

    setRows((current) => [...current, optimisticLine]);

    startTransition(async () => {
      try {
        const inserted = await createIncomeLine({ monthId, label, amountCents });
        setRows((current) => current.map((r) => (r.id === tempId ? inserted : r)));
        toast.success("Entrada registrada");
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
        await deleteIncomeLine(lineId);
      } catch {
        setRows(previous);
        toast.error("Não foi possível excluir. Tente novamente.");
      }
    });
  };

  const receivedTotal = rows
    .filter((r) => r.isReceived)
    .reduce((acc, r) => acc + (r.amountCents ?? 0), 0);
  const grandTotal = rows.reduce((acc, r) => acc + (r.amountCents ?? 0), 0);

  const row = (line: IncomeLine) =>
    compact ? (
      <div key={line.id} className="flex items-center justify-between gap-3 py-2.5 transition-colors">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${
              line.isReceived ? "bg-positive" : "bg-muted-foreground/30"
            }`}
          />
          <span
            className={`truncate text-sm ${line.isReceived ? "line-through opacity-60" : ""}`}
          >
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
              line.isReceived ? "line-through opacity-60" : ""
            }`}
          >
            {line.amountCents !== null ? formatCents(line.amountCents) : "—"}
          </span>
          {line.amountCents !== null && (
            <Switch
              size="sm"
              checked={line.isReceived}
              onCheckedChange={(checked) => handleToggle(line.id, checked === true)}
              aria-label={`Recebido: ${line.label}`}
            />
          )}
          <Badge className={line.isReceived ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground"}>
            {line.isReceived ? "Recebido" : "Pendente"}
          </Badge>
          <ConfirmDeleteButton
            itemLabel={line.label}
            ariaLabel={`Excluir entrada: ${line.label}`}
            onConfirm={() => handleDelete(line.id)}
          />
        </div>
      </div>
    ) : (
      <div
        key={line.id}
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
          line.isReceived ? "border-positive/30 bg-positive/5" : "border-border/60 bg-card"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`size-2.5 shrink-0 rounded-full ${
              line.isReceived ? "bg-positive" : "bg-muted-foreground/30"
            }`}
          />
          <div className="flex flex-col gap-1">
            <span
              className={`text-sm font-medium ${line.isReceived ? "line-through opacity-60" : ""}`}
            >
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
              line.isReceived ? "line-through opacity-60" : ""
            }`}
          >
            {line.amountCents !== null ? formatCents(line.amountCents) : "—"}
          </span>
          {line.amountCents !== null && (
            <Switch
              checked={line.isReceived}
              onCheckedChange={(checked) => handleToggle(line.id, checked === true)}
              aria-label={`Recebido: ${line.label}`}
            />
          )}
          <Badge className={line.isReceived ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground"}>
            {line.isReceived ? "Recebido" : "Pendente"}
          </Badge>
          <ConfirmDeleteButton
            itemLabel={line.label}
            ariaLabel={`Excluir entrada: ${line.label}`}
            onConfirm={() => handleDelete(line.id)}
          />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Entradas</h3>
        <AddLineDialog
          triggerLabel="Cadastrar nova entrada"
          title="Nova entrada"
          labelPlaceholder="De onde veio o dinheiro?"
          onSubmit={handleAdd}
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-positive/10 px-4 py-3">
        <span className="text-sm text-muted-foreground">Recebido</span>
        <span className="text-lg font-semibold text-positive tabular-nums">
          {formatCents(receivedTotal)}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            de {formatCents(grandTotal)}
          </span>
        </span>
      </div>

      <div className={compact ? "flex flex-col divide-y divide-border/60" : "flex flex-col gap-2"}>
        {rows.map(row)}
      </div>
    </div>
  );
}
