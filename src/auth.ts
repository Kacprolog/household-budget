import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  login: z.string().min(2).max(80),
  password: z.string().min(8).max(200),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= 8;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const credentials = loginSchema.safeParse(rawCredentials);
        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0] ??
          request?.headers.get("x-real-ip") ??
          "local";

        if (!rateLimit(`${ip}:${String(rawCredentials?.login ?? "")}`)) return null;
        if (!credentials.success) return null;

        const user = await prisma.user.findUnique({
          where: { login: credentials.data.login },
          include: { household: true },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(credentials.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.displayName,
          login: user.login,
          role: user.role,
          color: user.color,
          householdId: user.householdId,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/login") || path.startsWith("/api/auth")) return true;
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.login = user.login;
        token.role = user.role;
        token.color = user.color;
        token.householdId = user.householdId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.login = token.login as string;
        session.user.role = token.role as "owner" | "partner";
        session.user.color = token.color as string;
        session.user.householdId = token.householdId as string;
      }
      return session;
    },
  },
});
