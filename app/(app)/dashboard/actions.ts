"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  incomeLines,
  expenseLines,
  allocationBuckets,
  allocationEntries,
  reserveWithdrawals,
} from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }
  return session.user.id;
}

export async function toggleIncomeReceived(lineId: string, received: boolean) {
  const userId = await requireUserId();

  await db
    .update(incomeLines)
    .set({
      isReceived: received,
      receivedBy: received ? userId : null,
      receivedAt: received ? new Date() : null,
    })
    .where(eq(incomeLines.id, lineId));

  revalidatePath("/dashboard");
}

export async function toggleExpensePaid(lineId: string, paid: boolean) {
  const userId = await requireUserId();

  await db
    .update(expenseLines)
    .set({
      isPaid: paid,
      paidBy: paid ? userId : null,
      paidAt: paid ? new Date() : null,
    })
    .where(eq(expenseLines.id, lineId));

  revalidatePath("/dashboard");
}

const expenseLineSchema = z.object({
  monthId: z.string().uuid(),
  section: z.enum(["fixed", "punctual"]).default("punctual"),
  label: z.string().trim().min(1).max(200),
  amountCents: z.number().int().positive(),
  chipLabel: z.string().trim().max(100).optional(),
});

export async function createExpenseLine(input: z.infer<typeof expenseLineSchema>) {
  const userId = await requireUserId();
  const parsed = expenseLineSchema.parse(input);

  const [{ nextOrderIndex }] = await db
    .select({
      nextOrderIndex: sql<number>`coalesce(max(${expenseLines.orderIndex}), -1) + 1`,
    })
    .from(expenseLines)
    .where(eq(expenseLines.monthId, parsed.monthId));

  const [inserted] = await db
    .insert(expenseLines)
    .values({
      monthId: parsed.monthId,
      section: parsed.section,
      label: parsed.label,
      chipLabel: parsed.chipLabel || null,
      amountCents: parsed.amountCents,
      isPaid: true,
      paidBy: userId,
      paidAt: new Date(),
      orderIndex: nextOrderIndex,
    })
    .returning();

  revalidatePath("/dashboard");
  return inserted;
}

export async function deleteExpenseLine(lineId: string) {
  await requireUserId();
  await db.delete(expenseLines).where(eq(expenseLines.id, lineId));
  revalidatePath("/dashboard");
}

const incomeLineSchema = z.object({
  monthId: z.string().uuid(),
  label: z.string().trim().min(1).max(200),
  amountCents: z.number().int().positive(),
  chipLabel: z.string().trim().max(100).optional(),
});

export async function createIncomeLine(input: z.infer<typeof incomeLineSchema>) {
  const userId = await requireUserId();
  const parsed = incomeLineSchema.parse(input);

  const [{ nextOrderIndex }] = await db
    .select({
      nextOrderIndex: sql<number>`coalesce(max(${incomeLines.orderIndex}), -1) + 1`,
    })
    .from(incomeLines)
    .where(eq(incomeLines.monthId, parsed.monthId));

  const [inserted] = await db
    .insert(incomeLines)
    .values({
      monthId: parsed.monthId,
      label: parsed.label,
      chipLabel: parsed.chipLabel || null,
      amountCents: parsed.amountCents,
      person: "ambos",
      isReceived: true,
      receivedBy: userId,
      receivedAt: new Date(),
      orderIndex: nextOrderIndex,
    })
    .returning();

  revalidatePath("/dashboard");
  return inserted;
}

export async function deleteIncomeLine(lineId: string) {
  await requireUserId();
  await db.delete(incomeLines).where(eq(incomeLines.id, lineId));
  revalidatePath("/dashboard");
}

export async function toggleBucketDeposited(bucketId: string, deposited: boolean) {
  const userId = await requireUserId();

  await db
    .update(allocationBuckets)
    .set({
      isDeposited: deposited,
      depositedBy: deposited ? userId : null,
      depositedAt: deposited ? new Date() : null,
    })
    .where(eq(allocationBuckets.id, bucketId));

  revalidatePath("/dashboard");
}

const entrySchema = z.object({
  bucketId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  description: z.string().trim().max(200).optional(),
});

export async function createAllocationEntry(input: z.infer<typeof entrySchema>) {
  const userId = await requireUserId();
  const parsed = entrySchema.parse(input);

  const [inserted] = await db
    .insert(allocationEntries)
    .values({
      bucketId: parsed.bucketId,
      amountCents: parsed.amountCents,
      description: parsed.description || null,
      createdBy: userId,
    })
    .returning();

  revalidatePath("/dashboard");
  return inserted;
}

export async function deleteAllocationEntry(entryId: string) {
  await requireUserId();
  await db.delete(allocationEntries).where(eq(allocationEntries.id, entryId));
  revalidatePath("/dashboard");
}

const withdrawalSchema = z.object({
  amountCents: z.number().int().positive(),
  description: z.string().trim().max(200).optional(),
});

export async function createReserveWithdrawal(input: z.infer<typeof withdrawalSchema>) {
  const userId = await requireUserId();
  const parsed = withdrawalSchema.parse(input);

  const [inserted] = await db
    .insert(reserveWithdrawals)
    .values({
      amountCents: parsed.amountCents,
      description: parsed.description || null,
      createdBy: userId,
    })
    .returning();

  revalidatePath("/dashboard");
  return inserted;
}

export async function deleteReserveWithdrawal(withdrawalId: string) {
  await requireUserId();
  await db.delete(reserveWithdrawals).where(eq(reserveWithdrawals.id, withdrawalId));
  revalidatePath("/dashboard");
}

export async function clearMonthMarks(monthId: string) {
  await requireUserId();

  await db
    .update(incomeLines)
    .set({ isReceived: false, receivedBy: null, receivedAt: null })
    .where(eq(incomeLines.monthId, monthId));

  await db
    .update(expenseLines)
    .set({ isPaid: false, paidBy: null, paidAt: null })
    .where(eq(expenseLines.monthId, monthId));

  await db
    .update(allocationBuckets)
    .set({ isDeposited: false, depositedBy: null, depositedAt: null })
    .where(eq(allocationBuckets.monthId, monthId));

  revalidatePath("/dashboard");
}

export async function clearReserveWithdrawals() {
  await requireUserId();
  await db.delete(reserveWithdrawals);
  revalidatePath("/dashboard");
}
