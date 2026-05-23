import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      login: true,
      passwordHash: true,
      mustChangePassword: true,
      displayName: true,
      color: true,
      role: true,
      householdId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) redirect("/login");
  return user;
});
