import test from "node:test";
import assert from "node:assert/strict";
import { resolveAxes } from "../src/ui/navigation/calendar/timeline-axes.ts";

test("resolveAxes week is time × day", () => {
  assert.deepEqual(resolveAxes("week"), { row: "time", col: "day" });
});

test("resolveAxes day is branch × time", () => {
  assert.deepEqual(resolveAxes("day"), { row: "branch", col: "time" });
});

test("resolveAxes month is null", () => {
  assert.equal(resolveAxes("month"), null);
});
