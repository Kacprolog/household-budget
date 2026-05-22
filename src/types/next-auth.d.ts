import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    login: string;
    role: "owner" | "partner";
    color: string;
    householdId: string;
  }

  interface Session {
    user: {
      id: string;
      login: string;
      role: "owner" | "partner";
      color: string;
      householdId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    login?: string;
    role?: "owner" | "partner";
    color?: string;
    householdId?: string;
  }
}
