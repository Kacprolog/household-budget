import { PrismaClient, TransactionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, addMonths, startOfMonth, subMonths } from "date-fns";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres",
});
const prisma = new PrismaClient({ adapter });

const expenseCategories = [
  ["Jedzenie", "#f97316", "Utensils"],
  ["Rachunki", "#06b6d4", "ReceiptText"],
  ["Mieszkanie (czynsz/kredyt)", "#8b5cf6", "Home"],
  ["Transport", "#3b82f6", "Car"],
  ["Zdrowie", "#ef4444", "HeartPulse"],
  ["Rozrywka", "#ec4899", "PartyPopper"],
  ["Ubrania", "#a855f7", "Shirt"],
  ["Subskrypcje", "#14b8a6", "Repeat"],
  ["Prezenty", "#f59e0b", "Gift"],
  ["Wesele", "#db2777", "Gem"],
  ["Wakacje", "#22c55e", "Plane"],
  ["Oszczędności", "#16a34a", "PiggyBank"],
  ["Inne", "#64748b", "CircleHelp"],
] as const;

const incomeCategories = [
  ["Pensja Kacper", "#10b981", "BriefcaseBusiness"],
  ["Pensja Narzeczonej", "#84cc16", "BriefcaseBusiness"],
  ["Zlecenia / freelance", "#0ea5e9", "Laptop"],
  ["Zwroty", "#22c55e", "Undo2"],
  ["Prezenty", "#f59e0b", "Gift"],
  ["Inne", "#64748b", "CircleHelp"],
] as const;

const methods = [
  ["Gotówka", "Banknote"],
  ["Karta", "CreditCard"],
  ["Przelew", "Landmark"],
  ["BLIK", "Smartphone"],
] as const;

