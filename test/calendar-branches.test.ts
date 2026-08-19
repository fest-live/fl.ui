import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveBranches,
  UNASSIGNED_BRANCH_ID,
} from "../src/ui/navigation/calendar/branches.ts";

const t = (iso: string) => new Date(iso);

test("empty base + no events → single unassigned", () => {
  const rows = resolveBranches([], []);
  assert.deepEqual(rows.map((r) => r.id), [UNASSIGNED_BRANCH_ID]);
  assert.equal(rows[0]?.pinned, false);
});

test("pinned base only when day empty", () => {
  const rows = resolveBranches(
    [{ id: "work", label: "Work", pinned: true }],
    [],
  );
  assert.deepEqual(rows.map((r) => r.id), ["work"]);
});

test("missing branchId forces unassigned after pinned", () => {
  const rows = resolveBranches(
    [{ id: "work", label: "Work", pinned: true }],
    [{ start: t("2026-08-19T10:00:00"), branchId: undefined }],
  );
  assert.deepEqual(rows.map((r) => r.id), ["work", UNASSIGNED_BRANCH_ID]);
});

test("unknown branchId becomes dynamic; order by earliest start", () => {
  const rows = resolveBranches(
    [{ id: "work", label: "Work", pinned: true }],
    [
      { start: t("2026-08-19T12:00:00"), branchId: "b" },
      { start: t("2026-08-19T09:00:00"), branchId: "a" },
    ],
  );
  assert.deepEqual(rows.map((r) => r.id), ["work", "a", "b"]);
  assert.equal(rows[1]?.label, "a");
  assert.equal(rows[1]?.pinned, false);
});

test("base id not duplicated when event uses it", () => {
  const rows = resolveBranches(
    [{ id: "work", label: "Work", pinned: true }],
    [{ start: t("2026-08-19T10:00:00"), branchId: "work" }],
  );
  assert.deepEqual(rows.map((r) => r.id), ["work"]);
});
