import { ArrowDownLeft, ArrowUpRight, Landmark, WalletCards } from "lucide-react";
import { formatCents } from "@/lib/money";
import { expenseTotal, finalRemaining, incomeTotal, type MonthData } from "@/lib/calculations";

export function FinanceHero({ month, reserveBalance }: { month: MonthData; reserveBalance: number }) {
  const remaining = finalRemaining(month);
  const income = incomeTotal(month);
  const expenses = expenseTotal(month);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
      <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/15 sm:p-7">
        <p className="text-sm font-medium text-primary-foreground/70">Disponível em {month.label}</p>
        <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {formatCents(remaining)}
        </p>
        <p className="mt-2 max-w-md text-sm text-primary-foreground/70">
          Depois das despesas e dos valores separados para o mês.
        </p>

        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <a href="#entradas" className="rounded-2xl bg-primary-foreground/12 p-3 transition-colors hover:bg-primary-foreground/18">
            <span className="flex items-center gap-1.5 text-xs text-primary-foreground/70"><ArrowDownLeft className="size-3.5" /> Entradas</span>
            <span className="mt-1 block font-semibold tabular-nums">{formatCents(income)}</span>
          </a>
          <a href="#saidas" className="rounded-2xl bg-primary-foreground/12 p-3 transition-colors hover:bg-primary-foreground/18">
            <span className="flex items-center gap-1.5 text-xs text-primary-foreground/70"><ArrowUpRight className="size-3.5" /> Saídas</span>
            <span className="mt-1 block font-semibold tabular-nums">{formatCents(expenses)}</span>
          </a>
        </div>
      </div>

      <a href="#reserva" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-800 to-zinc-950 p-6 text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:p-7">
        <div className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex h-full flex-col justify-between gap-7">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Reserva de emergência</span>
            <Landmark className="size-5 text-zinc-300" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">{formatCents(reserveBalance)}</p>
            <p className="mt-1 text-xs text-zinc-400">saldo disponível confirmado</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300"><WalletCards className="size-4" /> Ver evolução e movimentações</div>
        </div>
      </a>
    </section>
  );
}
