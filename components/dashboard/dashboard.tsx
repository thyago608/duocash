"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { MonthOverview } from "@/components/dashboard/month-overview";
import { IncomeList } from "@/components/dashboard/income-list";
import { ExpenseList } from "@/components/dashboard/expense-list";
import { AllocationBuckets } from "@/components/dashboard/allocation-buckets";
import { MonthResetButton } from "@/components/dashboard/month-reset-button";
import { ReserveSection } from "@/components/dashboard/reserve-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      key={`${activeMonth.id}-expense`}
      monthId={activeMonth.id}
      lines={activeMonth.expenseLines}
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

        {variant === "tabs" ? (
          <Tabs defaultValue="income">
            <TabsList>
              <TabsTrigger value="income">Entradas</TabsTrigger>
              <TabsTrigger value="expense">Saídas</TabsTrigger>
            </TabsList>
            <TabsContent id="entradas" value="income" className="scroll-mt-24">{incomeBlock}</TabsContent>
            <TabsContent id="saidas" value="expense" className="scroll-mt-24">{expenseBlock}</TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div id="entradas" className="scroll-mt-24">{incomeBlock}</div>
            <div id="saidas" className="scroll-mt-24">{expenseBlock}</div>
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
