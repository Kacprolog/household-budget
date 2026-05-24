import { describe, expect, it } from "vitest";
import { transactionWhereFromParams } from "../../src/lib/transaction-filters";

describe("transactionWhereFromParams", () => {
  it("buduje spójny filtr zakresu, wyszukiwania i pól słownikowych", () => {
    const where = transactionWhereFromParams(
      new URLSearchParams({
        type: "expense",
        categoryId: "cat_1",
        addedById: "user_1",
        paymentMethodId: "method_1",
        from: "2026-05-01",
        to: "2026-05-24",
        q: "  sklep  ",
      }),
      "household_1",
    );

    expect(where).toMatchObject({
      householdId: "household_1",
      deletedAt: null,
      type: "expense",
      categoryId: "cat_1",
      addedById: "user_1",
      paymentMethodId: "method_1",
      description: { contains: "sklep", mode: "insensitive" },
    });
    expect(where.date).toMatchObject({
      gte: new Date("2026-05-01T00:00:00"),
      lte: new Date("2026-05-24T23:59:59"),
    });
  });

  it("obsługuje widok usuniętych i ignoruje nieznany typ", () => {
    const where = transactionWhereFromParams({ deleted: "only", type: "bad" }, "household_1");

    expect(where).toMatchObject({
      householdId: "household_1",
      deletedAt: { not: null },
    });
    expect(where).not.toHaveProperty("type");
  });
});
