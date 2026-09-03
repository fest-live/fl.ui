/*
 * Filename: chrome-rail.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/chrome-rail.ts
 * Change date and time: 19.50.00_03.09.2026
 * Reason for changes: Left Speed Dial rail — calendar, quick settings, tile pin/unlock.
 * FIND:chrome-rail
 */

/* WHY: home-view/ts is a speed-dial symlink — `../navigation` is not calendar/QS. */
import { toggleCalendarFlyout } from "fl-ui/navigation/calendar/CalendarFlyout";
import { toggleQuickSettingsFlyout } from "fl-ui/navigation/settings/QuickSettings";
import { applyTilesLockedAttr, isTilesLocked, setTilesLocked, TILES_LOCKED_EVENT } from "./tiles-lock";

const RAIL_OPEN_KEY = "cw::workspace::speed-dial::chrome-rail-open";

export const isChromeRailOpen = (): boolean => {
    try {
        const v = localStorage.getItem(RAIL_OPEN_KEY);
        if (v == null || !String(v).trim()) return false;
        return v === "1" || v === "true" || v === "open";
    } catch {
        return false;
    }
};

export const setChromeRailOpen = (open: boolean): void => {
    try {
        localStorage.setItem(RAIL_OPEN_KEY, open ? "1" : "0");
    } catch {
        /* private mode */
    }
};

type RailAction = {
    id: "calendar" | "quick-settings" | "tiles-lock";
    label: string;
    icon: string;
    flyout?: "calendar" | "quick-settings";
};

const lockEntry = (locked: boolean): RailAction =>
    locked
        ? { id: "tiles-lock", label: "Unlock", icon: "push-pin" }
        : { id: "tiles-lock", label: "Pin", icon: "push-pin-slash" };

const railActions = (locked: boolean): RailAction[] => [
    { id: "calendar", label: "Calendar", icon: "calendar-blank", flyout: "calendar" },
    { id: "quick-settings", label: "Quick", icon: "sliders-horizontal", flyout: "quick-settings" },
    lockEntry(locked)
];

/** Mount collapsible left chrome rail into the Speed Dial root. */
export function mountChromeRail(host: HTMLElement): () => void {
    if (!host || host.querySelector(".speed-dial-chrome-rail")) {
        return () => undefined;
    }

    let open = isChromeRailOpen();
    let locked = isTilesLocked();
    const rail = document.createElement("aside");
    rail.className = "speed-dial-chrome-rail";
    rail.setAttribute("aria-label", "Launcher controls");
    rail.setAttribute("data-chrome-flyout-side", "start");
    rail.toggleAttribute("data-open", open);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "speed-dial-chrome-rail__toggle";
    toggle.title = open ? "Hide controls" : "Show controls";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-controls", "speed-dial-chrome-rail-panel");
    toggle.innerHTML =
        '<ui-icon icon="caret-right" icon-style="duotone" aria-hidden="true"></ui-icon>';

    const panel = document.createElement("div");
    panel.id = "speed-dial-chrome-rail-panel";
    panel.className = "speed-dial-chrome-rail__panel";
    panel.setAttribute("role", "toolbar");

    const paintEntries = (): void => {
        panel.replaceChildren();
        for (const entry of railActions(locked)) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "speed-dial-chrome-rail__item";
            btn.title =
                entry.id === "tiles-lock"
                    ? locked
                        ? "Unlock layout — drag tiles"
                        : "Pin layout — tiles stay put"
                    : entry.id === "quick-settings"
                      ? "Quick settings"
                      : entry.label;
            btn.setAttribute("aria-label", btn.title);
            btn.dataset.action = entry.id;
            if (entry.flyout) {
                btn.setAttribute("data-chrome-flyout-anchor", entry.flyout);
                btn.setAttribute("data-chrome-flyout-side", "start");
                btn.setAttribute("aria-haspopup", "dialog");
            }
            if (entry.id === "tiles-lock") {
                btn.setAttribute("aria-pressed", locked ? "true" : "false");
                btn.toggleAttribute("data-pressed", locked);
            }
            btn.innerHTML = `<ui-icon icon="${entry.icon}" icon-style="duotone" aria-hidden="true"></ui-icon><span class="speed-dial-chrome-rail__label">${entry.label}</span>`;
            btn.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (entry.id === "tiles-lock") {
                    setTilesLocked(!isTilesLocked());
                    return;
                }
                if (entry.flyout === "calendar") toggleCalendarFlyout(btn);
                else if (entry.flyout === "quick-settings") toggleQuickSettingsFlyout(btn);
            });
            panel.append(btn);
        }
    };

    const syncOpen = (): void => {
        rail.toggleAttribute("data-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.title = open ? "Hide controls" : "Show controls";
        const icon = toggle.querySelector("ui-icon");
        if (icon) icon.setAttribute("icon", open ? "caret-left" : "caret-right");
        setChromeRailOpen(open);
    };

    const syncLock = (): void => {
        locked = isTilesLocked();
        applyTilesLockedAttr(host);
        paintEntries();
    };

    toggle.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        open = !open;
        syncOpen();
    });

    syncOpen();
    syncLock();
    rail.append(toggle, panel);
    host.append(rail);

    const isRailKeepOpenTarget = (ev: Event): boolean => {
        const path =
            typeof (ev as PointerEvent).composedPath === "function"
                ? (ev as PointerEvent).composedPath()
                : [];
        for (const n of path) {
            if (n === rail || (n instanceof Node && rail.contains(n))) return true;
            if (
                n instanceof Element &&
                n.closest?.(
                    "dialog, .cw-context-menu-layer, .env-shell-app-menu, .speed-dial-editor, .sd-icon-picker, .speed-dial-core-rail, ui-calendar-flyout, ui-quick-settings"
                )
            ) {
                return true;
            }
        }
        return false;
    };

    const onDocPointer = (ev: Event): void => {
        if (!open) return;
        if ((ev as PointerEvent).button != null && (ev as PointerEvent).button !== 0) return;
        if (isRailKeepOpenTarget(ev)) return;
        open = false;
        syncOpen();
    };
    document.addEventListener("pointerdown", onDocPointer, { capture: true });
    window.addEventListener(TILES_LOCKED_EVENT, syncLock);

    return () => {
        document.removeEventListener("pointerdown", onDocPointer, { capture: true } as EventListenerOptions);
        window.removeEventListener(TILES_LOCKED_EVENT, syncLock);
        rail.remove();
    };
}
