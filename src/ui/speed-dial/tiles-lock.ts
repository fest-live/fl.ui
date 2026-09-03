/*
 * Filename: tiles-lock.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/tiles-lock.ts
 * Change date and time: 19.50.00_03.09.2026
 * Reason for changes: Persist Speed Dial pin/unlock so locked tiles skip drag and free swipes.
 * FIND:chrome-rail
 * TAG:tiles-lock
 */

const TILES_LOCKED_KEY = "cw::workspace::speed-dial::tiles-locked";

/** Dispatched on `window` after {@link setTilesLocked}. */
export const TILES_LOCKED_EVENT = "cwsp-sd-tiles-lock";

const isNativeCapacitorOrCoarse = (): boolean => {
    try {
        const c = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        if (typeof c?.isNativePlatform === "function" && c.isNativePlatform()) return true;
    } catch {
        /* ignore */
    }
    return typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
};

/** WHY: phones default pinned so workspace/app-menu swipes win; mouse desktops stay editable. */
const defaultTilesLocked = (): boolean => isNativeCapacitorOrCoarse();

export const isTilesLocked = (): boolean => {
    try {
        const v = localStorage.getItem(TILES_LOCKED_KEY);
        if (v == null || !String(v).trim()) return defaultTilesLocked();
        return v === "1" || v === "true" || v === "locked" || v === "pin";
    } catch {
        return defaultTilesLocked();
    }
};

export const applyTilesLockedAttr = (root?: HTMLElement | null): void => {
    const host =
        root ||
        (typeof document !== "undefined"
            ? document.querySelector<HTMLElement>(".speed-dial-root")
            : null);
    host?.toggleAttribute("data-tiles-locked", isTilesLocked());
};

export const setTilesLocked = (locked: boolean): void => {
    try {
        localStorage.setItem(TILES_LOCKED_KEY, locked ? "1" : "0");
    } catch {
        /* private mode */
    }
    applyTilesLockedAttr();
    try {
        window.dispatchEvent(new CustomEvent(TILES_LOCKED_EVENT, { detail: { locked } }));
    } catch {
        /* tests */
    }
};
