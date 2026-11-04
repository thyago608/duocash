import { asc } from "drizzle-orm";
import { db } from "./index";
import { months, users } from "./schema";
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
    months: monthRows as MonthData[],
    withdrawals,
    users: userRows,
  };
}
