import { describe, expect, it } from "vitest";
import { dueRecurringRuns, recurringExternalId } from "../../src/lib/recurring";

function datesOnly(values: Date[]) {
  return values.map((value) => value.toISOString().slice(0, 10));
}

describe("transakcje cykliczne", () => {
  it("wylicza wszystkie zalegle miesieczne uruchomienia", () => {
    const result = dueRecurringRuns(
      new Date("2026-01-10T08:00:00Z"),
      "monthly",
      new Date("2026-03-11T08:00:00Z"),
    );

    expect(datesOnly(result.runs)).toEqual(["2026-01-10", "2026-02-10", "2026-03-10"]);
    expect(result.nextRunAt.toISOString().slice(0, 10)).toBe("2026-04-10");
    expect(result.capped).toBe(false);
  });

  it("nie generuje uruchomien przed terminem", () => {
    const nextRunAt = new Date("2026-06-10T08:00:00Z");
    const result = dueRecurringRuns(nextRunAt, "monthly", new Date("2026-05-24T08:00:00Z"));

    expect(result.runs).toHaveLength(0);
    expect(result.nextRunAt).toEqual(nextRunAt);
    expect(result.capped).toBe(false);
  });

  it("ucina bardzo dlugie nadrabianie do limitu bez petli bez konca", () => {
    const result = dueRecurringRuns(
      new Date("2026-01-01T08:00:00Z"),
      "weekly",
      new Date("2026-12-31T08:00:00Z"),
      3,
    );

    expect(datesOnly(result.runs)).toEqual(["2026-01-01", "2026-01-08", "2026-01-15"]);
    expect(result.nextRunAt.toISOString().slice(0, 10)).toBe("2026-01-22");
    expect(result.capped).toBe(true);
  });

  it("buduje stabilny identyfikator z daty uruchomienia", () => {
    expect(recurringExternalId("recurring-1", new Date("2026-05-10T22:30:00Z"))).toBe("recurring:recurring-1:2026-05-10");
  });
});
