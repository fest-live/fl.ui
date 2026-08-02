/*
 * Filename: native-theme-color.ts
 * FullPath: modules/projects/fl.ui/src/ui/containers/window/native-theme-color.ts
 * Change date and time: 10.50.00_02.08.2026
 * Reason for changes: Titlebar-only theme-color — never elementsFromPoint into wallpaper.
 */

/**
 * WHY: Installed PWA / Window Controls Overlay paints the OS title strip from
 * `<meta name="theme-color">`. While a managed `ui-window` is in native-mode
 * (or fills the viewport), that meta must match **this window's** `.title-handler`.
 *
 * INVARIANT: while owned, this module owns `meta[name=theme-color]`
 * (see `isNativeThemeColorOwned`). DynamicEngine must not overwrite with
 * wallpaper / ambient `elementsFromPoint` samples.
 *
 * AI-READ: Never sample via `elementsFromPoint` — when the titlebar is thin or
 * WCO-padded, hits fall through to the env wallpaper canvas.
 */

let themeColorBeforeNative: string | null = null;
let themeAttrWatch: MutationObserver | null = null;
let metaContentWatch: MutationObserver | null = null;
let paintProbe: HTMLCanvasElement | null = null;
let resyncTimers: Array<ReturnType<typeof setTimeout>> = [];
let ownedNativeHost: HTMLElement | null = null;
let applyGeneration = 0;
/** Last hex we intentionally wrote — used to fight ambient overwrites. */
let lastAppliedHex: string | null = null;

/** Warm light surface — matches `index.html` default (not VS Code blue). */
const FALLBACK_WARM = "#cbb8a4";
const OWNER_KEY = "__CWSP_NATIVE_THEME_COLOR_OWNED__";

/** VS Code / Chromium-default blues that must never stick under WCO. */
const isForbiddenThemeColor = (raw: string): boolean => {
    const t = String(raw || "").trim().toLowerCase();
    if (!t) return false;
    if (t === "#007acc" || t === "#007accff") return true;
    if (t === "#36c" || t === "#3366cc") return true;
    const m = t.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i);
    if (m && (t?.startsWith?.("#") || t?.startsWith?.("rgb"))) {
        const r = Math.round(Number(m[1]));
        const g = Math.round(Number(m[2]));
        const b = Math.round(Number(m[3]));
        /* #007acc = rgb(0, 122, 204) — allow small channel noise */
        if (r <= 20 && g >= 100 && g <= 140 && b >= 180 && b <= 220) return true;
    }
    return false;
};

/** True while a native immersive window drives theme-color. */
export const isNativeThemeColorOwned = (): boolean => {
    try {
        return Boolean((globalThis as any)?.[OWNER_KEY]);
    } catch {
        return false;
    }
};

const setOwned = (host: HTMLElement | null): void => {
    ownedNativeHost = host;
    try {
        (globalThis as any)[OWNER_KEY] = Boolean(host);
    } catch {
        /* ignore */
    }
};

/** True when a window chrome fills the viewport top (native or maximized). */
export const isViewportCoveringWindow = (host: HTMLElement | null | undefined): boolean => {
    if (!host || !host.isConnected || host.hasAttribute("minimized")) return false;
    if (host.hasAttribute("native-mode")) return true;
    const maxed =
        host.hasAttribute("maximized") ||
        host.hasAttribute("data-desk-max") ||
        host.hasAttribute("data-mobile-max") ||
        host.hasAttribute("data-native-active");
    if (!maxed) return false;
    try {
        const r = host.getBoundingClientRect();
        const vw = Math.max(1, globalThis.innerWidth || 1);
        const vh = Math.max(1, globalThis.innerHeight || 1);
        /* Cover most of the viewport and sit at/near the top (WCO / title strip). */
        return r.top <= 8 && r.left <= 8 && r.width >= vw * 0.92 && r.height >= vh * 0.85;
    } catch {
        return maxed;
    }
};

/** Prefer focused/native covering window for theme-color ownership. */
export const findThemeColorOwnerWindow = (): HTMLElement | null => {
    if (typeof document === "undefined") return null;
    if (ownedNativeHost?.isConnected && isViewportCoveringWindow(ownedNativeHost)) {
        return ownedNativeHost;
    }
    const natives = Array.from(
        document.querySelectorAll("ui-window[native-mode]:not([minimized])")
    ) as HTMLElement[];
    if (natives.length) return natives[natives.length - 1]!;
    const candidates = Array.from(
        document.querySelectorAll(
            "ui-window[data-desk-max]:not([minimized]), ui-window[maximized]:not([minimized]), ui-window[data-mobile-max]:not([minimized])"
        )
    ) as HTMLElement[];
    for (let i = candidates.length - 1; i >= 0; i--) {
        const el = candidates[i]!;
        if (isViewportCoveringWindow(el)) return el;
    }
    return null;
};

