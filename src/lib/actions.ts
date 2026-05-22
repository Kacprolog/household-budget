"use server";

import bcrypt from "bcryptjs";
import { startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { nextRunDate } from "@/lib/utils";

const amountSchema = z.coerce.number().positive().max(999_999_999);

export async function loginAction(formData: FormData) {
  const login = String(formData.get("login") ?? "");
  const password = String(formData.get("password") ?? "");
  await signIn("credentials", { login, password, redirectTo: "/" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createTransaction(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      type: z.enum(["income", "expense"]),
      amount: amountSchema,
      categoryId: z.string().min(1),
      paymentMethodId: z.string().min(1),
      description: z.string().optional(),
      date: z.string().min(1),
      recurrence: z.enum(["none", "weekly", "monthly", "yearly"]).default("none"),
    })
    .parse({
      type: formData.get("type"),
      amount: formData.get("amount"),
      categoryId: formData.get("categoryId"),
      paymentMethodId: formData.get("paymentMethodId"),
      description: formData.get("description"),
      date: formData.get("date"),
      recurrence: formData.get("recurrence") || "none",
    });

  const date = new Date(`${parsed.date}T12:00:00`);
  const transaction = await prisma.transaction.create({
    data: {
      householdId: user.householdId,
      addedById: user.id,
      type: parsed.type,
      amount: parsed.amount,
      categoryId: parsed.categoryId,
      paymentMethodId: parsed.paymentMethodId,
      description: parsed.description?.trim() || null,
      date,
    },
  });

  if (parsed.recurrence !== "none") {
    const recurring = await prisma.recurringTransaction.create({
      data: {
        householdId: user.householdId,
        addedById: user.id,
        type: parsed.type,
        amount: parsed.amount,
        categoryId: parsed.categoryId,
        paymentMethodId: parsed.paymentMethodId,
        description: parsed.description?.trim() || null,
        frequency: parsed.recurrence,
        nextRunAt: nextRunDate(date, parsed.recurrence),
      },
    });
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { recurringTransactionId: recurring.id },
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/analytics");
}

export async function deleteTransaction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.transaction.updateMany({
    where: { id, householdId: user.householdId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/analytics");
}

export async function updateBudget(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      categoryId: z.string().min(1),
      limitAmount: amountSchema,
      month: z.string().min(1),
    })
    .parse({
      categoryId: formData.get("categoryId"),
      limitAmount: formData.get("limitAmount"),
      month: formData.get("month"),
    });
  const month = startOfMonth(new Date(`${parsed.month}-01T12:00:00`));

  await prisma.budget.upsert({
    where: {
      householdId_categoryId_month: {
        householdId: user.householdId,
        categoryId: parsed.categoryId,
        month,
      },
    },
    update: { limitAmount: parsed.limitAmount },
    create: {
      householdId: user.householdId,
      categoryId: parsed.categoryId,
      month,
      limitAmount: parsed.limitAmount,
    },
  });
  revalidatePath("/");
  revalidatePath("/budgets");
}

export async function createGoal(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().min(2).max(80),
      targetAmount: amountSchema,
      deadline: z.string().optional(),
      color: z.string().default("#22c55e"),
    })
    .parse({
      name: formData.get("name"),
      targetAmount: formData.get("targetAmount"),
      deadline: formData.get("deadline") || undefined,
      color: formData.get("color") || "#22c55e",
    });

  await prisma.goal.create({
    data: {
      householdId: user.householdId,
      name: parsed.name,
      targetAmount: parsed.targetAmount,
      deadline: parsed.deadline ? new Date(`${parsed.deadline}T12:00:00`) : null,
      color: parsed.color,
    },
  });
  revalidatePath("/");
  revalidatePath("/goals");
}

export async function contributeGoal(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      goalId: z.string().min(1),
      amount: amountSchema,
      categoryId: z.string().min(1),
      paymentMethodId: z.string().min(1),
    })
    .parse({
      goalId: formData.get("goalId"),
      amount: formData.get("amount"),
      categoryId: formData.get("categoryId"),
      paymentMethodId: formData.get("paymentMethodId"),
    });

  await prisma.$transaction(async (tx) => {
    const goal = await tx.goal.findFirstOrThrow({
      where: { id: parsed.goalId, householdId: user.householdId },
    });
    const transaction = await tx.transaction.create({
      data: {
        householdId: user.householdId,
        type: "expense",
        amount: parsed.amount,
        description: `Wpłata na cel: ${goal.name}`,
        date: new Date(),
        categoryId: parsed.categoryId,
        paymentMethodId: parsed.paymentMethodId,
        addedById: user.id,
        goalId: goal.id,
      },
    });
    await tx.goalContribution.create({
      data: {
        goalId: goal.id,
        amount: parsed.amount,
        addedById: user.id,
        transactionId: transaction.id,
      },
    });
    await tx.goal.update({
      where: { id: goal.id },
      data: { currentAmount: { increment: parsed.amount } },
    });
  });

  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/transactions");
}

