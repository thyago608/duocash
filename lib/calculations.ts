import type { incomeLines, expenseLines, allocationBuckets, allocationEntries } from "@/db/schema";

type IncomeLine = typeof incomeLines.$inferSelect;
type ExpenseLine = typeof expenseLines.$inferSelect;
type AllocationBucket = typeof allocationBuckets.$inferSelect;
type AllocationEntry = typeof allocationEntries.$inferSelect;

export type BucketWithEntries = AllocationBucket & { entries: AllocationEntry[] };

export type MonthData = {
  id: string;
  slug: string;
  label: string;
  orderIndex: number;
  incomeLines: IncomeLine[];
  expenseLines: ExpenseLine[];
  allocationBuckets: BucketWithEntries[];
};

const sum = (values: Array<number | null>) =>
  values.reduce<number>((acc, value) => acc + (value ?? 0), 0);

export function incomeTotal(month: MonthData, person?: "thyago" | "thayla") {
  const lines = person
    ? month.incomeLines.filter((line) => line.person === person || line.person === "ambos")
    : month.incomeLines;
  return sum(lines.map((line) => line.amountCents));
}

export function expenseTotal(month: MonthData, section?: "fixed" | "punctual") {
  const lines = section
    ? month.expenseLines.filter((line) => line.section === section)
    : month.expenseLines;
  return sum(lines.map((line) => line.amountCents));
}

/** Saldo disponível (mês) = Total renda − Despesas fixas − Pontuais */
export function monthBalance(month: MonthData) {
  return incomeTotal(month) - expenseTotal(month, "fixed") - expenseTotal(month, "punctual");
}

/** Comprometimento (%) = Despesas totais / Renda total */
export function commitmentRatio(month: MonthData) {
  const income = incomeTotal(month);
  if (income === 0) return 0;
  return expenseTotal(month) / income;
}

/** Soma dos orçamentos planejados em "Como alocar o restante" */
export function bucketBudgetTotal(month: MonthData) {
  return sum(month.allocationBuckets.map((bucket) => bucket.budgetCents));
}

/** Sobra final = saldo disponível − soma dos orçamentos já alocados nos blocos */
export function finalRemaining(month: MonthData) {
  return monthBalance(month) - bucketBudgetTotal(month);
}

/** Restante (bloco rastreado) = budget_cents − soma(allocation_entries.amount_cents) */
export function bucketUsed(bucket: BucketWithEntries) {
  return sum(bucket.entries.map((entry) => entry.amountCents));
}

export function bucketRemaining(bucket: BucketWithEntries) {
  return bucket.budgetCents - bucketUsed(bucket);
}

export function depositBuckets(months: MonthData[]) {
  return months
    .flatMap((month) => month.allocationBuckets.map((bucket) => ({ month, bucket })))
    .filter((entry) => entry.bucket.type === "deposit")
    .sort((a, b) => a.month.orderIndex - b.month.orderIndex);
}

export function reserveDepositedTotal(months: MonthData[]) {
  return sum(
    depositBuckets(months)
      .filter((entry) => entry.bucket.isDeposited)
      .map((entry) => entry.bucket.budgetCents),
  );
}

export function reserveProjectedTotal(months: MonthData[]) {
  return sum(depositBuckets(months).map((entry) => entry.bucket.budgetCents));
}

/** Saldo da reserva = depósitos confirmados − soma(reserve_withdrawals) */
export function reserveBalance(months: MonthData[], withdrawalsCents: number[]) {
  return reserveDepositedTotal(months) - sum(withdrawalsCents);
}

/** Meta da reserva = RESERVE_MONTHS_COVERAGE × despesas fixas do mês mais recente */
export function reserveGoal(months: MonthData[], monthsCoverage: number) {
  const latest = [...months].sort((a, b) => b.orderIndex - a.orderIndex)[0];
  if (!latest) return 0;
  return monthsCoverage * expenseTotal(latest, "fixed");
}
