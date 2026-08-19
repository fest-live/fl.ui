export type CalendarView = "month" | "week" | "day";
export type AxisKind = "time" | "day" | "branch";

export interface TimelineAxes {
  row: AxisKind;
  col: AxisKind;
}

export function resolveAxes(view: CalendarView): TimelineAxes | null {
  if (view === "week") return { row: "time", col: "day" };
  if (view === "day") return { row: "branch", col: "time" };
  return null;
}
