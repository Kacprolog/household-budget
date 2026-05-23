import { expect, test } from "@playwright/test";

const login = process.env.E2E_LOGIN;
const password = process.env.E2E_PASSWORD;

test.describe("private v1 smoke", () => {
  test.skip(!login || !password, "Set E2E_LOGIN and E2E_PASSWORD to run production smoke tests.");

  test("logs in, opens core views, loads quick-add data and exports reports", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Login").fill(login!);
    await page.getByLabel("Hasło").fill(password!);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Zalogowano jako")).toBeVisible();

    await page.getByRole("link", { name: "Transakcje" }).click();
    await expect(page.getByRole("heading", { name: "Transakcje" })).toBeVisible();
    await expect(page.getByLabel("Szukaj")).toBeVisible();

    await page.getByRole("button", { name: "Nowa transakcja" }).click();
    await expect(page.getByRole("dialog", { name: "Nowa transakcja" })).toBeVisible();
    await expect(page.getByLabel("Kategoria")).toBeEnabled();
    await expect(page.getByLabel("Metoda")).toBeEnabled();
    await page.getByRole("button", { name: "Zamknij" }).click();

    await page.getByRole("link", { name: "Analityka" }).click();
    await expect(page.getByRole("heading", { name: "Analityka" })).toBeVisible();

    await page.getByRole("link", { name: "Ustawienia", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ustawienia" })).toBeVisible();
    await page.getByRole("link", { name: "Aktywność" }).click();
    await expect(page.getByRole("heading", { name: "Aktywność" })).toBeVisible();
    await expect(page.getByText("Ostatnie zmiany")).toBeVisible();

    const csv = await page.request.get("/api/export/csv");
    expect(csv.ok()).toBe(true);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain('"data","typ","kwota"');

    const pdf = await page.request.get("/api/export/pdf");
    expect(pdf.ok()).toBe(true);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).byteLength).toBeGreaterThan(1000);
  });
});
