/*
 * Filename: capacitor-native-safe-area.ts
 * FullPath: modules/projects/subsystem/shells/environment/components/statusbar/capacitor-native-safe-area.ts
 * Change date and time: 23.09.25_23.08.2026
 * Reason for changes: Do not inject 3-button nav height — OS already reserves that slab.
 * FIND:navbar
 */

import type { CwsShellInfo } from "com/routing/native/cws-bridge";
import { CwsBridge } from "com/routing/native/cws-bridge";

import { isNativeCapacitorHost } from "./statusbar";

const CSS_TOP = "--env-native-safe-top";
const CSS_BOTTOM = "--env-native-safe-bottom";

let lastTopPx = 0;
let lastBottomPx = 0;
let installed = false;

function readEnvSafeAreaProbe(): { top: number; bottom: number } {
    if (typeof document === "undefined" || !document.body) return { top: 0, bottom: 0 };
    const probe = document.createElement("div");
    probe.style.cssText =
        "position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const top = Number.parseFloat(cs.paddingTop) || 0;
    const bottom = Number.parseFloat(cs.paddingBottom) || 0;
    probe.remove();
    return { top, bottom };
}

function androidFallbackTopPx(): number {
    try {
        if (!/android/i.test(navigator.userAgent)) return 0;
    } catch {
        return 0;
    }
    return 28;
}

function applyInsets(topPx: number, bottomPx: number): void {
    lastTopPx = Math.max(0, Math.round(topPx));
    lastBottomPx = Math.max(0, Math.round(bottomPx));
    const top = `${lastTopPx}px`;
    const bottom = `${lastBottomPx}px`;

    document.documentElement.style.setProperty(CSS_TOP, top);
    document.documentElement.style.setProperty(CSS_BOTTOM, bottom);
    document.documentElement.toggleAttribute("data-capacitor-native", true);

    for (const node of document.querySelectorAll(".env-shell-root, env-shell-container")) {
        if (!(node instanceof HTMLElement)) continue;
        node.style.setProperty(CSS_TOP, top);
        node.style.setProperty(CSS_BOTTOM, bottom);
        node.toggleAttribute("data-capacitor-native", true);
    }
}

function stampLateShellRoots(): void {
    if (lastTopPx <= 0 && lastBottomPx <= 0) return;
    const top = `${lastTopPx}px`;
    const bottom = `${lastBottomPx}px`;
    for (const node of document.querySelectorAll(".env-shell-root, env-shell-container")) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.style.getPropertyValue(CSS_TOP) === top) continue;
        node.style.setProperty(CSS_TOP, top);
        node.style.setProperty(CSS_BOTTOM, bottom);
        node.toggleAttribute("data-capacitor-native", true);
    }
}

async function resolveNativeInsets(): Promise<{ top: number; bottom: number }> {
    let top = 0;
    try {
        const info = (await CwsBridge.getShellInfo()) as CwsShellInfo & {
            statusBarHeightCss?: number;
            navigationBarHeightCss?: number;
        };
        top = Number(info.statusBarHeightCss) || 0;
    } catch {
        /* bridge optional during early boot */
    }

    const env = readEnvSafeAreaProbe();
    top = Math.max(top, env.top);
    // WHY: 3-button nav is OS-owned (Capacitor SystemBars black pad, or hidden).
    // `navigation_bar_height` + env(safe-area-inset-bottom) painted a second slab above it.
    const bottom = 0;

    if (top <= 0) top = androidFallbackTopPx();
    return { top, bottom };
}

/** Idempotent — sets `--env-native-safe-*` used by `capacitor-native.scss`. */
export async function installCapacitorNativeSafeAreaInsets(): Promise<void> {
    if (!isNativeCapacitorHost()) return;
    if (installed) {
        stampLateShellRoots();
        return;
    }
    installed = true;

    const sync = async (): Promise<void> => {
        const { top, bottom } = await resolveNativeInsets();
        applyInsets(top, bottom);
    };

    await sync();

    window.addEventListener("resize", () => void sync());
    window.visualViewport?.addEventListener("resize", () => void sync());
    document.addEventListener("orientationchange", () => void sync());

    // WHY: a document-wide subtree observer recorded every Settings/Explorer node insert
    // and kept the main thread busy while `Loading …` was on screen.
    stampLateShellRoots();
    globalThis.setTimeout?.(stampLateShellRoots, 400);
}
