import { TrackedBucketCard } from "@/components/dashboard/tracked-bucket-card";
import { DepositBucketCard } from "@/components/dashboard/deposit-bucket-card";
import { formatCents } from "@/lib/money";
import { finalRemaining, isMarginBucket, type MonthData } from "@/lib/calculations";

export function AllocationBuckets({ month }: { month: MonthData }) {
  const { allocationBuckets: buckets, expenseLines: expenses } = month;
  const cardUsed = expenses.filter((line) => line.section === "punctual" && line.onCreditCard && line.isPaid).reduce((sum, line) => sum + line.amountCents, 0);
  return <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
    {buckets.map((original) => {
      const bucket = isMarginBucket(original) ? { ...original, budgetCents: finalRemaining(month) } : original;
      const linked = expenses.filter((line) => !isMarginBucket(bucket) && line.allocationBucketId === bucket.id);
      return bucket.type === "deposit" ? <DepositBucketCard key={bucket.id} bucket={bucket} /> : <TrackedBucketCard key={bucket.id} bucket={bucket} linkedExpenses={linked} />;
    })}
    <section className="rounded-xl border bg-card p-6"><h4 className="font-semibold">💳 Cartão de crédito</h4><p className="mt-3 text-sm">Usado {formatCents(cardUsed)} de {formatCents(170000)}</p><p className="mt-1 text-sm text-muted-foreground">{cardUsed > 170000 ? "Limite excedido em " : "Disponível "}{formatCents(Math.abs(170000 - cardUsed))}</p></section>
  </div>;
}
