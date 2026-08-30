/*
 * Filename: OrientDesktop.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/OrientDesktop.ts
 * Change date and time: 12.22.00_03.08.2026
 * Reason for changes: Pass makeView through so SpeedDial does not clear the HomeView opener.
 */

import { loadAsAdopted } from "@fest-lib/style-lib";
import { SpeedDial, createCtxMenu } from "./SpeedDial";

// @ts-ignore Vite inline SCSS
import speedDialViewStyles from "./SpeedDial.scss?inline";
/*
 * WHY: fl-design alias (not ../../styles) — Vite preserveSymlinks resolves this
 * module via home-view/ts symlink; relative escapes to styles/ break.
 */
// @ts-ignore Vite inline SCSS
import homeHostStyles from "fl-design/ui/home-host-apply.scss?inline";
// Registers `data-mixin="ui-orientbox"` (container-type / --orient wiring).
import "./OrientBox";

/** Orient-layer desktop shares SpeedDial styles; HomeView only adopts this sheet while home is visible, so load once here. */
let orientDesktopStyleSheet: CSSStyleSheet | null = null;
let homeHostStyleSheet: CSSStyleSheet | null = null;
const ensureOrientDesktopStyles = (): void => {
    if (!orientDesktopStyleSheet) {
        orientDesktopStyleSheet = loadAsAdopted(speedDialViewStyles) as CSSStyleSheet;
    }
    /* WHY: transparent grid host + pointer-events contract; without this .view-home paints opaque gray over wallpaper. */
    if (!homeHostStyleSheet) {
        homeHostStyleSheet = loadAsAdopted(homeHostStyles) as CSSStyleSheet;
    }
};

/**
 * Compatibility entrypoint for shells that used the former manual desktop
 * renderer. All rendering delegates to the canonical SpeedDial renderer
 * (MutationObserver orient + `bindPointerInteraction`); no second desktop
 * implementation lives here.
 *
 * INVARIANT: OrientDesktop stays an adapter — do not re-add a parallel
 * desktop renderer here. Product behaviors (wallpaper IDB, paste/drop URL
 * hygiene) belong in SpeedDial so both mount paths share them.
 */
export const initializeOrientedDesktop = (host: HTMLElement, makeView?: any): void => {
    if (!host || host.dataset.desktopMounted === "true") return;
    host.dataset.desktopMounted = "true";
    ensureOrientDesktopStyles();
    const root = SpeedDial(makeView) as HTMLElement;
    root.classList.add("app-oriented-desktop");
    host.appendChild(root);
    /* WHY: createCtxMenu binds document contextmenu; must run on mount (was lost when OrientDesktop became an adapter). */
    createCtxMenu(makeView);
};
