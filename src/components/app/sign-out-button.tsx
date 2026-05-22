"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="ghost" size="icon" title="Wyloguj" aria-label="Wyloguj">
        <LogOut className="h-5 w-5" />
      </Button>
    </form>
  );
}