const ensureThemeAttrWatch = (): void => {
    if (themeAttrWatch || typeof MutationObserver === "undefined" || typeof document === "undefined") return;
    themeAttrWatch = new MutationObserver(() => {
        const host = findThemeColorOwnerWindow();
        if (host?.isConnected) syncThemeColorFromNativeWindow(host);
        else syncAmbientThemeColor();
    });
    themeAttrWatch.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class", "style", "color-scheme"]
    });
};

/** Fight DynamicEngine / wallpaper ambient writers while we own the meta. */
const ensureMetaContentWatch = (meta: HTMLMetaElement): void => {
    if (metaContentWatch || typeof MutationObserver === "undefined") return;
    metaContentWatch = new MutationObserver(() => {
        if (!isNativeThemeColorOwned()) return;
        const cur = (meta.getAttribute("content") || "").toLowerCase();
        const expected = (lastAppliedHex || "").toLowerCase();
        if (expected && cur === expected && !isForbiddenThemeColor(cur)) return;
        const host = findThemeColorOwnerWindow();
        if (host) syncThemeColorFromNativeWindow(host);
        else if (isForbiddenThemeColor(cur)) applyMetaHex(FALLBACK_WARM, true);
    });
    metaContentWatch.observe(meta, { attributes: true, attributeFilter: ["content"] });
};

/** Resolve any CSS color (oklch / color-mix / var-resolved) to opaque #rrggbb via canvas. */
const resolveCssColorToHex = (css: string): string | null => {
    /*const t = String(css || "").trim();
    if (!t || t === "transparent" || t === "rgba(0, 0, 0, 0)") return null;

    const hexMatch = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hexMatch) {
        let h = hexMatch[1]!;
        if (h.length === 3) {
            h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
        } else if (h.length === 8) {
            h = h.slice(0, 6);
        }
        const hex = `#${h.toLowerCase()}`;
        return isForbiddenThemeColor(hex) ? null : hex;
    }

    const m = t.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (m) {
        const alpha = m[4] !== undefined ? Number(m[4]) : 1;
        if (!Number.isFinite(alpha) || alpha < 0.5) return null;
        const r = Math.max(0, Math.min(255, Math.round(Number(m[1]))));
        const g = Math.max(0, Math.min(255, Math.round(Number(m[2]))));
        const b = Math.max(0, Math.min(255, Math.round(Number(m[3]))));
        const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
        return isForbiddenThemeColor(hex) ? null : hex;
    }

    const m2 = t.match(/^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i);
    if (m2) {
        let alpha = 1;
        if (m2[4] !== undefined) {
            alpha = String(m2[4]).endsWith("%") ? Number(m2[4]) / 100 : Number(m2[4]);
        }
        if (!Number.isFinite(alpha) || alpha < 0.5) return null;
        const r = Math.max(0, Math.min(255, Math.round(Number(m2[1]))));
        const g = Math.max(0, Math.min(255, Math.round(Number(m2[2]))));
        const b = Math.max(0, Math.min(255, Math.round(Number(m2[3]))));
        const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
        return isForbiddenThemeColor(hex) ? null : hex;
    }

    try {
        if (typeof document === "undefined") return null;
        if (!paintProbe) {
            paintProbe = document.createElement("canvas");
            paintProbe.width = 1;
            paintProbe.height = 1;
        }
        const ctx = paintProbe.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;
        ctx.fillStyle = "#000000";
        ctx.fillStyle = t;
        const resolved = String(ctx.fillStyle || "");
        if (resolved.startsWith("#") && resolved.length >= 7) {
            const hex = resolved.slice(0, 7).toLowerCase();
            return isForbiddenThemeColor(hex) ? null : hex;
        }
        return resolveCssColorToHex(resolved);
    } catch {
        return null;
    }*/

    return css;
};

