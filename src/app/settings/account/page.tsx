import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, updateAccount } from "@/lib/actions";
import { requireUser } from "@/lib/session";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <AppFrame title="Konto">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent>
            <form action={updateAccount} className="grid gap-4">
              <div className="space-y-2"><Label htmlFor="displayName">Nazwa wyświetlana</Label><Input id="displayName" name="displayName" defaultValue={user.displayName} required /></div>
              <div className="space-y-2"><Label htmlFor="color">Kolor do wykresów</Label><Input id="color" name="color" type="color" defaultValue={user.color} /></div>
              <Button type="submit">Zapisz profil</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Zmiana hasła</CardTitle>
              {user.mustChangePassword ? <Badge className="text-amber-700">Wymagana</Badge> : <Badge className="text-green-700">Zmienione</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <form action={changePassword} className="grid gap-4">
              <div className="space-y-2"><Label htmlFor="currentPassword">Obecne hasło</Label><Input id="currentPassword" name="currentPassword" type="password" required /></div>
              <div className="space-y-2"><Label htmlFor="nextPassword">Nowe hasło</Label><Input id="nextPassword" name="nextPassword" type="password" minLength={10} required /></div>
              <div className="space-y-2"><Label htmlFor="confirmPassword">Powtórz nowe hasło</Label><Input id="confirmPassword" name="confirmPassword" type="password" minLength={10} required /></div>
              <Button type="submit">Zmień hasło</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppFrame>
  );
}