async function main() {
  const household = await prisma.household.upsert({
    where: { id: "shared-household" },
    update: {},
    create: { id: "shared-household", name: "Wspólny budżet" },
  });

  const [ownerHash, partnerHash] = await Promise.all([
    bcrypt.hash("KacperBudzet2026!", 12),
    bcrypt.hash("PartnerkaBudzet2026!", 12),
  ]);

  const owner = await prisma.user.upsert({
    where: { login: "kacper" },
    update: { householdId: household.id },
    create: {
      login: "kacper",
      passwordHash: ownerHash,
      displayName: "Kacper",
      color: "#2563eb",
      role: "owner",
      householdId: household.id,
    },
  });

  const partner = await prisma.user.upsert({
    where: { login: "narzeczona" },
    update: { householdId: household.id },
    create: {
      login: "narzeczona",
      passwordHash: partnerHash,
      displayName: "Narzeczona",
      color: "#db2777",
      role: "partner",
      householdId: household.id,
    },
  });

  for (const [name, color, icon] of expenseCategories) {
    await prisma.category.upsert({
      where: { householdId_name_type: { householdId: household.id, name, type: "expense" } },
      update: { color, icon },
      create: { householdId: household.id, name, type: "expense", color, icon, isDefault: true },
    });
  }

  for (const [name, color, icon] of incomeCategories) {
    await prisma.category.upsert({
      where: { householdId_name_type: { householdId: household.id, name, type: "income" } },
      update: { color, icon },
      create: { householdId: household.id, name, type: "income", color, icon, isDefault: true },
    });
  }

  for (const [name, icon] of methods) {
    await prisma.paymentMethod.upsert({
      where: { householdId_name: { householdId: household.id, name } },
      update: { icon },
      create: { householdId: household.id, name, icon },
    });
  }

  const categories = await prisma.category.findMany({ where: { householdId: household.id } });
  const paymentMethods = await prisma.paymentMethod.findMany({ where: { householdId: household.id } });
  const categoryByName = new Map(categories.map((category) => [`${category.type}:${category.name}`, category]));
  const methodByName = new Map(paymentMethods.map((method) => [method.name, method]));
  const card = methodByName.get("Karta")!;
  const transfer = methodByName.get("Przelew")!;
  const cash = methodByName.get("Gotówka")!;

  const now = new Date();
  const monthStarts = [subMonths(startOfMonth(now), 2), subMonths(startOfMonth(now), 1), startOfMonth(now)];
  const samples = monthStarts.flatMap((month, monthIndex) => [
    { type: "income" as TransactionType, amount: 8200 + monthIndex * 150, desc: "Pensja Kacper", cat: "Pensja Kacper", day: 1, method: transfer, user: owner },
    { type: "income" as TransactionType, amount: 6900 + monthIndex * 120, desc: "Pensja Narzeczonej", cat: "Pensja Narzeczonej", day: 1, method: transfer, user: partner },
    { type: "expense" as TransactionType, amount: 2650, desc: "Czynsz i opłaty", cat: "Mieszkanie (czynsz/kredyt)", day: 3, method: transfer, user: owner },
    { type: "expense" as TransactionType, amount: 720 + monthIndex * 35, desc: "Zakupy tygodniowe", cat: "Jedzenie", day: 5, method: card, user: partner },
    { type: "expense" as TransactionType, amount: 190, desc: "Paliwo", cat: "Transport", day: 9, method: card, user: owner },
    { type: "expense" as TransactionType, amount: 89.99, desc: "Streaming", cat: "Subskrypcje", day: 12, method: card, user: partner },
    { type: "expense" as TransactionType, amount: 310 + monthIndex * 20, desc: "Kolacja i kino", cat: "Rozrywka", day: 18, method: card, user: owner },
    { type: "expense" as TransactionType, amount: 450, desc: "Fundusz weselny", cat: "Wesele", day: 21, method: transfer, user: partner },
    { type: "expense" as TransactionType, amount: 600 + monthIndex * 100, desc: "Oszczędności miesięczne", cat: "Oszczędności", day: 24, method: transfer, user: owner },
    { type: "expense" as TransactionType, amount: 120, desc: "Apteka", cat: "Zdrowie", day: 26, method: cash, user: partner },
  ]);

  for (const [index, item] of samples.entries()) {
    const category = categoryByName.get(`${item.type}:${item.cat}`)!;
    await prisma.transaction.upsert({
      where: { id: `sample-${index}` },
      update: {},
      create: {
        id: `sample-${index}`,
        householdId: household.id,
        type: item.type,
        amount: item.amount,
        description: item.desc,
        date: addDays(monthStarts[index >= 20 ? 2 : index >= 10 ? 1 : 0], item.day - 1),
        categoryId: category.id,
        paymentMethodId: item.method.id,
        addedById: item.user.id,
      },
    });
  }

  const currentMonth = startOfMonth(now);
  const budgetValues: Record<string, number> = {
    "Jedzenie": 2600,
    "Rachunki": 900,
    "Mieszkanie (czynsz/kredyt)": 3000,
    "Transport": 900,
    "Zdrowie": 500,
    "Rozrywka": 900,
    "Subskrypcje": 250,
    "Wesele": 1500,
    "Wakacje": 1000,
    "Oszczędności": 2500,
    "Inne": 600,
  };

  for (const [name, limitAmount] of Object.entries(budgetValues)) {
    const category = categoryByName.get(`expense:${name}`);
    if (!category) continue;
    await prisma.budget.upsert({
      where: { householdId_categoryId_month: { householdId: household.id, categoryId: category.id, month: currentMonth } },
      update: { limitAmount },
      create: { householdId: household.id, categoryId: category.id, month: currentMonth, limitAmount },
    });
  }

  const wedding = await prisma.goal.upsert({
    where: { id: "goal-wedding" },
    update: {},
    create: {
      id: "goal-wedding",
      householdId: household.id,
      name: "Wesele",
      targetAmount: 45000,
      currentAmount: 4200,
      deadline: addMonths(now, 14),
      color: "#db2777",
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-vacation" },
    update: {},
    create: {
      id: "goal-vacation",
      householdId: household.id,
      name: "Wakacje 2026",
      targetAmount: 12000,
      currentAmount: 1800,
      deadline: addMonths(now, 8),
      color: "#22c55e",
    },
  });

  const savingsCategory = categoryByName.get("expense:Oszczędności")!;
  await prisma.recurringTransaction.upsert({
    where: { id: "recurring-savings" },
    update: {},
    create: {
      id: "recurring-savings",
      householdId: household.id,
      type: "expense",
      amount: 1200,
      description: "Automatyczna wpłata na oszczędności",
      categoryId: savingsCategory.id,
      paymentMethodId: transfer.id,
      addedById: owner.id,
      frequency: "monthly",
      nextRunAt: addMonths(startOfMonth(now), 1),
    },
  });

  console.log(`Seed gotowy. Household: ${household.name}, cele: ${wedding.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
