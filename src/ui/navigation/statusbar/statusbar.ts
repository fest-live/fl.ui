/*
 * Filename: statusbar.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/statusbar/statusbar.ts
 * Change date and time: 15.35.00_23.08.2026
 * Reason for changes: Early wallpaper paper/ink from canvas luma (WallpaperTheme overwrites).
 * FIND:wallpaper-ink
 */
/**
 * WHY: Uses FL-UI `ui-statusbar` (left/center/right slots) — not a parallel component.
 * Reactive network/battery chips are shared via {@link attachShellDeviceStatus} for the desktop taskbar.
 * Overlay mode (mobile browser / fullscreen, not standalone): transparent top band, time L / icons R.
 */
import { E, H, defineElement } from "@fest-lib/lure";
import { effect, ref, type refType } from "@fest-lib/object";
import { applyWallpaperPaperFromLuma } from "@fest-lib/image";
import { toggleCalendarFlyout } from "../calendar/CalendarFlyout";
import { toggleQuickSettingsFlyout } from "../settings/QuickSettings";

/* Statusbar wrapper */
import UIElement from "fl-ui/base/UIElement";

//
// @ts-ignore
import styles from "veela-lib/ui/components/statusbar.scss?inline";
import { preloadStyle } from "@fest-lib/style-lib";
const styled = preloadStyle(styles);

/** Shell display surface for chrome / status overlay decisions. */
export type ShellDisplayMode =
    | "browser"
    | "standalone"
    | "fullscreen"
    | "minimal-ui"
    | "window-controls-overlay"
    | "unknown";