const ensureThemeColorMeta = (): HTMLMetaElement | null => {
    if (typeof document === "undefined") return null;
    let meta =
        (document.querySelector('meta[data-theme-color]') as HTMLMetaElement | null) ||
        (document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null);
    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        meta.setAttribute("data-theme-color", "");
        document.head?.appendChild(meta);
    }
    /* Drop duplicate theme-color metas (manifest inject / old boot) that keep blue alive. */
    try {
        const all = Array.from(document.querySelectorAll('meta[name="theme-color"]')) as HTMLMetaElement[];
        for (const extra of all) {
            if (extra === meta) continue;
            extra.remove();
        }
    } catch {
        /* ignore */
    }
    ensureMetaContentWatch(meta);
    return meta;
};

const paintVarOnHost = (host: HTMLElement, cssBackground: string): string | null => {
    try {
        const probe = document.createElement("div");
        probe.setAttribute("data-theme-color-probe", "true");
        probe.style.cssText =
            "position:fixed;left:-8px;top:-8px;inline-size:4px;block-size:4px;pointer-events:none;opacity:0;" +
            `background:${cssBackground}`;
        host.appendChild(probe);
        const hex = resolveCssColorToHex(getComputedStyle(probe).backgroundColor);
        probe.remove();
        return hex;
    } catch {
        return null;
    }
};

/**
 * Sample the window titlebar — CSS only.
 * WHY: never `elementsFromPoint` — hits fall through to wallpaper under WCO / thin bars.
 */
const sampleTitlebarHex = (host: HTMLElement): string | null => {
    const title = host.shadowRoot?.querySelector(".title-handler") as HTMLElement | null;
    if (title) {
        const fromProbe = paintVarOnHost(
            title,
            "var(--ui-win-titlebar-bg, var(--color-surface-container, Canvas))"
        );
        if (fromProbe) return fromProbe;

        const fromTitle = resolveCssColorToHex(getComputedStyle(title).backgroundColor);
        if (fromTitle) return fromTitle;
    }

    const cs = getComputedStyle(host);
    for (const prop of ["--ui-win-titlebar-bg", "--color-surface-container", "--color-surface"]) {
        const painted = paintVarOnHost(host, `var(${prop})`);
        if (painted) return painted;
        const raw = cs.getPropertyValue(prop).trim();
        if (!raw) continue;
        const viaCanvas = resolveCssColorToHex(raw);
        if (viaCanvas) return viaCanvas;
    }

    const rootCs = getComputedStyle(document.documentElement);
    for (const prop of ["--color-surface-container", "--color-surface", "--color-surface-container-low"]) {
        const hex =
            paintVarOnHost(document.documentElement, `var(${prop})`) ||
            resolveCssColorToHex(rootCs.getPropertyValue(prop).trim());
        if (hex) return hex;
    }

    return null;
};

const applyMetaHex = (hex: string, forceReinsert = false): void => {
    const meta = ensureThemeColorMeta();
    if (!meta || !hex) return;
    let next = hex.toLowerCase();
    if (isForbiddenThemeColor(next)) next = FALLBACK_WARM;
    const prev = (meta.getAttribute("content") || "").toLowerCase();
    if (prev === next && !forceReinsert && !isForbiddenThemeColor(prev)) return;

    meta.setAttribute("content", next);
    meta.setAttribute("data-theme-color", "");
    meta.removeAttribute("media");
    lastAppliedHex = next;

    /*
     * WHY: Chromium WCO often keeps the previous tint until the meta node is
     * re-inserted (or content toggled). Force a reinsert on real color changes.
     */
    if (forceReinsert || prev !== next || isForbiddenThemeColor(prev)) {
        try {
            const parent = meta.parentNode || document.head;
            parent?.removeChild(meta);
            parent?.appendChild(meta);
        } catch {
            /* ignore */
        }
    }
};

/** Sample page surface for ambient WCO (desktop with no covering window). */
export const syncAmbientThemeColor = (): void => {
    if (typeof document === "undefined") return;
    if (findThemeColorOwnerWindow()) return;
    setOwned(null);
    lastAppliedHex = null;

    const meta = ensureThemeColorMeta();
    if (!meta) return;

    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const bodyCs = document.body ? getComputedStyle(document.body) : null;
    const hex =
        resolveCssColorToHex(cs.getPropertyValue("--color-surface-container").trim()) ||
        resolveCssColorToHex(cs.getPropertyValue("--color-surface").trim()) ||
        resolveCssColorToHex(cs.getPropertyValue("--ui-win-titlebar-bg").trim()) ||
        (bodyCs ? resolveCssColorToHex(bodyCs.backgroundColor) : null) ||
        resolveCssColorToHex(cs.backgroundColor);

    if (hex) {
        applyMetaHex(hex);
    } else if (isForbiddenThemeColor(String(meta.getAttribute("content") || ""))) {
        applyMetaHex(FALLBACK_WARM, true);
    }
    ensureThemeAttrWatch();
};

