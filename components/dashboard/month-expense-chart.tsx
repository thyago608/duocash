import { formatCents } from "@/lib/money";
import { expenseTotal, type MonthData } from "@/lib/calculations";

export function MonthExpenseChart({
  months,
  activeSlug,
  onSelect,
}: {
  months: MonthData[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  const amounts = months.map((month) => expenseTotal(month));
  const peak = Math.max(...amounts, 1);

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Saídas por mês</p>
          <p className="mt-1 text-xs text-muted-foreground">Toque em uma barra para abrir o mês.</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Planejado</span>
      </div>
      <div className="mt-6 flex h-40 items-end justify-between gap-2 sm:gap-4">
        {months.map((month, index) => {
          const amount = amounts[index];
          const active = month.slug === activeSlug;
          const shortLabel = month.label.split(" ")[0]?.slice(0, 3) ?? month.label;
          return (
            <button key={month.id} type="button" onClick={() => onSelect(month.slug)} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2 text-center" aria-label={`Abrir ${month.label}: ${formatCents(amount)} em saídas`}>
              <span className={`text-xs font-semibold tabular-nums transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{formatCents(amount)}</span>
              <span className={`w-full rounded-t-xl transition-all ${active ? "bg-primary" : "bg-primary/25 group-hover:bg-primary/45"}`} style={{ height: `${Math.max((amount / peak) * 100, 8)}%` }} />
              <span className={`text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