export function matchShellDisplayMode(): ShellDisplayMode {
    if (typeof matchMedia !== "function") return "unknown";
    try {
        if (matchMedia("(display-mode: window-controls-overlay)").matches) {
            return "window-controls-overlay";
        }
        if (matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
        if (matchMedia("(display-mode: standalone)").matches) return "standalone";
        if (matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
        if (matchMedia("(display-mode: browser)").matches) return "browser";
    } catch {
        /* ignore */
    }
    return "unknown";
}

export function isShellStandaloneDisplay(): boolean {
    const mode = matchShellDisplayMode();
    if (mode === "standalone" || mode === "minimal-ui") return true;
    // iOS Safari installed PWA
    try {
        if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    } catch {
        /* ignore */
    }
    return false;
}

/** Capacitor Android/iOS shell — OS owns the status bar; suppress in-app overlay chrome. */
export function isNativeCapacitorHost(): boolean {
    if (typeof document !== "undefined" && document.documentElement.dataset.cwspNativeShell === "capacitor") {
        return true;
    }
    try {
        const c = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        return typeof c?.isNativePlatform === "function" && Boolean(c.isNativePlatform());
    } catch {
        return false;
    }
}

/**
 * Transparent top status overlay when:
 * - mobile browser (not standalone), or
 * - PWA / CSS fullscreen, or
 * - document fullscreen API on a mobile-sized viewport.
 * Standalone installed PWA: no overlay (OS chrome / edge-to-edge windows).
 */
export function shouldShowStatusOverlay(opts: {
    desktop: boolean;
    standalone?: boolean;
    displayMode?: ShellDisplayMode;
}): boolean {
    if (isNativeCapacitorHost()) return false;
    const standalone = opts.standalone ?? isShellStandaloneDisplay();
    if (standalone) return false;
    const mode = opts.displayMode ?? matchShellDisplayMode();
    const docFs =
        typeof document !== "undefined" &&
        Boolean(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement);
    const fullscreen = mode === "fullscreen" || docFs;
    if (fullscreen) return true;
    return !opts.desktop;
}

/** European 24h clock + DD.MM.YYYY for taskbar / status overlay. */
export function formatChromeClock(now = new Date()): { time: string; date: string } {
    const pad = (n: number): string => String(n).padStart(2, "0");
    return {
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        date: `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`
    };
}

function formatStatusClock(d = new Date()): string {
    return formatChromeClock(d).time;
}

/**
 * Sample wallpaper + open-window chrome → status/launcher fg.
 * WHY: Overlay status sits on wallpaper OR on light window title spacers (`data-status-gap`);
 * wallpaper-only probe kept white icons over light titlebars in app light theme.
 */
export function attachStatusBarContrast(target: HTMLElement): () => void {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const lumaOf = (data: Uint8ClampedArray, step = 48): number | null => {
        let sum = 0;
        let n = 0;
        let maxChan = 0;
        for (let i = 0; i < data.length; i += 4 * step) {
            const a = data[i + 3] ?? 255;
            if (a < 16) continue;
            const r = data[i]! / 255;
            const g = data[i + 1]! / 255;
            const b = data[i + 2]! / 255;
            maxChan = Math.max(maxChan, r, g, b);
            sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
            n++;
        }
        if (n < 8) return null;
        /* WHY: cleared / undrawn canvas is ~0 — must not stamp white ink after a good probe. */
        if (maxChan < 0.02) return null;
        return sum / n;
    };

    const applyStatusFg = (luma: number): void => {
        // WHY: window chrome under the overlay — not wallpaper paper.
        const darkFg = luma > 0.55;
        target.style.setProperty("--env-status-fg", darkFg ? "#1c1c1e" : "#f5f5f7");
        target.style.setProperty("--env-status-fg-muted", darkFg ? "rgba(28,28,30,0.72)" : "rgba(245,245,247,0.78)");
        target.dataset.statusContrast = darkFg ? "dark" : "light";
    };

    const applyStatusFgFromWallpaper = (): void => {
        /*
         * INVARIANT: PWA/overlay status sits on the photo — same ink as labels/rail.
         * Do not use prefers-color-scheme (dark UI + white wallpaper ⇒ white glyphs).
         */
        target.style.setProperty("--env-status-fg", "var(--wallpaper-contrast-color)");
        target.style.setProperty(
            "--env-status-fg-muted",
            "color-mix(in oklab, var(--wallpaper-contrast-color) 78%, transparent)"
        );
        target.dataset.statusContrast = "wallpaper";
    };

    const applyLauncherFg = (luma: number): void => {
        /*
         * WHY: Speed-dial captions sit on the wallpaper, not on UI chrome — must follow
         * wallpaper luminance, not `html[data-theme]` (light theme + dark wood = invisible labels).
         * Same token names as WallpaperTheme KMeans (photo paper + contrast).
         */
        applyWallpaperPaperFromLuma(luma, [target]);
        target.dataset.launcherContrast = luma > 0.52 ? "dark" : "light";
    };

    /** Open managed windows that reserve the top status inset (title under overlay). */
    const statusGapWindowsOpen = (): boolean => {
        try {
            for (const win of document.querySelectorAll<HTMLElement>("ui-window[managed]")) {
                if (win.hidden || win.hasAttribute("hidden")) continue;
                if (win.getAttribute("aria-hidden") === "true") continue;
                const st = getComputedStyle(win);
                if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) {
                    continue;
                }
                if (win.hasAttribute("data-status-gap") || win.hasAttribute("data-status-overlay-gap")) {
                    return true;
                }
                const top = win.getBoundingClientRect().top;
                const inset = Math.max(
                    8,
                    parseFloat(getComputedStyle(target).getPropertyValue("--env-status-inset-top")) || 32
                );
                if (top < inset + 8) return true;
            }
        } catch {
            /* ignore */
        }
        return false;
    };

    const sample = (): void => {
        if (disposed) return;
        const appTheme = (document.documentElement.getAttribute("data-theme") || "").toLowerCase();
        const windowsUnderStatus = statusGapWindowsOpen();

        /*
         * INVARIANT: When a light-themed window owns the top band, status ink must be dark
         * even if wallpaper behind is dark wood (probe would otherwise keep white icons).
         */
        if (windowsUnderStatus && appTheme === "light") {
            applyStatusFg(0.9);
        } else if (windowsUnderStatus && appTheme === "dark") {
            applyStatusFg(0.15);
        } else {
            applyStatusFgFromWallpaper();
        }

        /* Launcher labels always track wallpaper mid-frame (not window chrome). */
        try {
            const canvas =
                target.querySelector(".env-shell-wallpaper canvas") ||
                document.querySelector(".env-shell-wallpaper canvas");
            if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                    const sw = canvas.width;
                    const midY = Math.max(0, Math.round(canvas.height * 0.28));
                    const midH = Math.max(1, Math.round(canvas.height * 0.36));
                    const midLuma = lumaOf(
                        ctx.getImageData(0, midY, sw, Math.min(midH, canvas.height - midY)).data
                    );
                    if (midLuma != null) {
                        applyLauncherFg(midLuma);
                        if (!windowsUnderStatus) applyStatusFgFromWallpaper();
                        return;
                    }
                }
            }
        } catch {
            /* tainted canvas / missing pixels — keep WallpaperTheme tokens */
        }
    };

    const schedule = (): void => {
        if (timer != null) clearTimeout(timer);
        timer = setTimeout(sample, 120);
    };

    sample();
    const mo = typeof MutationObserver === "function" ? new MutationObserver(schedule) : null;
    const wallpaper = target.querySelector(".env-shell-wallpaper") || document.querySelector(".env-shell-wallpaper");
    if (wallpaper && mo) mo.observe(wallpaper, { childList: true, subtree: true, attributes: true });
    /* Re-probe when windows open/close or gain status-gap under the overlay. */
    const winMo =
        typeof MutationObserver === "function"
            ? new MutationObserver(schedule)
            : null;
    winMo?.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "data-status-gap", "data-theme", "aria-hidden", "style", "class"]
    });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("env-chrome-surface", schedule as EventListener);
    document.addEventListener("u2-theme-change", schedule as EventListener);
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
    mq?.addEventListener?.("change", schedule);
    const interval = setInterval(sample, 8000);

    return () => {
        disposed = true;
        if (timer != null) clearTimeout(timer);
        clearInterval(interval);
        mo?.disconnect();
        winMo?.disconnect();
        window.removeEventListener("resize", schedule);
        document.removeEventListener("visibilitychange", schedule);
        document.removeEventListener("env-chrome-surface", schedule as EventListener);
        document.removeEventListener("u2-theme-change", schedule as EventListener);
        mq?.removeEventListener?.("change", schedule);
    };
}

