"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { formatCents } from "@/lib/money";
import { bucketColorClasses } from "@/lib/colors";
import { RESERVE_MONTHS_COVERAGE } from "@/lib/constants";
import {
  depositBuckets,
  reserveDepositedTotal,
  reserveGoal,
  type MonthData,
} from "@/lib/calculations";
import {
  createReserveWithdrawal,
  deleteReserveWithdrawal,
} from "@/app/(app)/dashboard/actions";
import { ReserveResetButton } from "@/components/dashboard/reserve-reset-button";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import type { reserveWithdrawals as reserveWithdrawalsTable } from "@/db/schema";

type ReserveWithdrawal = typeof reserveWithdrawalsTable.$inferSelect;

export function ReserveSection({
  months,
  withdrawals: initialWithdrawals,
}: {
  months: MonthData[];
  withdrawals: ReserveWithdrawal[];
}) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState("");
  const [, startTransition] = useTransition();

  const buckets = depositBuckets(months);
  const deposited = reserveDepositedTotal(months);
  const goal = reserveGoal(months, RESERVE_MONTHS_COVERAGE);
  const goalPercent = goal > 0 ? Math.round((deposited / goal) * 100) : 0;

  const withdrawn = withdrawals.reduce((acc, w) => acc + w.amountCents, 0);
  const balance = deposited - withdrawn;
  const usedPercent = deposited > 0 ? Math.round((withdrawn / deposited) * 100) : 0;
  const positiveColor = bucketColorClasses("green");
  const negativeColor = bucketColorClasses("red");

  const handleSubmit = () => {
    if (amountCents <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic = {
      id: tempId,
      amountCents,
      description: description || null,
      createdBy: "",
      createdAt: new Date(),
    };

    setWithdrawals((current) => [optimistic, ...current]);
    setAmountCents(0);
    setDescription("");

    startTransition(async () => {
      try {
        const inserted = await createReserveWithdrawal({
          amountCents,
          description: description || undefined,
        });
        setWithdrawals((current) => current.map((w) => (w.id === tempId ? inserted : w)));
        toast.success("Uso da reserva registrado");
      } catch {
        setWithdrawals((current) => current.filter((w) => w.id !== tempId));
        toast.error("Não foi possível registrar. Tente novamente.");
      }
    });
  };

  const handleDelete = (id: string) => {
    const previous = withdrawals;
    setWithdrawals((current) => current.filter((w) => w.id !== id));

    startTransition(async () => {
      try {
        await deleteReserveWithdrawal(id);
      } catch {
        setWithdrawals(previous);
        toast.error("Não foi possível excluir. Tente novamente.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Evolução da reserva</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1 text-sm">
            {buckets
              .reduce<Array<{ month: MonthData; bucket: (typeof buckets)[number]["bucket"]; cumulative: number }>>(
                (acc, { month, bucket }) => {
                  const previousCumulative = acc.at(-1)?.cumulative ?? 0;
                  acc.push({ month, bucket, cumulative: previousCumulative + bucket.budgetCents });
                  return acc;
                },
                [],
              )
              .map(({ month, bucket, cumulative }) => (
                <li key={bucket.id} className="flex items-center justify-between">
                  <span>{month.label}</span>
                  <span className="text-muted-foreground">
                    {formatCents(bucket.budgetCents)} • acumulado {formatCents(cumulative)}
                  </span>
                </li>
              ))}
          </ul>
          <ColoredProgress
            value={Math.min(goalPercent, 100)}
            indicatorClassName={positiveColor.bar}
          />
          <p className="text-sm text-muted-foreground">
            Meta: {formatCents(goal)} ({RESERVE_MONTHS_COVERAGE}× despesas fixas mensais) —{" "}
            {goalPercent}% projetado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saldo disponível na reserva</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p
            className={`text-3xl font-bold ${
              balance < 0 ? "text-negative" : "text-positive"
            }`}
          >
            {formatCents(balance)}
            {balance < 0 && (
              <span className="ml-2 text-sm font-normal">
                estourou em {formatCents(Math.abs(balance))}
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {deposited > 0
              ? `Depositado: ${formatCents(deposited)}`
              : "Nenhum depósito confirmado ainda"}
          </p>
          <ColoredProgress
            value={Math.min(usedPercent, 100)}
            indicatorClassName={balance < 0 ? negativeColor.bar : positiveColor.bar}
          />

          <div className="flex gap-2">
            <CurrencyInput
              valueCents={amountCents}
              onValueChange={setAmountCents}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <Input
              placeholder="Motivo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <Button type="button" onClick={handleSubmit}>
              🏦 Registrar uso
            </Button>
          </div>

          {withdrawals.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {withdrawals.map((withdrawal) => (
                <li
                  key={withdrawal.id}
                  className="flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="text-muted-foreground">
                    {withdrawal.description || "Sem motivo informado"}
                  </span>
                  <span className="flex items-center gap-2">
                    {formatCents(withdrawal.amountCents)}
                    <ConfirmDeleteButton
                      itemLabel={withdrawal.description || formatCents(withdrawal.amountCents)}
                      ariaLabel="Excluir retirada"
                      onConfirm={() => handleDelete(withdrawal.id)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <ReserveResetButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
