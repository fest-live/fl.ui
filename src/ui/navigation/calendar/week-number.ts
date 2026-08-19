/*
 * Filename: week-number.ts
 * FullPath: src/ui/navigation/calendar/week-number.ts
 * Change date and time: 07.52_19.08.2026
 * Reason for changes: Task 5 — ISO week-number helper for month gutter.
 */

/**
 * ISO week number (1–53) for a Date in local time.
 *
 * Uses the Thursday-based ISO algorithm: the ISO week is determined by the
 * Thursday that falls in the same week as the given date. We shift the date
 * to the Thursday of its own ISO week by adding 3 - ISO weekday, then read the
 * year and week from that anchor. This is stable for local-date inputs
 * (no UTC midnight drift) and avoids mutating the caller's Date.
 *
 * INVARIANT: returns an integer in [1, 53].
 */
export function isoWeekNumber(date: Date): number {
    // WHY: copy to avoid mutating caller's Date; work in local time.
    const local = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );

    // ISO weekday: Mon=1..Sun=7. JS getDay(): Sun=0..Sat=6.
    const jsDay = local.getDay();
    const isoWeekday = jsDay === 0 ? 7 : jsDay;

    // Shift to the Thursday of this date's ISO week.
    local.setDate(local.getDate() + (4 - isoWeekday));

    const year = local.getFullYear();

    // First Thursday of that year is always in ISO week 1.
    const firstThursday = new Date(year, 0, 4);
    const firstThuJsDay = firstThursday.getDay();
    const firstThuIsoWeekday = firstThuJsDay === 0 ? 7 : firstThuJsDay;
    firstThursday.setDate(
        firstThursday.getDate() + (4 - firstThuIsoWeekday),
    );

    // Week 1 starts at the Monday of the week containing the first Thursday.
    const weekOneStart = new Date(firstThursday);
    weekOneStart.setDate(weekOneStart.getDate() - 3);

    const diffMs = local.getTime() - weekOneStart.getTime();
    const week = Math.floor(diffMs / (7 * 86_400_000)) + 1;

    return week;
}
