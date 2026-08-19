/*
 * Filename: branches.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/calendar/branches.ts
 * Change date and time: 07.44.00_19.08.2026
 * Reason for changes: Hybrid day-view branch rows from pinned base + event hints.
 */

export type BranchId = string;
export const UNASSIGNED_BRANCH_ID = "unassigned" as const;

export interface CalendarBranch {
  id: BranchId;
  label: string;
  color?: string;
  pinned?: boolean;
}

export interface BranchEventHint {
  branchId?: BranchId;
  start: Date;
}

const UNASSIGNED_LABEL = "Общее";

function normalizeBase(base: CalendarBranch[]): CalendarBranch[] {
  return base.map((branch) => ({
    ...branch,
    pinned: true,
  }));
}

export function isUnassignedBranchId(branchId: BranchId | undefined): boolean {
  return branchId == null || branchId === "";
}

/**
 * Hybrid rows for day view.
 * - pinned base order preserved
 * - dynamic ids from events not in base (order: earliest start, tie-break id)
 * - unassigned last when any event lacks branchId OR no other rows exist
 */
export function resolveBranches(
  base: CalendarBranch[],
  eventsOfDay: BranchEventHint[],
): CalendarBranch[] {
  const normalizedBase = normalizeBase(base);
  const baseIds = new Set(normalizedBase.map((branch) => branch.id));

  const dynamicEarliestStart = new Map<BranchId, number>();
  let hasUnassignedEvents = false;

  for (const event of eventsOfDay) {
    if (isUnassignedBranchId(event.branchId)) {
      hasUnassignedEvents = true;
      continue;
    }

    const branchId = event.branchId!;
    if (baseIds.has(branchId)) {
      continue;
    }

    const startMs = event.start.getTime();
    const existing = dynamicEarliestStart.get(branchId);
    if (existing == null || startMs < existing) {
      dynamicEarliestStart.set(branchId, startMs);
    }
  }

  const dynamicIds = [...dynamicEarliestStart.keys()].sort((left, right) => {
    const startDiff =
      dynamicEarliestStart.get(left)! - dynamicEarliestStart.get(right)!;
    if (startDiff !== 0) {
      return startDiff;
    }
    return left.localeCompare(right);
  });

  const dynamicBranches: CalendarBranch[] = dynamicIds.map((id) => ({
    id,
    label: id,
    pinned: false,
  }));

  const rows = [...normalizedBase, ...dynamicBranches];

  if (hasUnassignedEvents || rows.length === 0) {
    const hasUnassignedRow = rows.some(
      (row) => row.id === UNASSIGNED_BRANCH_ID,
    );
    if (!hasUnassignedRow) {
      rows.push({
        id: UNASSIGNED_BRANCH_ID,
        label: UNASSIGNED_LABEL,
        pinned: false,
      });
    }
  }

  return rows;
}