//
// @ts-ignore
@defineElement("ui-statusbar")
export class StatusBar extends UIElement {
    constructor() { super(); }

    //
    styles = () => styled;
    render = () => {
        return H`
<div style="background-color: transparent;" part="left"   class="left"  ><slot name="left"  ></slot></div>
        <div style="background-color: transparent;" part="center" class="center"><slot name="center"></slot></div>
        <div style="background-color: transparent;" part="right"  class="right" ><slot name="right" ></slot></div>`;
    };
}

export type EnvironmentShellStatusRefs = {
    selectedPath: refType<string>;
    viewerStatus: refType<string>;
    navEcho: refType<string>;
    mqLabel: refType<string>;
};

type NavConn = EventTarget & {
    effectiveType?: string;
    downlink?: number;
    saveData?: boolean;
    addEventListener(type: "change", listener: () => void): void;
    removeEventListener(type: "change", listener: () => void): void;
};

function connectionOf(nav: Navigator): NavConn | undefined {
    return (nav as Navigator & { connection?: NavConn }).connection;
}

function networkIconForEffectiveType(etRaw: string): string {
    const et = etRaw.toLowerCase();
    if (et === "slow-2g") return "wifi-low";
    if (et === "2g") return "wifi-medium";
    return "wifi-high";
}

/** Single subscription for battery + network; bind into multiple `H` trays with the same refs. */
export type ShellDeviceStatus = {
    networkIcon: refType<string>;
    networkTitle: refType<string>;
    batteryIcon: refType<string>;
    batteryTitle: refType<string>;
    batteryPct: refType<string>;
    dispose: () => void;
};