const isMaxChrome = (host: HTMLElement): boolean =>
    host.hasAttribute("maximized") ||
    host.hasAttribute("data-desk-max") ||
    host.hasAttribute("data-mobile-max") ||
    host.hasAttribute("data-native-active");

/** Push **this** window's titlebar fill into meta theme-color (native or viewport-covering). */
export const syncThemeColorFromNativeWindow = (host: HTMLElement | null | undefined): void => {
    if (!host || typeof document === "undefined") return;
    if (host.hasAttribute("minimized")) return;
    /* Max chrome may not fill geometry yet on the first frame — still claim titlebar ownership. */
    if (!host.hasAttribute("native-mode") && !isMaxChrome(host) && !isViewportCoveringWindow(host)) return;

    const meta = ensureThemeColorMeta();
    if (!meta) return;

    if (themeColorBeforeNative == null) {
        const prev = meta.getAttribute("content") || "";
        themeColorBeforeNative = isForbiddenThemeColor(prev) ? "" : prev;
    }

    setOwned(host);

    /*
     * WHY: claim ownership first, then immediately kill sticky blue so the 500ms
     * DynamicEngine tick cannot leave #007acc while sample is still settling.
     */
    if (isForbiddenThemeColor(String(meta.getAttribute("content") || ""))) {
        applyMetaHex(FALLBACK_WARM, true);
    }

    const gen = ++applyGeneration;
    const apply = (force = false): void => {
        if (gen !== applyGeneration) return;
        if (!host.isConnected) return;
        if (!host.hasAttribute("native-mode") && !isMaxChrome(host) && !isViewportCoveringWindow(host)) {
            return;
        }
        const hex = sampleTitlebarHex(host) || FALLBACK_WARM;
        applyMetaHex(hex, force);
    };
    apply(true);
    requestAnimationFrame(() => {
        apply(false);
        requestAnimationFrame(() => apply(true));
    });
    for (const t of resyncTimers) clearTimeout(t);
    resyncTimers = [];
    /* WHY: wallpaper / veela tokens may settle a frame after native geometry. */
    resyncTimers.push(
        setTimeout(() => apply(true), 50),
        setTimeout(() => apply(true), 160),
        setTimeout(() => apply(true), 400)
    );
    ensureThemeAttrWatch();
};

/**
 * Restore ambient theme-color when no covering/native windows remain.
 * If another owner window is still up, re-sample from that host.
 */
export const restoreThemeColorAfterNativeWindow = (exitingHost?: HTMLElement | null): void => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) return;

    const other = findThemeColorOwnerWindow();
    if (other && other !== exitingHost) {
        syncThemeColorFromNativeWindow(other);
        return;
    }
    /* findThemeColorOwnerWindow may still return exitingHost — scan peers */
    const peers = Array.from(
        document.querySelectorAll(
            "ui-window[native-mode]:not([minimized]), ui-window[data-desk-max]:not([minimized]), ui-window[maximized]:not([minimized]), ui-window[data-mobile-max]:not([minimized])"
        )
    ).filter((el) => el !== exitingHost && isViewportCoveringWindow(el as HTMLElement)) as HTMLElement[];
    if (peers.length) {
        syncThemeColorFromNativeWindow(peers[peers.length - 1]!);
        return;
    }

    setOwned(null);
    lastAppliedHex = null;
    applyGeneration += 1;
    for (const t of resyncTimers) clearTimeout(t);
    resyncTimers = [];

    if (themeColorBeforeNative != null && themeColorBeforeNative && !isForbiddenThemeColor(themeColorBeforeNative)) {
        applyMetaHex(themeColorBeforeNative, true);
        themeColorBeforeNative = null;
    } else {
        themeColorBeforeNative = null;
        syncAmbientThemeColor();
    }
};

if (typeof document !== "undefined") {
    queueMicrotask(() => {
        try {
            syncAmbientThemeColor();
        } catch {
            /* ignore */
        }
    });
}
