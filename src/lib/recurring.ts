import { nextRunDate } from "./utils";

export const MAX_RECURRING_CATCH_UP = 24;

export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export function recurringExternalId(recurringTransactionId: string, runAt: Date) {
  return `recurring:${recurringTransactionId}:${runAt.toISOString().slice(0, 10)}`;
}

export function dueRecurringRuns(
  nextRunAt: Date,
  frequency: RecurringFrequency,
  now = new Date(),
  maxRuns = MAX_RECURRING_CATCH_UP,
) {
  const runs: Date[] = [];
  let cursor = new Date(nextRunAt);

  while (cursor <= now && runs.length < maxRuns) {
    runs.push(new Date(cursor));
    cursor = nextRunDate(cursor, frequency);
  }

  return {
    runs,
    nextRunAt: cursor,
    capped: cursor <= now,
  };
}
