import { asc } from "drizzle-orm";
import { db } from "./index";
import { months, users } from "./schema";
import { monthBalance } from "@/lib/calculations";
import type { MonthData } from "@/lib/calculations";

export async function getDashboardData() {
  const [monthRows, withdrawals, userRows] = await Promise.all([
    db.query.months.findMany({
      orderBy: asc(months.orderIndex),
      with: {
        incomeLines: { orderBy: (line, { asc }) => asc(line.orderIndex) },
        expenseLines: { orderBy: (line, { asc }) => asc(line.orderIndex) },
        allocationBuckets: {
          orderBy: (bucket, { asc }) => asc(bucket.orderIndex),
          with: {
            entries: { orderBy: (entry, { desc }) => desc(entry.createdAt) },
          },
        },
      },
    }),
    db.query.reserveWithdrawals.findMany({
      orderBy: (withdrawal, { desc }) => desc(withdrawal.createdAt),
    }),
    db.select().from(users),
  ]);

  return {
    months: (monthRows as MonthData[]).map((month) => {
      const otherBudgets = month.allocationBuckets.filter((bucket) => !bucket.name.toLowerCase().includes("margem")).reduce((sum, bucket) => sum + bucket.budgetCents, 0);
      return { ...month, allocationBuckets: month.allocationBuckets.map((bucket) => bucket.name.toLowerCase().includes("margem") ? { ...bucket, budgetCents: monthBalance(month) - otherBudgets } : bucket) };
    }),
    withdrawals,
    users: userRows,
  };
}