export function attachShellDeviceStatus(): ShellDeviceStatus {
    const networkIcon = ref("wifi-high");
    const networkTitle = ref("");
    const batteryIcon = ref("battery-full");
    const batteryTitle = ref("");
    const batteryPct = ref("");

    const syncNetwork = (): void => {
        if (!navigator.onLine) {
            networkIcon.value = "wifi-slash";
            networkTitle.value = "Offline";
            return;
        }
        const c = connectionOf(navigator);
        if (!c || typeof c.effectiveType !== "string") {
            networkIcon.value = "globe";
            networkTitle.value = "Online (connection details unavailable)";
            return;
        }
        const et = String(c.effectiveType || "").toLowerCase();
        const down = typeof c.downlink === "number" ? `${c.downlink} Mb/s` : "";
        const save = c.saveData ? " · Data saver" : "";
        networkTitle.value = [et.toUpperCase(), down].filter(Boolean).join(" · ") + save;
        networkIcon.value = networkIconForEffectiveType(et);
    };

    let batteryLevelHandler: (() => void) | null = null;
    let batteryChargingHandler: (() => void) | null = null;
    let batteryManager: EventTarget | null = null;

    const applyBattery = (level: number, charging: boolean): void => {
        const pct = Math.max(0, Math.min(100, Math.round(level * 100)));
        batteryPct.value = `${pct}%`;
        if (charging) {
            batteryIcon.value = "battery-charging-vertical";
            batteryTitle.value = `Charging · ${batteryPct.value}`;
            return;
        }
        batteryTitle.value = `Battery · ${batteryPct.value}`;
        if (level <= 0.08) batteryIcon.value = "battery-warning";
        else if (level <= 0.22) batteryIcon.value = "battery-low";
        else if (level <= 0.5) batteryIcon.value = "battery-medium";
        else if (level <= 0.8) batteryIcon.value = "battery-high";
        else batteryIcon.value = "battery-full";
    };

    syncNetwork();
    window.addEventListener("online", syncNetwork);
    window.addEventListener("offline", syncNetwork);
    const conn = connectionOf(navigator);
    conn?.addEventListener?.("change", syncNetwork);

    if (typeof navigator.getBattery === "function") {
        void navigator.getBattery().then((b) => {
            batteryManager = b;
            batteryLevelHandler = () => applyBattery(b.level, b.charging);
            batteryChargingHandler = batteryLevelHandler;
            b.addEventListener("levelchange", batteryLevelHandler);
            b.addEventListener("chargingchange", batteryChargingHandler);
            applyBattery(b.level, b.charging);
        });
    } else {
        batteryIcon.value = "question";
        batteryTitle.value = "Battery status not supported in this browser";
        batteryPct.value = "—";
    }

    const dispose = (): void => {
        window.removeEventListener("online", syncNetwork);
        window.removeEventListener("offline", syncNetwork);
        conn?.removeEventListener?.("change", syncNetwork);
        if (batteryManager && batteryLevelHandler && batteryChargingHandler) {
            batteryManager.removeEventListener("levelchange", batteryLevelHandler);
            batteryManager.removeEventListener("chargingchange", batteryChargingHandler);
        }
    };

    return { networkIcon, networkTitle, batteryIcon, batteryTitle, batteryPct, dispose };
}

/** Reactive tray; use two instances (taskbar + footer) with visibility toggled by CSS — same refs update both. */
export function buildShellDeviceTray(device: ShellDeviceStatus, trayClass: string): HTMLElement {
    const row = H`<div class="env-status-bar__tray ${trayClass}">
        <span class="env-status-bar__chip" title=${device.networkTitle} aria-label=${device.networkTitle}>
            <ui-icon icon=${device.networkIcon} aria-hidden="true"></ui-icon>
        </span>
        <span class="env-status-bar__chip" title=${device.batteryTitle} aria-label=${device.batteryTitle}>
            <ui-icon icon=${device.batteryIcon} aria-hidden="true"></ui-icon>
            <span class="env-status-bar__pct"></span>
        </span>
    </div>` as HTMLElement;

    const pctSpan = row.querySelector(".env-status-bar__pct");
    if (pctSpan instanceof HTMLElement) {
        E(pctSpan, { properties: { textContent: device.batteryPct } });
    }
    return row;
}

