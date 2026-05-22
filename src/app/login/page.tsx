import { PiggyBank } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <PiggyBank className="h-6 w-6" />
          </div>
          <CardTitle>Budżet domowy</CardTitle>
          <CardDescription>Zaloguj się do wspólnego budżetu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input id="login" name="login" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit">Zaloguj</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
