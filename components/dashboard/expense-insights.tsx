"use client";

import { useState } from "react";
import { BarChart3, PieChart } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { expenseLines } from "@/db/schema";

type ExpenseLine = typeof expenseLines.$inferSelect;

const CHART_COLORS = ["#7c3aed", "#db2777", "#ea580c", "#0891b2", "#16a34a", "#64748b", "#d97706"];
const CIRCUMFERENCE = 2 * Math.PI * 42;

export function ExpenseInsights({ lines }: { lines: ExpenseLine[] }) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const total = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const fixedTotal = lines
    .filter((line) => line.section === "fixed")
    .reduce((sum, line) => sum + line.amountCents, 0);
  const paidTotal = lines
    .filter((line) => line.isPaid)
    .reduce((sum, line) => sum + line.amountCents, 0);

  const paidLines = lines.filter((line) => line.isPaid);
  const paidDailyTotal = paidLines
    .filter((line) => line.section === "punctual")
    .reduce((sum, line) => sum + line.amountCents, 0);
  const fixedGroups = Array.from(
    paidLines.filter((line) => line.section === "fixed").reduce((byLabel, line) => {
      byLabel.set(line.label, (byLabel.get(line.label) ?? 0) + line.amountCents);
      return byLabel;
    }, new Map<string, number>()),
  )
    .map(([label, amountCents]) => ({ label, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
  const topExpenses = [
    ...fixedGroups,
    ...(paidDailyTotal > 0 ? [{ label: "Gastos do dia a dia", amountCents: paidDailyTotal }] : []),
  ].sort((a, b) => b.amountCents - a.amountCents).slice(0, 5);
  const pieSlices = [
    ...fixedGroups,
    ...(paidDailyTotal > 0 ? [{ label: "Gastos do dia a dia", amountCents: paidDailyTotal }] : []),
  ].sort((a, b) => b.amountCents - a.amountCents);
  const selectedSlice = pieSlices.find((slice) => slice.label === selectedLabel);
  const highestExpense = topExpenses[0];
  const highestAmount = highestExpense?.amountCents ?? 1;

  if (total === 0) return null;

  const chartSlices = pieSlices.map((slice, index) => {
    const dash = (slice.amountCents / paidTotal) * CIRCUMFERENCE;
    const previousDash = pieSlices
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.amountCents / paidTotal) * CIRCUMFERENCE, 0);
    return { ...slice, dash, offset: -previousDash };
  });

  return (
    <section className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/8 via-card to-card p-5 dark:border-border/70 dark:bg-card dark:bg-none sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><PieChart className="size-4 text-primary" /> Raio-X das saídas</p>
          <p className="mt-1 text-sm text-muted-foreground">Veja a concentração dos gastos pagos em {paidLines.length} lançamentos deste mês.</p>
        </div>
        <div className="rounded-2xl bg-card px-4 py-2 text-right ring-1 ring-border/70">
          <p className="text-xs text-muted-foreground">Quanto saiu até agora</p>
          <p className="text-lg font-bold tabular-nums">{formatCents(paidTotal)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-negative/8 p-3 dark:bg-background dark:ring-1 dark:ring-border/70"><p className="text-xs text-muted-foreground">Despesas fixas</p><p className="mt-1 text-lg font-bold text-negative tabular-nums">{formatCents(fixedTotal)}</p><p className="text-xs text-muted-foreground">{Math.round((fixedTotal / total) * 100)}% das saídas</p></div>
        <div className="rounded-2xl bg-warning/12 p-3 dark:bg-background dark:ring-1 dark:ring-border/70"><p className="text-xs text-muted-foreground">Dia a dia</p><p className="mt-1 text-lg font-bold text-warning-foreground tabular-nums">{formatCents(paidDailyTotal)}</p><p className="text-xs text-muted-foreground">{paidTotal > 0 ? Math.round((paidDailyTotal / paidTotal) * 100) : 0}% das saídas pagas</p></div>
        <div className="rounded-2xl bg-positive/10 p-3 dark:bg-background dark:ring-1 dark:ring-border/70"><p className="text-xs text-muted-foreground">Já pago</p><p className="mt-1 text-lg font-bold text-positive tabular-nums">{formatCents(paidTotal)}</p><p className="text-xs text-muted-foreground">{Math.round((paidTotal / total) * 100)}% confirmado</p></div>
      </div>

      {paidTotal > 0 ? <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="self-start rounded-2xl bg-card/80 p-4 ring-1 ring-border/70">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
            <div className="relative size-40 shrink-0">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="group" aria-label="Gráfico de despesas pagas">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted" />
                {chartSlices.map((slice, index) => {
                  return (
                    <circle
                      key={slice.label}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth="16"
                      strokeDasharray={`${slice.dash} ${CIRCUMFERENCE - slice.dash}`}
                      strokeDashoffset={slice.offset}
                      strokeLinecap="butt"
                      className="cursor-pointer outline-none transition-opacity focus:outline-none"
                      opacity={selectedLabel && selectedLabel !== slice.label ? 0.3 : 1}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedLabel === slice.label}
                      aria-label={`Selecionar ${slice.label}`}
                      onClick={() => setSelectedLabel(selectedLabel === slice.label ? null : slice.label)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedLabel(selectedLabel === slice.label ? null : slice.label);
                        }
                      }}
                    />
                  );
                })}
              </svg>
            </div>
            <ul className="w-full min-w-0 space-y-2 text-xs">
              {pieSlices.map((slice, index) => (
                <li key={slice.label}>
                  <button type="button" onClick={() => setSelectedLabel(selectedLabel === slice.label ? null : slice.label)} aria-pressed={selectedLabel === slice.label} className={`flex w-full items-center justify-between gap-4 rounded-md px-2 py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selectedLabel === slice.label ? "bg-primary/10 font-semibold ring-1 ring-primary/30" : selectedLabel ? "opacity-50" : ""}`}>
                    <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /><span className="break-words">{slice.label}</span></span>
                    <span className="shrink-0 font-semibold tabular-nums">{Math.round((slice.amountCents / paidTotal) * 100)}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {selectedSlice && (
            <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm" aria-live="polite">
              <span className="break-words">{selectedSlice.label}</span>: <strong className="tabular-nums">{formatCents(selectedSlice.amountCents)}</strong>
            </p>
          )}
        </div>

        <div className="self-start rounded-2xl bg-card/80 p-4 ring-1 ring-border/70">
          <p className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="size-4 text-primary" /> Onde mais pesou</p>
          <ol className="mt-4 space-y-3">
            {topExpenses.map((expense, index) => (
              <li key={expense.label} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm"><span className="min-w-0 break-words font-medium">{expense.label}</span><span className="shrink-0 font-semibold tabular-nums">{formatCents(expense.amountCents)}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${(expense.amountCents / highestAmount) * 100}%` }} /></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      : <p className="mt-6 text-sm text-muted-foreground">Nenhuma despesa paga neste mês.</p>}


    </section>
  );
}
