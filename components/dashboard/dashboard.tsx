"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownLeft, ReceiptText, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { MonthOverview } from "@/components/dashboard/month-overview";
import { IncomeList } from "@/components/dashboard/income-list";
import { ExpenseList } from "@/components/dashboard/expense-list";
import { AllocationBuckets } from "@/components/dashboard/allocation-buckets";
import { MonthResetButton } from "@/components/dashboard/month-reset-button";
import { ReserveSection } from "@/components/dashboard/reserve-section";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LAYOUT_VARIANTS, useLayoutVariant } from "@/lib/use-layout-variant";
import type { MonthData } from "@/lib/calculations";
import type { reserveWithdrawals as reserveWithdrawalsTable } from "@/db/schema";

type ReserveWithdrawal = typeof reserveWithdrawalsTable.$inferSelect;

const panelStyles = {
  income: {
    icon: ArrowDownLeft,
    label: "Entradas",
    description: "Valores que entram no mês",
    className: "border-positive/25 bg-positive/5",
    iconClassName: "bg-positive/15 text-positive",
  },
  fixed: {
    icon: ReceiptText,
    label: "Despesas fixas",
    description: "Contas previsíveis e recorrentes",
    className: "border-negative/20 bg-negative/5",
    iconClassName: "bg-negative/15 text-negative",
  },
  daily: {
    icon: ShoppingBag,
    label: "Dia a dia",
    description: "Gastos variáveis e pontuais",
    className: "border-warning/25 bg-warning/8",
    iconClassName: "bg-warning/20 text-warning-foreground",
  },
} as const;

function FinancialPanel({
  kind,
  children,
  className = "",
}: {
  kind: keyof typeof panelStyles;
  children: ReactNode;
  className?: string;
}) {
  const style = panelStyles[kind];
  const Icon = style.icon;

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 ${style.className} ${className}`}>
      <div className="mb-5 flex items-start gap-3">
        <span className={`rounded-2xl p-2.5 ${style.iconClassName}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold">{style.label}</h3>
          <p className="text-xs text-muted-foreground">{style.description}</p>
        </div>
      </div>
      {children}
    </section>
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

  const currentVariantLabel = LAYOUT_VARIANTS.find((v) => v.value === variant)?.label;

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
      variant={variant}
    />
  );

  const dailyExpenseBlock = (
    <ExpenseList
      key={`${activeMonth.id}-daily-expense`}
      monthId={activeMonth.id}
      lines={activeMonth.expenseLines}
      section="punctual"
      variant={variant}
    />
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Visão geral</p>
          <h1 className="text-2xl font-bold">Planejamento financeiro</h1>
        </div>
        <MonthOverview months={months} activeSlug={activeMonth.slug} onSelect={setActiveSlug} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{activeMonth.label}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <SlidersHorizontal className="size-4" />
              {currentVariantLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LAYOUT_VARIANTS.map((v) => (
                <DropdownMenuItem key={v.value} onClick={() => setVariant(v.value)}>
                  {v.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {variant === "groups" && (
          <div className="flex flex-col gap-4">
            <div id="entradas" className="scroll-mt-24"><FinancialPanel kind="income">{incomeBlock}</FinancialPanel></div>
            <div id="fixas" className="scroll-mt-24"><FinancialPanel kind="fixed">{expenseBlock}</FinancialPanel></div>
            <div id="dia-a-dia" className="scroll-mt-24"><FinancialPanel kind="daily">{dailyExpenseBlock}</FinancialPanel></div>
          </div>
        )}

        {variant === "columns" && (
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
            <div id="entradas" className="scroll-mt-24"><FinancialPanel kind="income">{incomeBlock}</FinancialPanel></div>
            <div id="fixas" className="scroll-mt-24"><FinancialPanel kind="fixed">{expenseBlock}</FinancialPanel></div>
            <div id="dia-a-dia" className="scroll-mt-24"><FinancialPanel kind="daily">{dailyExpenseBlock}</FinancialPanel></div>
          </div>
        )}

        {variant === "focus" && (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <div id="entradas" className="scroll-mt-24 lg:col-span-3"><FinancialPanel kind="income">{incomeBlock}</FinancialPanel></div>
            <div id="fixas" className="scroll-mt-24 lg:col-span-3"><FinancialPanel kind="fixed">{expenseBlock}</FinancialPanel></div>
            <div id="dia-a-dia" className="scroll-mt-24 lg:col-span-6"><FinancialPanel kind="daily" className="shadow-lg shadow-warning/10">{dailyExpenseBlock}</FinancialPanel></div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Como alocar o restante
          </h3>
          <AllocationBuckets
            key={`${activeMonth.id}-buckets`}
            buckets={activeMonth.allocationBuckets}
          />
        </div>

        <div className="flex justify-end">
          <MonthResetButton monthId={activeMonth.id} monthLabel={activeMonth.label} />
        </div>
      </section>

      <section id="reserva" className="flex scroll-mt-24 flex-col gap-4">
        <h2 className="text-lg font-semibold">Reserva de emergência</h2>
        <ReserveSection months={months} withdrawals={withdrawals} />
      </section>
    </div>
  );
}
