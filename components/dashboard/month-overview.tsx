import { ColoredProgress } from "@/components/ui/colored-progress";
import { formatCents } from "@/lib/money";
import { commitmentColorClasses } from "@/lib/colors";
import { commitmentRatio, expenseTotal, finalRemaining, incomeTotal } from "@/lib/calculations";
import type { MonthData } from "@/lib/calculations";

export function MonthOverview({
  months,
  activeSlug,
  onSelect,
}: {
  months: MonthData[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {months.map((month) => {
        const income = incomeTotal(month);
        const expenses = expenseTotal(month);
        const remaining = finalRemaining(month);
        const ratio = commitmentRatio(month);
        const active = month.slug === activeSlug;
        const colors = commitmentColorClasses(ratio);

        const remainingColor =
          remaining < 0 ? "text-negative" : remaining > 0 ? "text-warning" : "text-positive";

        return (
          <button
            key={month.id}
            type="button"
            onClick={() => onSelect(month.slug)}
            className={`flex min-w-[240px] snap-start flex-col gap-3 rounded-3xl border px-5 py-4 text-left transition-all ${
              active
                ? "border-primary/60 bg-primary/8 ring-2 ring-primary/25"
                : "border-border/60 bg-card hover:border-primary/30"
            }`}
          >
            <span className="text-sm font-medium text-muted-foreground">{month.label}</span>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground">Entrada</span>
              <span className="text-lg font-semibold tabular-nums">{formatCents(income)}</span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground">Saída</span>
              <span className="text-lg font-semibold tabular-nums text-negative">
                {formatCents(expenses)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">
                Sobra após pagar e alocar
              </span>
              <span className={`text-sm font-bold tabular-nums ${remainingColor}`}>
                {formatCents(remaining)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Comprometimento</span>
              <span className={colors.text}>{Math.round(ratio * 100)}%</span>
            </div>
            <ColoredProgress
              value={Math.min(ratio * 100, 100)}
              indicatorClassName={colors.bar}
              className="h-1.5"
            />
          </button>
        );
      })}
    </div>
  );
}
