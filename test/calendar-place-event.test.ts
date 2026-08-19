import test from "node:test";
import assert from "node:assert/strict";
import { placeEvent } from "../src/ui/navigation/calendar/place-event.ts";
import { resolveAxes } from "../src/ui/navigation/calendar/timeline-axes.ts";
import { UNASSIGNED_BRANCH_ID } from "../src/ui/navigation/calendar/branches.ts";

const day = new Date(2026, 7, 19); // Aug 19 2026 local

test("week profile lanes by dateKey", () => {
  const p = placeEvent(
    {
      id: "1",
      start: new Date(2026, 7, 19, 9, 0),
      end: new Date(2026, 7, 19, 10, 30),
    },
    day,
    resolveAxes("week")!,
  );
  assert.ok(p);
  assert.equal(p!.laneKey, "2026-08-19");
  assert.equal(p!.startMinute, 9 * 60);
  assert.equal(p!.endMinute, 10 * 60 + 30);
});

test("day profile lanes by branchId / unassigned", () => {
  const withBranch = placeEvent(
    {
      id: "2",
      start: new Date(2026, 7, 19, 11, 0),
      end: new Date(2026, 7, 19, 12, 0),
      branchId: "work",
    },
    day,
    resolveAxes("day")!,
  );
  assert.equal(withBranch?.laneKey, "work");

  const bare = placeEvent(
    {
      id: "3",
      start: new Date(2026, 7, 19, 11, 0),
      end: new Date(2026, 7, 19, 12, 0),
    },
    day,
    resolveAxes("day")!,
  );
  assert.equal(bare?.laneKey, UNASSIGNED_BRANCH_ID);

  const emptyBranch = placeEvent(
    {
      id: "3b",
      start: new Date(2026, 7, 19, 11, 0),
      end: new Date(2026, 7, 19, 12, 0),
      branchId: "",
    },
    day,
    resolveAxes("day")!,
  );
  assert.equal(emptyBranch?.laneKey, UNASSIGNED_BRANCH_ID);
});

test("non-intersecting day returns null", () => {
  const p = placeEvent(
    {
      id: "4",
      start: new Date(2026, 7, 20, 9, 0),
      end: new Date(2026, 7, 20, 10, 0),
    },
    day,
    resolveAxes("week")!,
  );
  assert.equal(p, null);
});
