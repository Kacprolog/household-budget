import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();

  const [categories, paymentMethods, descriptions] = await Promise.all([
    prisma.category.findMany({
      where: { householdId: user.householdId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, color: true },
    }),
    prisma.paymentMethod.findMany({
      where: { householdId: user.householdId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.transaction.findMany({
      where: { householdId: user.householdId, deletedAt: null, description: { not: null } },
      distinct: ["description"],
      take: 30,
      orderBy: { createdAt: "desc" },
      select: { description: true },
    }),
  ]);

  return Response.json({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
    })),
    paymentMethods,
    descriptions: descriptions.map((item) => item.description).filter(Boolean),
  });
}
