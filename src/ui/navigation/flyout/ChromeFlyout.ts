/*
 * Filename: ChromeFlyout.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/flyout/ChromeFlyout.ts
 * Change date and time: 08.30.00_02.08.2026
 * Reason for changes: Shared overlay host for Calendar + Quick Settings (Win11-like).
 */

/** Matches env-shell `$bp-desktop-min` / chrome `data-desktop`. */
export const CHROME_DESKTOP_MQ = "(min-width: 641px)";

/** Same as environment-overlay ENV_OVERLAY_Z — above `$z-shell-chrome`. */
export const CHROME_FLYOUT_Z = "2147483600";

export type ChromeFlyoutKind = "calendar" | "quick-settings";

export type ChromeFlyoutController = {
    kind: ChromeFlyoutKind;
    el: HTMLElement;
    close: () => void;
    contains: (node: EventTarget | null) => boolean;
};

const openControllers = new Map<ChromeFlyoutKind, ChromeFlyoutController>();
let dismissBound = false;
let overlayShellHost: HTMLElement | null = null;

export const isDesktopChrome = (): boolean => {
    if (typeof document !== "undefined") {
        const chrome = document.querySelector<HTMLElement>(".env-shell-chrome[data-desktop]");
        if (chrome) return true;
        const layout = document.querySelector<HTMLElement>("[data-chrome-layout]");
        if (layout?.dataset.chromeLayout === "desktop") return true;
        if (layout?.dataset.chromeLayout === "mobile") return false;
    }
    return typeof matchMedia !== "undefined" && matchMedia(CHROME_DESKTOP_MQ).matches;
};

/** Optional: shell can register the env-shell host used for overlay mounting. */
export const setChromeFlyoutShellHost = (host: HTMLElement | null): void => {
    overlayShellHost = host;
};

export const ensureOverlayRoot = (host?: HTMLElement | null): HTMLElement => {
    const ATTR = "data-env-shell-overlays";
    const tryHost =
        host ||
        overlayShellHost ||
        document.querySelector<HTMLElement>(".env-shell-root") ||
        document.querySelector<HTMLElement>("#app") ||
        document.body;

    const existing = tryHost.querySelector<HTMLElement>(`[${ATTR}]`);
    if (existing) {
        if (!existing.style.zIndex) existing.style.zIndex = CHROME_FLYOUT_Z;
        return existing;
    }

    /* Prefer shell helper when available (CWSP / env-shell). */
    try {
        const mod = (globalThis as { __ENV_OVERLAY_MOUNT__?: (h: HTMLElement) => HTMLElement })
            .__ENV_OVERLAY_MOUNT__;
        if (typeof mod === "function") return mod(tryHost);
    } catch {
        /* fall through */
    }

    const el = document.createElement("div");
    el.setAttribute(ATTR, "");
    el.className = "env-shell-overlays";
    el.setAttribute("data-part", "env-overlays");
    el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${CHROME_FLYOUT_Z};box-sizing:border-box;`;
    tryHost.appendChild(el);
    return el;
};

/**
 * Place flyout for desktop (bottom-right) or mobile (calendar center / QS top-center).
 * INVARIANT: panel itself must set `pointer-events: auto`.
 */
export const positionFlyout = (el: HTMLElement, mode: ChromeFlyoutKind): void => {
    const desktop = isDesktopChrome();
    el.style.position = "fixed";
    el.style.zIndex = String(Number(CHROME_FLYOUT_Z) + 1);
    el.style.pointerEvents = "auto";
    el.style.margin = "0";

    if (desktop) {
        el.style.top = "auto";
        el.style.left = "auto";
        el.style.right = "0.75rem";
        el.style.bottom = "4.5rem";
        el.style.transform = "none";
        return;
    }

    if (mode === "calendar") {
        el.style.top = "50%";
        el.style.left = "50%";
        el.style.right = "auto";
        el.style.bottom = "auto";
        el.style.transform = "translate(-50%, -50%)";
        return;
    }

    /* quick-settings mobile */
    el.style.top = "calc(env(safe-area-inset-top, 0px) + 0.75rem)";
    el.style.left = "50%";
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.transform = "translateX(-50%)";
};

const onDocPointerDown = (ev: Event): void => {
    const t = ev.target as Node | null;
    for (const [kind, ctrl] of [...openControllers.entries()]) {
        if (ctrl.contains(t)) continue;
        /* Keep open when clicking the chrome anchors that toggle (handlers stopPropagation). */
        const anchor = (t as HTMLElement | null)?.closest?.(
            "[data-chrome-flyout-anchor], .env-shell-taskbar__clock, .env-ui-statusbar__clock, .env-device-tray"
        );
        if (anchor) continue;
        closeChromeFlyout(kind);
    }
};

const onDocKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key !== "Escape") return;
    closeAllChromeFlyouts();
};

const ensureDismissListeners = (): void => {
    if (dismissBound) return;
    dismissBound = true;
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onDocKeyDown, true);
};

const releaseDismissListenersIfIdle = (): void => {
    if (openControllers.size > 0) return;
    if (!dismissBound) return;
    dismissBound = false;
    document.removeEventListener("pointerdown", onDocPointerDown, true);
    document.removeEventListener("keydown", onDocKeyDown, true);
};

export const closeChromeFlyout = (kind: ChromeFlyoutKind): void => {
    const ctrl = openControllers.get(kind);
    if (!ctrl) return;
    openControllers.delete(kind);
    try {
        const el = ctrl.el as HTMLElement & { close?: () => void };
        /* Prefer CE close() so local open/hidden attrs stay consistent. */
        if (typeof el.close === "function") el.close();
        else {
            el.removeAttribute("open");
            el.hidden = true;
        }
        el.dispatchEvent(new CustomEvent("chrome-flyout-close", { bubbles: true }));
    } catch {
        /* ignore */
    }
    releaseDismissListenersIfIdle();
};

export const closeAllChromeFlyouts = (): void => {
    for (const kind of [...openControllers.keys()]) closeChromeFlyout(kind);
};

/**
 * Register an open flyout; closes the other kind (exclusive).
 * Caller must already append `el` into the overlay root and call `positionFlyout`.
 */
export const registerOpenFlyout = (ctrl: ChromeFlyoutController): void => {
    for (const kind of [...openControllers.keys()]) {
        if (kind === ctrl.kind) continue;
        closeChromeFlyout(kind);
    }
    openControllers.set(ctrl.kind, {
        ...ctrl,
        /* WHY: Always unregister from the map when panel closes. */
        close: () => closeChromeFlyout(ctrl.kind)
    });
    ctrl.el.hidden = false;
    ctrl.el.removeAttribute("hidden");
    ctrl.el.setAttribute("open", "");
    ensureDismissListeners();
};

export const isChromeFlyoutOpen = (kind: ChromeFlyoutKind): boolean => openControllers.has(kind);

/**
 * Toggle helper: if open → close; else open via `mountAndOpen`.
 */
export const toggleChromeFlyout = (
    kind: ChromeFlyoutKind,
    mountAndOpen: () => ChromeFlyoutController
): void => {
    if (isChromeFlyoutOpen(kind)) {
        closeChromeFlyout(kind);
        return;
    }
    const ctrl = mountAndOpen();
    registerOpenFlyout(ctrl);
};
