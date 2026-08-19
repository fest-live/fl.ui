/*
 * Filename: place-event.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/calendar/place-event.ts
 * Change date and time: 07.47.00_19.08.2026
 * Reason for changes: Map events to timeline lanes for week/day axis profiles.
 */

import type { TimelineAxes } from "./timeline-axes.ts";
import { UNASSIGNED_BRANCH_ID } from "./branches.ts";

export interface PlaceableEvent {
  id: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  branchId?: string;
}

export interface EventPlacement {
  eventId: string;
  /** Key on the non-time axis: dateKey (week) or branchId (day). */
  laneKey: string;
  /** Minutes from local midnight of the clipped day. */
  startMinute: number;
  endMinute: number;
  allDay: boolean;
}

const MINUTES_PER_DAY = 24 * 60;

/** Local calendar date as YYYY-MM-DD. */
function dateKey(day: Date): string {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localDayBounds(activeDay: Date): { dayStart: Date; dayEnd: Date } {
  const dayStart = new Date(
    activeDay.getFullYear(),
    activeDay.getMonth(),
    activeDay.getDate(),
    0,
    0,
    0,
    0,
  );
  const dayEnd = new Date(
    activeDay.getFullYear(),
    activeDay.getMonth(),
    activeDay.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return { dayStart, dayEnd };
}

function minutesFromMidnight(instant: Date): number {
  return instant.getHours() * 60 + instant.getMinutes();
}

function isWeekProfile(axes: TimelineAxes): boolean {
  return axes.col === "day";
}

function isDayProfile(axes: TimelineAxes): boolean {
  return axes.row === "branch";
}

function resolveLaneKey(
  event: PlaceableEvent,
  activeDay: Date,
  axes: TimelineAxes,
): string {
  if (isWeekProfile(axes)) {
    return dateKey(activeDay);
  }
  if (isDayProfile(axes)) {
    return event.branchId ?? UNASSIGNED_BRANCH_ID;
  }
  return dateKey(activeDay);
}

/**
 * Clip event to `activeDay` (local calendar day) and map to a lane.
 * week axes → laneKey = YYYY-MM-DD of activeDay
 * day axes → laneKey = branchId ?? UNASSIGNED_BRANCH_ID
 * Returns null if event does not intersect activeDay.
 */
export function placeEvent(
  event: PlaceableEvent,
  activeDay: Date,
  axes: TimelineAxes,
): EventPlacement | null {
  const { dayStart, dayEnd } = localDayBounds(activeDay);
  const eventStart = event.start.getTime();
  const eventEnd = event.end.getTime();

  if (eventStart >= dayEnd.getTime() || eventEnd <= dayStart.getTime()) {
    return null;
  }

  const allDay = event.allDay === true;

  if (allDay) {
    return {
      eventId: event.id,
      laneKey: resolveLaneKey(event, activeDay, axes),
      startMinute: 0,
      endMinute: MINUTES_PER_DAY,
      allDay: true,
    };
  }

  const clippedStart =
    eventStart < dayStart.getTime() ? dayStart : event.start;
  const clippedEnd = eventEnd > dayEnd.getTime() ? dayEnd : event.end;

  let startMinute = minutesFromMidnight(clippedStart);
  let endMinute =
    clippedEnd.getTime() >= dayEnd.getTime()
      ? MINUTES_PER_DAY
      : minutesFromMidnight(clippedEnd);

  if (endMinute <= startMinute && clippedEnd.getTime() >= dayEnd.getTime()) {
    endMinute = MINUTES_PER_DAY;
  }

  return {
    eventId: event.id,
    laneKey: resolveLaneKey(event, activeDay, axes),
    startMinute,
    endMinute,
    allDay: false,
  };
}
