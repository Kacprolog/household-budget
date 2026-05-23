import { describe, expect, it } from "vitest";
import { normalizeCsvRow } from "../../src/lib/csv-import";

describe("normalizeCsvRow", () => {
  it("normalizuje polski eksport bankowy z przecinkiem w kwocie", () => {
    const row = {
      "Data operacji": "24.05.2026",
      Kwota: "-1 234,56 zł",
      "Opis operacji": "  Sklep   spożywczy  ",
    };

    const result = normalizeCsvRow(row, "mbank");

    expect(result).toMatchObject({
      date: "2026-05-24",
      type: "expense",
      amount: 1234.56,
      description: "Sklep spożywczy",
    });
    expect(result?.externalId).toHaveLength(48);
  });

  it("wykrywa przychód po dodatniej kwocie", () => {
    const result = normalizeCsvRow(
      {
        data: "2026-05-24",
        kwota: "2500.00",
        opis: "Zwrot podatku",
      },
      "auto",
    );

    expect(result).toMatchObject({
      date: "2026-05-24",
      type: "income",
      amount: 2500,
      description: "Zwrot podatku",
    });
  });

  it("wspiera ręczne mapowanie kolumn", () => {
    const result = normalizeCsvRow(
      {
        booked_at: "24/05/2026",
        value: "-59,99",
        merchant: "Netflix",
        group: "Subskrypcje",
        wallet: "Karta",
      },
      "auto",
      {
        date: "booked_at",
        amount: "value",
        description: "merchant",
        category: "group",
        method: "wallet",
      },
    );

    expect(result).toMatchObject({
      date: "2026-05-24",
      type: "expense",
      amount: 59.99,
      categoryName: "Subskrypcje",
      methodName: "Karta",
      description: "Netflix",
    });
  });

  it("odrzuca wiersze bez daty lub kwoty", () => {
    expect(normalizeCsvRow({ kwota: "-10,00" }, "auto")).toBeNull();
    expect(normalizeCsvRow({ data: "24.05.2026" }, "auto")).toBeNull();
  });
});
