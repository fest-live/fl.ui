/**
 * View navigation callback for speed-dial / home launcher.
 * Host apps register `setSpeedDialViewOpener`; otherwise actions fall back to hash routing via `fest/lure`.
 *
 * WHY: Vite symlink/hardlink graphs can load this file twice (home-view `./view-opener` vs
 * `fl-ui/speed-dial/view-opener`). A module-local `let` would leave Quick Settings looking at
 * an empty opener while Home registered on the other copy. Share via `globalThis`.
 */

export type SpeedDialViewOpener = (view: string, params?: Record<string, string>) => void;

/** Resolved from `shellContext.resolveOverlayMountPoint` while home is mounted (context menus above `.wf-frame`). */
export type OverlayMountResolver = (anchor?: Element | null) => HTMLElement;

const VIEW_OPENER_BOOT = "__CWSP_SPEED_DIAL_VIEW_OPENER_V1__";
const OVERLAY_MOUNT_BOOT = "__CWSP_HOME_OVERLAY_MOUNT_V1__";

const bootSlot = <T>(key: string): { get(): T | null; set(v: T | null): void } => {
    const g = globalThis as Record<string, T | null>;
    return {
        get: () => (key in g ? g[key] : null),
        set: (v) => {
            g[key] = v;
        }
    };
};

const openerSlot = bootSlot<SpeedDialViewOpener>(VIEW_OPENER_BOOT);
const overlaySlot = bootSlot<OverlayMountResolver>(OVERLAY_MOUNT_BOOT);

/** Register how "open-view" shortcuts reach your shell (tabs, router, etc.). */
export function setSpeedDialViewOpener(opener: SpeedDialViewOpener | null): void {
    openerSlot.set(typeof opener === "function" ? opener : null);
}

export function getSpeedDialViewOpener(): SpeedDialViewOpener | null {
    const fn = openerSlot.get();
    return typeof fn === "function" ? fn : null;
}

export function setHomeOverlayMountResolver(fn: OverlayMountResolver | null): void {
    overlaySlot.set(typeof fn === "function" ? fn : null);
}

export function getHomeOverlayMountResolver(): OverlayMountResolver | null {
    const fn = overlaySlot.get();
    return typeof fn === "function" ? fn : null;
}