export async function createCategory(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().min(2).max(80),
      type: z.enum(["income", "expense"]),
      color: z.string().min(4).max(20),
      icon: z.string().min(2).max(50),
    })
    .parse({
      name: formData.get("name"),
      type: formData.get("type"),
      color: formData.get("color"),
      icon: formData.get("icon"),
    });
  await prisma.category.upsert({
    where: {
      householdId_name_type: {
        householdId: user.householdId,
        name: parsed.name,
        type: parsed.type,
      },
    },
    update: { color: parsed.color, icon: parsed.icon },
    create: { ...parsed, householdId: user.householdId },
  });
  revalidatePath("/settings/categories");
}

export async function deleteCategory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const count = await prisma.transaction.count({
    where: { householdId: user.householdId, categoryId: id, deletedAt: null },
  });
  if (count === 0) {
    await prisma.category.deleteMany({ where: { id, householdId: user.householdId } });
  }
  revalidatePath("/settings/categories");
}

export async function createPaymentMethod(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().min(2).max(50),
      icon: z.string().min(2).max(50),
    })
    .parse({ name: formData.get("name"), icon: formData.get("icon") });

  await prisma.paymentMethod.upsert({
    where: { householdId_name: { householdId: user.householdId, name: parsed.name } },
    update: { icon: parsed.icon },
    create: { ...parsed, householdId: user.householdId },
  });
  revalidatePath("/settings/payment-methods");
}

export async function createBankConnection(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      provider: z.enum(["kontomatik", "fizen", "enable_banking", "neonomics", "salt_edge", "gocardless", "csv_only"]),
      displayName: z.string().min(2).max(80),
    })
    .parse({
      provider: formData.get("provider"),
      displayName: formData.get("displayName"),
    });

  await prisma.bankConnection.create({
    data: {
      householdId: user.householdId,
      provider: parsed.provider,
      displayName: parsed.displayName,
      status: parsed.provider === "csv_only" ? "connected" : "draft",
      errorMessage:
        parsed.provider === "csv_only"
          ? null
          : "Czeka na konfigurację kluczy API dostawcy PSD2 i flow zgody bankowej.",
    },
  });
  revalidatePath("/settings/banks");
}

export async function disableBankConnection(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.bankConnection.updateMany({
    where: { id, householdId: user.householdId },
    data: { status: "disabled" },
  });
  revalidatePath("/settings/banks");
}

export async function syncBankConnections() {
  const user = await requireUser();
  const connections = await prisma.bankConnection.findMany({
    where: { householdId: user.householdId, status: { in: ["connected", "draft"] } },
  });

  for (const connection of connections) {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        errorMessage:
          connection.provider === "csv_only"
            ? null
            : "Synchronizacja PSD2 czeka na klucze API i implementację konkretnego dostawcy.",
      },
    });
  }
  revalidatePath("/settings/banks");
}

export async function updateAccount(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({
      displayName: z.string().min(2).max(80),
      color: z.string().min(4).max(20),
    })
    .parse({
      displayName: formData.get("displayName"),
      color: formData.get("color"),
    });
  await prisma.user.update({ where: { id: user.id }, data: parsed });
  revalidatePath("/settings/account");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (nextPassword.length < 10 || nextPassword !== confirmPassword) return;
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(nextPassword, 12) },
  });
  redirect("/settings/account?password=changed");
}

export async function runRecurringTransactions() {
  const due = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextRunAt: { lte: new Date() } },
  });

  for (const item of due) {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          householdId: item.householdId,
          type: item.type,
          amount: item.amount,
          description: item.description,
          date: item.nextRunAt,
          categoryId: item.categoryId,
          paymentMethodId: item.paymentMethodId,
          addedById: item.addedById,
          recurringTransactionId: item.id,
          source: "recurring",
          externalId: `recurring:${item.id}:${item.nextRunAt.toISOString().slice(0, 10)}`,
        },
      });
      await tx.recurringTransaction.update({
        where: { id: item.id },
        data: {
          lastRunAt: item.nextRunAt,
          nextRunAt: nextRunDate(item.nextRunAt, item.frequency),
        },
      });
    });
  }
}
