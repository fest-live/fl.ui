/*
 * Filename: CalendarFlyout.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/calendar/CalendarFlyout.ts
 * Change date and time: 08.30.00_02.08.2026
 * Reason for changes: Win11-like calendar flyout custom element (today header + month grid).
 */
import { defineElement, H } from "@fest-lib/lure";
import { preloadStyle, addEvent } from "@fest-lib/dom";
import { UIElement } from "fl-ui/base/UIElement";
import "@fest-lib/icon";
import {
    ensureOverlayRoot,
    positionFlyout,
    toggleChromeFlyout,
    closeChromeFlyout,
    isChromeFlyoutOpen,
    type ChromeFlyoutController
} from "../flyout/ChromeFlyout";

// @ts-ignore — Vite inline SCSS → adopted stylesheet
import styles from "./CalendarFlyout.scss?inline";
const styled = preloadStyle(styles);

/** Shared exclusivity/positioning kind — see `ChromeFlyout.ts`. */
const FLYOUT_KIND = "calendar" as const;

/** 1 Jan 2023 (UTC) is a Sunday — stable anchor for deriving weekday short-labels per locale. */
const REFERENCE_SUNDAY_UTC = Date.UTC(2023, 0, 1);
const DAY_MS = 86_400_000;

/**
 * Locale week start, 0 (Sunday) .. 6 (Saturday) — matches `Date#getDay()`.
 * `Intl.Locale` week info is still a staged API; both accessor shapes are probed,
 * with a Sunday-start fallback when unsupported.
 */
function resolveFirstDayOfWeek(locale: string): number {
    try {
        const loc = new Intl.Locale(locale) as Intl.Locale & {
            weekInfo?: { firstDay: number };
            getWeekInfo?: () => { firstDay: number };
        };
        const info = loc.weekInfo ?? loc.getWeekInfo?.();
        const first = info?.firstDay;
        // weekInfo.firstDay: 1 (Monday) .. 7 (Sunday) → JS Date#getDay (0 Sunday .. 6 Saturday)
        if (typeof first === "number" && first >= 1 && first <= 7) return first % 7;
    } catch {
        /* Intl.Locale / weekInfo unsupported — Sunday-start fallback */
    }
    return 0;
}

function weekdayShortLabels(locale: string, startDay: number): string[] {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
        const dow = (startDay + i) % 7;
        labels.push(fmt.format(new Date(REFERENCE_SUNDAY_UTC + dow * DAY_MS)));
    }
    return labels;
}

function isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type MonthCell = {
    date: Date;
    day: number;
    otherMonth: boolean;
    isToday: boolean;
};

/** Full 6×7 (or shorter, week-complete) grid for `year`/`month`, leading/trailing days included. */
function buildMonthCells(year: number, month: number, startDay: number): MonthCell[] {
    const today = new Date();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (firstOfMonth.getDay() - startDay + 7) % 7;
    const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

    const cells: MonthCell[] = [];
    for (let i = 0; i < totalCells; i++) {
        const dayNum = i - leading + 1;
        const date = new Date(year, month, dayNum);
        cells.push({
            date,
            day: date.getDate(),
            otherMonth: date.getMonth() !== month,
            isToday: isSameDate(date, today)
        });
    }
    return cells;
}

/**
 * Win11-like calendar flyout: today header + navigable month grid.
 *
 * INVARIANT: instance `open()`/`close()`/`toggle()` only flip local visibility state
 * (`hidden` + `open` attribute) — the shared exclusivity/singleton/positioning contract
 * lives in the module-level {@link toggleCalendarFlyout} / {@link closeCalendarFlyout}
 * helpers, which wrap `ChromeFlyout` (mirrors Quick Settings wiring).
 */
// @ts-ignore
@defineElement("ui-calendar-flyout")
export class CalendarFlyout extends UIElement {
    #year: number;
    #month: number;
    #selected: Date | null = null;
    #unbind: (() => void) | null = null;

    // WHY: UIElement defines `render`/`styles` as instance fields; subclass methods would be shadowed.
    styles = function () { return styled; };
    render = function () {
        return H`<div class="ui-cal-flyout__panel" part="panel">
            <header class="ui-cal-flyout__header" part="header">
                <p class="ui-cal-flyout__today" part="today"></p>
            </header>
            <div class="ui-cal-flyout__nav" part="nav">
                <button type="button" class="ui-cal-flyout__nav-btn" data-nav="prev" aria-label="Previous month" title="Previous month">
                    <ui-icon icon="caret-left"></ui-icon>
                </button>
                <div class="ui-cal-flyout__month-label" part="month-label" aria-live="polite"></div>
                <button type="button" class="ui-cal-flyout__nav-btn" data-nav="next" aria-label="Next month" title="Next month">
                    <ui-icon icon="caret-right"></ui-icon>
                </button>
            </div>
            <div class="ui-cal-flyout__weekdays" part="weekdays" role="row"></div>
            <div class="ui-cal-flyout__grid" part="grid" role="grid"></div>
        </div>`;
    };

    constructor() {
        super();
        const now = new Date();
        this.#year = now.getFullYear();
        this.#month = now.getMonth();
    }

    onRender() {
        super.onRender();
        this.#wire();
        this.#renderFrame();
    }

    disconnectedCallback(): void {
        this.#unbind?.();
        this.#unbind = null;
        super.disconnectedCallback?.();
    }

