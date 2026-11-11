"use client";

import { ArrowDownLeft, ArrowUpRight, Check } from "lucide-react";
import { GlossaryHint } from "@/components/dashboard/glossary-hint";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { formatCents } from "@/lib/money";
import { commitmentColorClasses } from "@/lib/colors";
import { commitmentRatio, expenseTotal, finalRemaining, incomeTotal } from "@/lib/calculations";
import type { MonthData } from "@/lib/calculations";

export function MonthOverview({ months, activeSlug, onSelect }: { months: MonthData[]; activeSlug: string; onSelect: (slug: string) => void }) {
  return <div className="flex min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
    {months.map((month) => {
      const income = incomeTotal(month);
      const expenses = expenseTotal(month);
      const remaining = finalRemaining(month);
      const ratio = commitmentRatio(month);
      const active = month.slug === activeSlug;
      const colors = commitmentColorClasses(ratio);
      const remainingColor = remaining < 0 ? "text-negative" : remaining > 0 ? "text-warning" : "text-positive";
      const selected = active ? "border-positive/70 bg-positive/10 ring-2 ring-positive/30 dark:border-primary/70 dark:bg-primary/10 dark:ring-primary/30" : "border-border/60 bg-card hover:border-primary/30 hover:shadow-md";
      return <div key={month.id} className={`relative w-[min(240px,100%)] shrink-0 snap-start rounded-3xl border text-left transition-all duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${selected}`}>
        <button type="button" onClick={() => onSelect(month.slug)} aria-pressed={active} aria-label={`Selecionar ${month.label}`} className="absolute inset-0 rounded-3xl outline-none" />
        <div className="pointer-events-none flex flex-col overflow-hidden rounded-3xl">
          <div className={`${active ? "bg-positive/15 dark:bg-primary/15" : "bg-primary/10"} px-5 py-4`}>
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{month.label}</span>{active && <Check className="size-4 text-positive dark:text-primary" />}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><span>Margem planejada livre</span><span className="pointer-events-auto relative"><GlossaryHint title="Margem planejada livre" text="É o valor previsto que sobra da renda do mês depois de considerar as despesas sem categoria, os orçamentos das categorias, os aportes planejados e eventuais gastos acima desses orçamentos. Inclui entradas e despesas ainda pendentes, por isso não representa o saldo em conta." /></span></div>
            <p className={`mt-1 text-xl font-bold tabular-nums ${remainingColor}`}>{formatCents(remaining)}</p>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex justify-between gap-2 text-sm"><span className="flex items-center gap-1 text-muted-foreground"><ArrowDownLeft className="size-3.5 text-positive" /> Entrada</span><span className="font-semibold tabular-nums">{formatCents(income)}</span></div>
            <div className="flex justify-between gap-2 text-sm"><span className="flex items-center gap-1 text-muted-foreground"><ArrowUpRight className="size-3.5 text-negative" /> Saída</span><span className="font-semibold tabular-nums text-negative">{formatCents(expenses)}</span></div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>Comprometimento</span><span className={`font-medium tabular-nums ${colors.text}`}>{Math.round(ratio * 100)}%</span></div>
            <ColoredProgress value={Math.min(ratio * 100, 100)} indicatorClassName={colors.bar} className="h-1.5" />
          </div>
        </div>
      </div>;
    })}
  </div>;
}
