/*
 * Filename: core-rail.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/core-rail.ts
 * Change date and time: 21.25.00_22.08.2026
 * Reason for changes: Tap outside the open core rail dismisses it.
 */

import { getSpeedDialActionRegistry } from "./action-registry";
import {
    NAVIGATION_SHORTCUTS,
    speedDialItems,
    speedDialMeta,
    stripCoreRailTilesFromGrid
} from "./launcher-state";
import { getSpeedDialViewOpener } from "./view-opener";

const RAIL_OPEN_KEY = "cw::workspace::speed-dial::core-rail-open";
/** Views that belong on the rail — not the freeform Speed Dial grid. */
export const CORE_RAIL_VIEWS = ["apps", "explorer", "settings", "viewer"] as const;

export type CoreRailView = (typeof CORE_RAIL_VIEWS)[number];

const isCoreRailView = (view: string): view is CoreRailView =>
    (CORE_RAIL_VIEWS as readonly string[]).includes(view);

export const getCoreRailEntries = (): Array<{ view: string; label: string; icon: string }> =>
    NAVIGATION_SHORTCUTS.filter((s) => isCoreRailView(String(s.view || ""))).map((s) => ({
        view: String(s.view),
        label: String(s.label || s.view),
        icon: String(s.icon || "sparkle")
    }));

export const isCoreRailOpen = (): boolean => {
    try {
        const v = localStorage.getItem(RAIL_OPEN_KEY);
        // WHY: first visit has no key — keep the rail collapsed so the grid is the default surface.
        if (v == null || !String(v).trim()) return false;
        return v === "1" || v === "true" || v === "open";
    } catch {
        return false;
    }
};

export const setCoreRailOpen = (open: boolean): void => {
    try {
        localStorage.setItem(RAIL_OPEN_KEY, open ? "1" : "0");
    } catch {
        /* private mode */
    }
};

/**
 * WHY: Legacy boot used to inject Explorer/Settings/Markdown onto the grid.
 * Move those tiles off the desktop into the rail so the grid stays user shortcuts.
 */
export const migrateCoreViewShortcutsOffGrid = (): void => {
    stripCoreRailTilesFromGrid({ markDirty: true });
};

const runCoreView = (view: string): void => {
    if (view === "apps") {
        const home = (globalThis as { __CWSP_LAUNCHER_HOME__?: { openAppMenu?: () => void; openAppMenuPage?: () => void } })
            .__CWSP_LAUNCHER_HOME__;
        if (typeof home?.openAppMenuPage === "function") {
            home.openAppMenuPage();
            return;
        }
        if (typeof home?.openAppMenu === "function") {
            home.openAppMenu();
            return;
        }
    }
    const opener = getSpeedDialViewOpener();
    const registry = getSpeedDialActionRegistry();
    const action = registry.get(`open-view-${view}`) || registry.get("open-view");
    try {
        action?.(
            {
                id: `rail-${view}`,
                items: speedDialItems,
                meta: speedDialMeta,
                viewMaker: opener
            },
            { view, type: view, label: view }
        );
    } catch (e) {
        console.warn("[core-rail] open failed", view, e);
    }
};

/** Mount collapsible right rail into the Speed Dial root. */
export function mountCoreRail(host: HTMLElement): () => void {
    if (!host || host.querySelector(".speed-dial-core-rail")) {
        return () => undefined;
    }
    migrateCoreViewShortcutsOffGrid();

    let open = isCoreRailOpen();
    const rail = document.createElement("aside");
    rail.className = "speed-dial-core-rail";
    rail.setAttribute("aria-label", "Native apps");
    rail.toggleAttribute("data-open", open);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "speed-dial-core-rail__toggle";
    toggle.title = open ? "Hide apps" : "Show apps";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-controls", "speed-dial-core-rail-panel");
    toggle.innerHTML =
        '<ui-icon icon="caret-left" icon-style="duotone" aria-hidden="true"></ui-icon>';

    const panel = document.createElement("div");
    panel.id = "speed-dial-core-rail-panel";
    panel.className = "speed-dial-core-rail__panel";
    panel.setAttribute("role", "toolbar");

    const paintEntries = (): void => {
        panel.replaceChildren();
        for (const entry of getCoreRailEntries()) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "speed-dial-core-rail__item";
            btn.title = entry.label;
            btn.setAttribute("aria-label", entry.label);
            btn.dataset.view = entry.view;
            btn.innerHTML = `<ui-icon icon="${entry.icon}" icon-style="duotone" aria-hidden="true"></ui-icon><span class="speed-dial-core-rail__label">${entry.label}</span>`;
            btn.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                runCoreView(entry.view);
            });
            panel.append(btn);
        }
    };
    paintEntries();

    const syncOpen = (): void => {
        rail.toggleAttribute("data-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.title = open ? "Hide apps" : "Show apps";
        const icon = toggle.querySelector("ui-icon");
        if (icon) icon.setAttribute("icon", open ? "caret-right" : "caret-left");
        setCoreRailOpen(open);
    };

    toggle.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        open = !open;
        syncOpen();
    });

    syncOpen();
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
                    "dialog, .cw-context-menu-layer, .env-shell-app-menu, .speed-dial-editor, .sd-icon-picker"
                )
            ) {
                return true;
            }
        }
        return false;
    };
    /* WHY: rail is pointer-events:none except toggle/panel — empty grid/wallpaper must close it. */
    const onDocPointer = (ev: Event): void => {
        if (!open) return;
        if ((ev as PointerEvent).button != null && (ev as PointerEvent).button !== 0) return;
        if (isRailKeepOpenTarget(ev)) return;
        open = false;
        syncOpen();
    };
    document.addEventListener("pointerdown", onDocPointer, { capture: true });

    return () => {
        document.removeEventListener("pointerdown", onDocPointer, { capture: true } as EventListenerOptions);
        rail.remove();
    };
}
