import test from "node:test";
import assert from "node:assert/strict";
import { isoWeekNumber } from "../src/ui/navigation/calendar/week-number.ts";

test("isoWeekNumber known dates", () => {
  // 2026-01-01 is Thursday → ISO week 1
  assert.equal(isoWeekNumber(new Date(2026, 0, 1)), 1);
  // 2026-08-19 is Wednesday → ISO week 34
  assert.equal(isoWeekNumber(new Date(2026, 7, 19)), 34);
});

test("isoWeekNumber handles year boundary", () => {
  // 2025-12-31 is Wednesday → ISO week 1 of 2026
  assert.equal(isoWeekNumber(new Date(2025, 11, 31)), 1);
  // 2027-01-01 is Friday → ISO week 53 of 2026
  assert.equal(isoWeekNumber(new Date(2027, 0, 1)), 53);
});

test("isoWeekNumber returns value in 1..53", () => {
  for (let m = 0; m < 12; m++) {
    const week = isoWeekNumber(new Date(2026, m, 15));
    assert.ok(week >= 1 && week <= 53, `week ${week} out of range`);
  }
});
