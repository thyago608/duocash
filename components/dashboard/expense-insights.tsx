import { BarChart3, PieChart } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { expenseLines } from "@/db/schema";

type ExpenseLine = typeof expenseLines.$inferSelect;

const CHART_COLORS = ["#7c3aed", "#db2777", "#ea580c", "#0891b2", "#16a34a", "#64748b"];
const CIRCUMFERENCE = 2 * Math.PI * 42;

export function ExpenseInsights({ lines }: { lines: ExpenseLine[] }) {
  const total = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const fixedTotal = lines
    .filter((line) => line.section === "fixed")
    .reduce((sum, line) => sum + line.amountCents, 0);
  const dailyTotal = total - fixedTotal;
  const paidTotal = lines
    .filter((line) => line.isPaid)
    .reduce((sum, line) => sum + line.amountCents, 0);

  const grouped = Array.from(
    lines.reduce((byLabel, line) => {
      byLabel.set(line.label, (byLabel.get(line.label) ?? 0) + line.amountCents);
      return byLabel;
    }, new Map<string, number>()),
  )
    .map(([label, amountCents]) => ({ label, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const topExpenses = grouped.slice(0, 5);
  const remainingTotal = grouped.slice(5).reduce((sum, item) => sum + item.amountCents, 0);
  const pieSlices = remainingTotal > 0
    ? [...topExpenses, { label: "Outros gastos", amountCents: remainingTotal }]
    : topExpenses;
  const highestExpense = grouped[0];
  const highestAmount = highestExpense?.amountCents ?? 1;

  if (total === 0) return null;

  const chartSlices = pieSlices.map((slice, index) => {
    const dash = (slice.amountCents / total) * CIRCUMFERENCE;
    const previousDash = pieSlices
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.amountCents / total) * CIRCUMFERENCE, 0);
    return { ...slice, dash, offset: -previousDash };
  });

  return (
    <section className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/8 via-card to-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><PieChart className="size-4 text-primary" /> Raio-X das saídas</p>
          <p className="mt-1 text-sm text-muted-foreground">Veja a concentração dos gastos de {lines.length} lançamentos deste mês.</p>
        </div>
        <div className="rounded-2xl bg-card px-4 py-2 text-right ring-1 ring-border/70">
          <p className="text-xs text-muted-foreground">Total planejado</p>
          <p className="text-lg font-bold tabular-nums">{formatCents(total)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border/70">
          <div className="flex items-center justify-center gap-5 sm:gap-8">
            <div className="relative size-40 shrink-0">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label="Gráfico de pizza das maiores despesas">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted" />
                {chartSlices.map((slice, index) => {
                  return (
                    <circle
                      key={slice.label}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={CHART_COLORS[index]}
                      strokeWidth="16"
                      strokeDasharray={`${slice.dash} ${CIRCUMFERENCE - slice.dash}`}
                      strokeDashoffset={slice.offset}
                      strokeLinecap="butt"
                      className="transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
                    />
                  );
                })}
              </svg>
            </div>
            <ul className="min-w-0 space-y-2 text-xs">
              {pieSlices.map((slice, index) => (
                <li key={slice.label} className="flex items-center justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index] }} /><span className="truncate">{slice.label}</span></span>
                  <span className="shrink-0 font-semibold tabular-nums">{Math.round((slice.amountCents / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border/70">
          <p className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="size-4 text-primary" /> Onde mais pesou</p>
          <ol className="mt-4 space-y-3">
            {topExpenses.map((expense, index) => (
              <li key={expense.label} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{expense.label}</span><span className="shrink-0 font-semibold tabular-nums">{formatCents(expense.amountCents)}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${(expense.amountCents / highestAmount) * 100}%` }} /></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-negative/8 p-3"><p className="text-xs text-muted-foreground">Despesas fixas</p><p className="mt-1 text-lg font-bold text-negative tabular-nums">{formatCents(fixedTotal)}</p><p className="text-xs text-muted-foreground">{Math.round((fixedTotal / total) * 100)}% das saídas</p></div>
        <div className="rounded-2xl bg-warning/12 p-3"><p className="text-xs text-muted-foreground">Dia a dia</p><p className="mt-1 text-lg font-bold text-warning-foreground tabular-nums">{formatCents(dailyTotal)}</p><p className="text-xs text-muted-foreground">{Math.round((dailyTotal / total) * 100)}% das saídas</p></div>
        <div className="rounded-2xl bg-positive/10 p-3"><p className="text-xs text-muted-foreground">Já pago</p><p className="mt-1 text-lg font-bold text-positive tabular-nums">{formatCents(paidTotal)}</p><p className="text-xs text-muted-foreground">{Math.round((paidTotal / total) * 100)}% confirmado</p></div>
      </div>
    </section>
  );
}
