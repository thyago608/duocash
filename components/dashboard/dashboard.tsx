"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownLeft, ChevronDown, ReceiptText, ShoppingBag } from "lucide-react";
import { MonthOverview } from "@/components/dashboard/month-overview";
import { IncomeList } from "@/components/dashboard/income-list";
import { ExpenseList } from "@/components/dashboard/expense-list";
import { AllocationBuckets } from "@/components/dashboard/allocation-buckets";
import { MonthResetButton } from "@/components/dashboard/month-reset-button";
import { ReserveSection } from "@/components/dashboard/reserve-section";
import { ExpenseInsights } from "@/components/dashboard/expense-insights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LAYOUT_VARIANTS, useLayoutVariant } from "@/lib/use-layout-variant";
import { cashAvailable, finalRemaining } from "@/lib/calculations";
import { formatCents } from "@/lib/money";
import type { MonthData } from "@/lib/calculations";
import type { reserveWithdrawals as reserveWithdrawalsTable } from "@/db/schema";

type ReserveWithdrawal = typeof reserveWithdrawalsTable.$inferSelect;

const panelStyles = {
  income: {
    icon: ArrowDownLeft,
    label: "Entradas",
    description: "Valores que entram no mês",
    className: "border-positive/25 bg-positive/5 dark:border-border/70 dark:bg-card",
    iconClassName: "bg-positive/15 text-positive",
  },
  fixed: {
    icon: ReceiptText,
    label: "Despesas fixas",
    description: "Contas previsíveis e recorrentes",
    className: "border-negative/20 bg-negative/5 dark:border-border/70 dark:bg-card",
    iconClassName: "bg-negative/15 text-negative",
  },
  daily: {
    icon: ShoppingBag,
    label: "Dia a dia",
    description: "Gastos variáveis e pontuais",
    className: "border-warning/25 bg-warning/8 dark:border-border/70 dark:bg-card",
    iconClassName: "bg-warning/20 text-warning-foreground",
  },
} as const;

function FinancialPanel({
  kind,
  children,
  month,
  className = "",
}: {
  kind: keyof typeof panelStyles;
  children: ReactNode;
  month: MonthData;
  className?: string;
}) {
  const style = panelStyles[kind];
  const Icon = style.icon;
  const lines = kind === "income" ? month.incomeLines : month.expenseLines.filter((line) => line.section === (kind === "fixed" ? "fixed" : "punctual"));
  const total = lines.reduce((sum, line) => sum + (line.amountCents ?? 0), 0);
  const completed = lines.reduce((sum, line) => sum + (("isReceived" in line ? line.isReceived : line.isPaid) ? (line.amountCents ?? 0) : 0), 0);

  return (
    <details className={`group min-w-0 rounded-3xl border p-4 sm:p-5 ${style.className} ${className}`}>
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <span className={`rounded-2xl p-2.5 ${style.iconClassName}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold">{style.label}</h3>
          <p className="text-xs text-muted-foreground">{style.description}</p>
          <p className="mt-1 text-xs text-muted-foreground group-open:hidden">{kind === "income" ? "Recebido" : "Pago"}: {formatCents(completed)} de {formatCents(total)}</p>
        </div>
        <ChevronDown aria-hidden="true" className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

export function Dashboard({
  months,
  withdrawals,
}: {
  months: MonthData[];
  withdrawals: ReserveWithdrawal[];
}) {
  const [activeSlug, setActiveSlug] = useState(months[0]?.slug);
  const { variant, setVariant } = useLayoutVariant();
  const activeMonth = months.find((m) => m.slug === activeSlug) ?? months[0];

  if (!activeMonth) return null;

  const incomeBlock = (
    <IncomeList
      key={`${activeMonth.id}-income`}
      monthId={activeMonth.id}
      lines={activeMonth.incomeLines}
      variant={variant}
    />
  );

  const expenseBlock = (
    <ExpenseList
      key={`${activeMonth.id}-fixed-expense`}
      monthId={activeMonth.id}
      lines={activeMonth.expenseLines}
      section="fixed"
      monthLabel={activeMonth.label}
      buckets={activeMonth.allocationBuckets}
      variant={variant}
    />
  );

  const dailyExpenseBlock = (
    <ExpenseList
      key={`${activeMonth.id}-daily-expense-${JSON.stringify(activeMonth.expenseLines)}`}
      monthId={activeMonth.id}
      lines={activeMonth.expenseLines}
      section="punctual"
      monthLabel={activeMonth.label}
      buckets={activeMonth.allocationBuckets}
      variant={variant}
    />
  );

  return (
    <div className="mx-auto flex min-w-0 max-w-5xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Visão geral</p>
          <h1 className="text-2xl font-bold">Planejamento financeiro</h1>
        </div>
        <MonthOverview months={months} activeSlug={activeMonth.slug} onSelect={setActiveSlug} />
      </section>

      <Tabs value={variant} onValueChange={(value) => { const selected = LAYOUT_VARIANTS.find((item) => item.value === value); if (selected) setVariant(selected.value); }} className="gap-6">
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{activeMonth.label}</h2>
          <div className="max-w-full overflow-x-auto">
            <TabsList aria-label="Modo de visualização" className="h-auto min-h-9">
              {LAYOUT_VARIANTS.map((v) => (
                <TabsTrigger key={v.value} value={v.value} className="min-h-8 px-3">
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <TabsContent value="groups" className="text-base">
          <div className="flex flex-col gap-4">
            <div id="entradas" className="scroll-mt-24"><FinancialPanel month={activeMonth} kind="income">{incomeBlock}</FinancialPanel></div>
            <div id="fixas" className="scroll-mt-24"><FinancialPanel month={activeMonth} kind="fixed">{expenseBlock}</FinancialPanel></div>
            <div id="dia-a-dia" className="scroll-mt-24"><FinancialPanel month={activeMonth} kind="daily">{dailyExpenseBlock}</FinancialPanel></div>
          </div>
        </TabsContent>

        <TabsContent value="flow" className="text-base"><ExpenseInsights lines={activeMonth.expenseLines} /></TabsContent>

        {variant !== "flow" && (
          <>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Como alocar o restante
          </h3>
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p>Margem planejada livre: <strong>{formatCents(finalRemaining(activeMonth))}</strong></p>
            <p className="mt-1">Saldo em caixa: <strong>{formatCents(cashAvailable(activeMonth))}</strong></p>
            <p className="mt-1 text-muted-foreground">O saldo em caixa considera entradas recebidas, despesas pagas e aportes confirmados; não desconta contas pendentes nem valores reservados nas categorias.</p>
            <p className="mt-1 text-muted-foreground">A margem considera despesas pendentes e metas das categorias. Compras no cartão são tratadas como pagas no lançamento; confira se a fatura também cadastrada não está sendo contada em duplicidade.</p>
          </div>
          <AllocationBuckets key={`${activeMonth.id}-buckets`} month={activeMonth} />
        </div>

        <div className="flex justify-end">
          <MonthResetButton monthId={activeMonth.id} monthLabel={activeMonth.label} />
        </div>
          </>
        )}
      </section>

      {variant !== "flow" && <section id="reserva" className="flex scroll-mt-24 flex-col gap-4">
        <h2 className="text-lg font-semibold">Reserva de emergência</h2>
        <ReserveSection months={months} withdrawals={withdrawals} />
      </section>}
      </Tabs>
    </div>
  );
}