export type MountStatusBarResult = {
    element: HTMLElement;
    dispose: () => void;
};

/**
 * `ui-statusbar`:
 * - Desktop footer: intro (left), shell meta (center), device tray (right; often CSS-hidden).
 * - Overlay (mobile/fullscreen): clock (left), device tray (right); intro/meta hidden.
 */
export function mountEnvironmentStatusBar(
    shell: EnvironmentShellStatusRefs,
    introInnerHtml: string,
    device: ShellDeviceStatus
): MountStatusBarResult {
    const bar = document.createElement("ui-statusbar");
    bar.className = "env-ui-statusbar wf-chrome-no-select";
    bar.setAttribute("part", "status-bar");

    const left = document.createElement("div");
    left.slot = "left";
    left.className = "env-ui-statusbar__left";

    const clock = document.createElement("time");
    clock.className = "env-ui-statusbar__clock";
    clock.dateTime = "";
    clock.textContent = formatStatusClock();
    clock.setAttribute("role", "button");
    clock.setAttribute("tabindex", "0");
    clock.setAttribute("aria-label", "Calendar");
    clock.setAttribute("aria-haspopup", "dialog");
    clock.setAttribute("data-chrome-flyout-anchor", "calendar");

    const intro = document.createElement("div");
    intro.className = "env-ui-statusbar__intro";
    if (introInnerHtml) intro.innerHTML = introInnerHtml;

    left.append(clock, intro);

    const center = document.createElement("div");
    center.slot = "center";
    const meta = document.createElement("p");
    meta.className = "env-status-bar__meta";
    center.appendChild(meta);

    const right = document.createElement("div");
    right.slot = "right";
    right.className = "env-ui-statusbar__right";
    const deviceTray = buildShellDeviceTray(device, "env-device-tray env-device-tray--footer");
    deviceTray.setAttribute("role", "button");
    deviceTray.setAttribute("tabindex", "0");
    deviceTray.setAttribute("aria-label", "Quick settings");
    deviceTray.setAttribute("aria-haspopup", "dialog");
    deviceTray.setAttribute("data-chrome-flyout-anchor", "quick-settings");
    right.appendChild(deviceTray);

    const onClockActivate = (ev: Event): void => {
        ev.preventDefault();
        ev.stopPropagation();
        toggleCalendarFlyout(clock);
    };
    const onTrayActivate = (ev: Event): void => {
        ev.preventDefault();
        ev.stopPropagation();
        toggleQuickSettingsFlyout(deviceTray);
    };
    clock.addEventListener("click", onClockActivate);
    clock.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") onClockActivate(ev);
    });
    deviceTray.addEventListener("click", onTrayActivate);
    deviceTray.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") onTrayActivate(ev);
    });

    bar.append(left, center, right);

    effect(
        () => {
            const nav = shell.navEcho.value ? ` │ ${shell.navEcho.value}` : "";
            meta.textContent = `doc=${shell.selectedPath.value} │ viewer=${shell.viewerStatus.value} │ layout=${shell.mqLabel.value}${nav}`;
        },
        [shell.selectedPath, shell.viewerStatus, shell.mqLabel, shell.navEcho],
        { triggerImmediately: true }
    );

    const tickClock = (): void => {
        const now = new Date();
        clock.textContent = formatStatusClock(now);
        clock.dateTime = now.toISOString();
    };
    tickClock();
    const clockTimer = setInterval(tickClock, 15_000);

    const dispose = (): void => {
        clearInterval(clockTimer);
        /* Host disposes {@link ShellDeviceStatus} once (shared with taskbar). */
    };

    return { element: bar, dispose };
}
