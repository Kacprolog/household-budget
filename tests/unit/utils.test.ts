import { afterEach, describe, expect, it, vi } from "vitest";
import { money, nextRunDate, percent, plDate, rangeFromPreset, toNumber } from "../../src/lib/utils";

function readable(value: string) {
  return value.replace(/\u00a0/g, " ");
}

describe("formatowanie finansowe", () => {
  it("formatuje PLN w polskim standardzie", () => {
    expect(readable(money(1234.5))).toBe("1234,50 zł");
    expect(readable(money("-42.3"))).toBe("-42,30 zł");
  });

  it("formatuje procenty i zabezpiecza NaN", () => {
    expect(percent(0.823)).toBe("82%");
    expect(percent(Number.NaN)).toBe("0%");
  });
});

describe("daty budżetowe", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formatuje datę jako DD.MM.YYYY", () => {
    expect(plDate("2026-05-24T12:00:00Z")).toBe("24.05.2026");
  });

  it("wylicza zakres bieżącego, poprzedniego i custom miesiąca", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T10:00:00Z"));

    expect(plDate(rangeFromPreset().from)).toBe("01.05.2026");
    expect(plDate(rangeFromPreset("previous").from)).toBe("01.04.2026");
    expect(plDate(rangeFromPreset("custom", "2026-02-03", "2026-02-09").to)).toBe("09.02.2026");
  });

  it("wylicza kolejne terminy transakcji cyklicznych", () => {
    const base = new Date("2026-05-10T12:00:00Z");

    expect(nextRunDate(base, "weekly").toISOString().slice(0, 10)).toBe("2026-05-17");
    expect(nextRunDate(base, "monthly").toISOString().slice(0, 10)).toBe("2026-06-10");
    expect(nextRunDate(base, "yearly").toISOString().slice(0, 10)).toBe("2027-05-10");
  });
});

describe("konwersja liczb", () => {
  it("obsługuje number, string i obiekty Decimal-like", () => {
    expect(toNumber(12.5)).toBe(12.5);
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber({ toNumber: () => 99.12 })).toBe(99.12);
    expect(toNumber(null)).toBe(0);
  });
});