    /** Bind nav / day-cell clicks once (element persists as a hidden singleton — see module helpers below). */
    #wire(): void {
        const root = this.shadowRoot;
        if (!root || this.#unbind) return;

        const onClick = (ev: Event): void => {
            const t = ev.target as HTMLElement | null;
            const nav = t?.closest?.("[data-nav]") as HTMLElement | null;
            if (nav) {
                if (nav.dataset.nav === "prev") this.#shiftMonth(-1);
                else if (nav.dataset.nav === "next") this.#shiftMonth(1);
                return;
            }
            const day = t?.closest?.(".ui-cal-flyout__day") as HTMLElement | null;
            if (day) this.#selectDay(day);
        };
        const off = addEvent(root, "click", onClick);
        this.#unbind = () => off?.();
    }

    #shiftMonth(delta: number): void {
        this.#month += delta;
        if (this.#month < 0) { this.#month = 11; this.#year -= 1; } else if (this.#month > 11) { this.#month = 0; this.#year += 1; }
        this.#renderFrame();
    }

    /** Jump the visible grid back to the month containing today (does not touch selection). */
    #goToday(): void {
        const now = new Date();
        this.#year = now.getFullYear();
        this.#month = now.getMonth();
        this.#renderFrame();
    }

    #selectDay(el: HTMLElement): void {
        const iso = el.dataset.date;
        if (!iso) return;
        this.#selected = new Date(iso);
        this.shadowRoot?.querySelectorAll(".ui-cal-flyout__day[data-selected]")?.forEach((n) => n.removeAttribute("data-selected"));
        el.setAttribute("data-selected", "");
        this.dispatchEvent(new CustomEvent("calendar-select", { bubbles: true, composed: true, detail: { date: this.#selected } }));
    }

    /** Re-paint today-header / month-label / weekday-row / day-grid from `#year`/`#month`/`#selected`. */
    #renderFrame(): void {
        const root = this.shadowRoot;
        if (!root) return;
        const locale = typeof navigator !== "undefined" ? navigator.language : undefined;
        const startDay = resolveFirstDayOfWeek(locale ?? "en-US");
        const today = new Date();

        const todayEl = root.querySelector(".ui-cal-flyout__today");
        if (todayEl) {
            todayEl.textContent = today.toLocaleDateString(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }

        const monthLabelEl = root.querySelector(".ui-cal-flyout__month-label");
        if (monthLabelEl) {
            monthLabelEl.textContent = new Date(this.#year, this.#month, 1).toLocaleDateString(locale, {
                month: "long",
                year: "numeric"
            });
        }

        const weekdaysEl = root.querySelector(".ui-cal-flyout__weekdays");
        if (weekdaysEl) {
            weekdaysEl.replaceChildren(
                ...weekdayShortLabels(locale ?? "en-US", startDay).map((label) => {
                    const span = document.createElement("span");
                    span.className = "ui-cal-flyout__weekday";
                    span.setAttribute("role", "columnheader");
                    span.textContent = label;
                    return span;
                })
            );
        }

        const gridEl = root.querySelector(".ui-cal-flyout__grid");
        if (gridEl) {
            const cells = buildMonthCells(this.#year, this.#month, startDay);
            gridEl.replaceChildren(
                ...cells.map((cell) => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "ui-cal-flyout__day";
                    btn.textContent = String(cell.day);
                    btn.dataset.date = cell.date.toISOString();
                    btn.setAttribute("role", "gridcell");
                    if (cell.otherMonth) btn.setAttribute("data-other-month", "");
                    if (cell.isToday) btn.setAttribute("data-today", "");
                    if (this.#selected && isSameDate(cell.date, this.#selected)) btn.setAttribute("data-selected", "");
                    btn.setAttribute(
                        "aria-label",
                        cell.date.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                    );
                    return btn;
                })
            );
        }
    }

    open(): void {
        this.#goToday();
        this.removeAttribute("hidden");
        this.hidden = false;
        this.setAttribute("open", "");
    }

    close(): void {
        this.hidden = true;
        this.setAttribute("hidden", "");
        this.removeAttribute("open");
    }

    toggle(anchor?: HTMLElement | null): void {
        void anchor; // reserved — positioning is owned by the module-level chrome helpers below.
        if (this.hasAttribute("open")) this.close();
        else this.open();
    }
}

export default CalendarFlyout;

let singleton: CalendarFlyout | null = null;

/** Mount (once) the singleton `<ui-calendar-flyout>` into the shared overlay root. */
function ensureCalendarFlyout(): CalendarFlyout {
    if (singleton?.isConnected) return singleton;
    const overlayRoot = ensureOverlayRoot();
    let el = overlayRoot.querySelector<CalendarFlyout>("ui-calendar-flyout");
    if (!el) {
        el = document.createElement("ui-calendar-flyout") as CalendarFlyout;
        el.hidden = true;
        overlayRoot.appendChild(el);
    }
    singleton = el;
    return el;
}

/** Toggle the shared calendar flyout, wired through `ChromeFlyout`'s exclusive-open contract. */
export function toggleCalendarFlyout(anchor?: HTMLElement | null): void {
    toggleChromeFlyout(FLYOUT_KIND, (): ChromeFlyoutController => {
        const el = ensureCalendarFlyout();
        const pinned = document.documentElement.getAttribute("data-theme");
        if (pinned === "light" || pinned === "dark") {
            el.dataset.theme = pinned;
            el.style.colorScheme = pinned;
        }
        positionFlyout(el, FLYOUT_KIND);
        el.open();
        void anchor; // reserved — no anchor-relative positioning yet, mirrors `positionFlyout` contract.
        return {
            kind: FLYOUT_KIND,
            el,
            close: () => {
                el.close();
                closeChromeFlyout(FLYOUT_KIND);
            },
            contains: (node) => node instanceof Node && el.contains(node)
        };
    });
}

export function closeCalendarFlyout(): void {
    closeChromeFlyout(FLYOUT_KIND);
}

export function isCalendarFlyoutOpen(): boolean {
    return isChromeFlyoutOpen(FLYOUT_KIND);
}
