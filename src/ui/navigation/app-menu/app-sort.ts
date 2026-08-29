/*
 * Filename: app-sort.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/app-menu/app-sort.ts
 * FIND:app-menu
 * Change date and time: 22.30.00_29.08.2026
 * Reason for changes: App Menu sort — name, install/update, category, color (masked result).
 */

import { getAppMenuTileChrome, appMenuChromeKeyForPackage } from "./tile-chrome";
import { inferIconDisplay, type IconDisplayMode } from "fl-ui/speed-dial/tile-icon";
import { ensureLauncherIconObjectUrl } from "fl-ui/speed-dial/action-registry";

export const APP_MENU_SORT_EVENT = "cwsp:app-menu-sort-change";
const STORAGE_KEY = "cwsp-app-menu-sort";

export type AppMenuSortBy = "name" | "installed" | "updated" | "color" | "category" | "package";
export type SortDirection = "asc" | "desc";

export type AppMenuSortPrefs = {
    sortBy: AppMenuSortBy;
    sortDir: SortDirection;
};

export const APP_MENU_SORT_OPTIONS: Array<[AppMenuSortBy, string]> = [
    ["name", "Name"],
    ["installed", "Date installed"],
    ["updated", "Date updated"],
    ["color", "Color (including mask)"],
    ["category", "Category"],
    ["package", "Package"]
];

const SORT_SET = new Set<AppMenuSortBy>(APP_MENU_SORT_OPTIONS.map(([v]) => v));

export type SortableApp = {
    packageName?: string;
    label?: string;
    componentName?: string;
    iconCacheKey?: string;
    firstInstallTime?: number;
    lastUpdateTime?: number;
    category?: string;
    installer?: string;
    system?: boolean;
};

const colorCache = new Map<string, number>();

export const normalizeAppMenuSortBy = (raw: unknown, fallback: AppMenuSortBy = "name"): AppMenuSortBy => {
    const v = String(raw || "")
        .trim()
        .toLowerCase();
    if (v === "install" || v === "install-date" || v === "date-installed") return "installed";
    if (v === "update" || v === "update-date" || v === "date-updated" || v === "recent") return "updated";
    if (v === "hue" || v === "colour") return "color";
    return SORT_SET.has(v as AppMenuSortBy) ? (v as AppMenuSortBy) : fallback;
};

export const normalizeSortDir = (raw: unknown, fallback: SortDirection = "asc"): SortDirection => {
    const v = String(raw || "")
        .trim()
        .toLowerCase();
    if (v === "desc" || v === "descending" || v === "newest" || v === "z-a") return "desc";
    if (v === "asc" || v === "ascending" || v === "oldest" || v === "a-z") return "asc";
    return fallback;
};

export const defaultDirForAppSort = (sortBy: AppMenuSortBy): SortDirection =>
    sortBy === "installed" || sortBy === "updated" ? "desc" : "asc";

export const peekAppMenuSort = (): AppMenuSortPrefs => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<AppMenuSortPrefs>;
            const sortBy = normalizeAppMenuSortBy(parsed.sortBy);
            return { sortBy, sortDir: normalizeSortDir(parsed.sortDir, defaultDirForAppSort(sortBy)) };
        }
    } catch {
        /* private mode */
    }
    return { sortBy: "name", sortDir: "asc" };
};

export const writeAppMenuSort = (prefs: Partial<AppMenuSortPrefs>): AppMenuSortPrefs => {
    const cur = peekAppMenuSort();
    const sortBy = prefs.sortBy != null ? normalizeAppMenuSortBy(prefs.sortBy, cur.sortBy) : cur.sortBy;
    const sortDir =
        prefs.sortDir != null ? normalizeSortDir(prefs.sortDir, defaultDirForAppSort(sortBy)) : cur.sortDir;
    const next = { sortBy, sortDir };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        /* quota */
    }
    try {
        window.dispatchEvent(new CustomEvent(APP_MENU_SORT_EVENT, { detail: next }));
    } catch {
        /* no window */
    }
    return next;
};

const cmpStr = (a: string, b: string): number =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) || a.localeCompare(b);

const cmpNum = (a: number, b: number): number => (a === b ? 0 : a < b ? -1 : 1);

const categoryOf = (app: SortableApp): string => {
    const cat = String(app.category || "").trim().toLowerCase();
    if (cat) return cat;
    if (app.system) return "system";
    const installer = String(app.installer || "").trim().toLowerCase();
    return installer || "other";
};

const displayForApp = (app: SortableApp): IconDisplayMode => {
    const chrome = getAppMenuTileChrome(appMenuChromeKeyForPackage(String(app.packageName || "")));
    return (
        inferIconDisplay({
            iconDisplay: chrome.iconDisplay,
            iconUrl: chrome.iconUrl,
            isLauncherApp: true
        }) || "colored"
    );
};

const parseCssColor = (raw: string): { r: number; g: number; b: number } | null => {
    const s = String(raw || "").trim();
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (hex) {
        const h = hex[1];
        const n =
            h.length === 3
                ? h.split("").map((c) => parseInt(c + c, 16))
                : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        return { r: n[0]!, g: n[1]!, b: n[2]! };
    }
    const rgb = /rgba?\(\s*([\d.]+)[,\s/]+([\d.]+)[,\s/]+([\d.]+)/i.exec(s);
    if (!rgb) return null;
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
};

const rgbHue = (r: number, g: number, b: number): number => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    if (d < 1e-4) return 0;
    let h = 0;
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
};

const themeHueFrom = (el?: HTMLElement | null): number => {
    try {
        const cs = el ? getComputedStyle(el) : getComputedStyle(document.documentElement);
        const ink = cs.getPropertyValue("--env-app-menu-ink") || cs.color;
        const rgb = parseCssColor(ink);
        return rgb ? rgbHue(rgb.r, rgb.g, rgb.b) : 210;
    } catch {
        return 210;
    }
};

const sampleUrlHue = (url: string, mode: IconDisplayMode, themeHue: number): Promise<number> =>
    new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
            try {
                const c = document.createElement("canvas");
                c.width = 32;
                c.height = 32;
                const ctx = c.getContext("2d", { willReadFrequently: true });
                if (!ctx) {
                    resolve(themeHue);
                    return;
                }
                ctx.drawImage(img, 0, 0, 32, 32);
                const data = ctx.getImageData(0, 0, 32, 32).data;
                let wr = 0;
                let wg = 0;
                let wb = 0;
                let wsum = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const a = data[i + 3]! / 255;
                    if (a < 0.12) continue;
                    const r = data[i]!;
                    const g = data[i + 1]!;
                    const b = data[i + 2]!;
                    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                    const mask = mode === "masked-inverse" ? 1 - luma : luma;
                    const weight = mode === "colored" ? a : a * (0.15 + 0.85 * mask);
                    wr += r * weight;
                    wg += g * weight;
                    wb += b * weight;
                    wsum += weight;
                }
                if (wsum < 1e-3) {
                    resolve(themeHue);
                    return;
                }
                let hue = rgbHue(wr / wsum, wg / wsum, wb / wsum);
                /* WHY: mask/inverse paint as theme ink — blend toward that result. */
                if (mode === "masked" || mode === "masked-inverse") {
                    hue = (hue * 0.28 + themeHue * 0.72) % 360;
                }
                resolve(hue);
            } catch {
                resolve(themeHue);
            }
        };
        img.onerror = () => resolve(themeHue);
        img.src = url;
    });

export const hydrateAppColorKeys = async (
    apps: SortableApp[],
    themeHost?: HTMLElement | null
): Promise<void> => {
    const themeHue = themeHueFrom(themeHost);
    const jobs: Promise<void>[] = [];
    for (const app of apps) {
        const pkg = String(app.packageName || app.iconCacheKey || "").trim();
        if (!pkg) continue;
        const mode = displayForApp(app);
        const cacheKey = `${pkg}|${mode}`;
        if (colorCache.has(cacheKey)) continue;
        jobs.push(
            (async () => {
                try {
                    const url = await ensureLauncherIconObjectUrl(app.iconCacheKey || pkg, 32);
                    const hue = url ? await sampleUrlHue(url, mode, themeHue) : themeHue;
                    colorCache.set(cacheKey, hue);
                } catch {
                    colorCache.set(cacheKey, themeHue);
                }
            })()
        );
    }
    const chunk = 12;
    for (let i = 0; i < jobs.length; i += chunk) {
        await Promise.all(jobs.slice(i, i + chunk));
    }
};

const colorKeyOf = (app: SortableApp): number => {
    const pkg = String(app.packageName || app.iconCacheKey || "").trim();
    const mode = displayForApp(app);
    return colorCache.get(`${pkg}|${mode}`) ?? 0;
};

export const sortLauncherApps = <T extends SortableApp>(apps: T[], prefs: AppMenuSortPrefs): T[] => {
    const dir = prefs.sortDir === "desc" ? -1 : 1;
    return [...apps].sort((a, b) => {
        let n = 0;
        if (prefs.sortBy === "installed") n = cmpNum(Number(a.firstInstallTime || 0), Number(b.firstInstallTime || 0));
        else if (prefs.sortBy === "updated") n = cmpNum(Number(a.lastUpdateTime || 0), Number(b.lastUpdateTime || 0));
        else if (prefs.sortBy === "color") n = cmpNum(colorKeyOf(a), colorKeyOf(b));
        else if (prefs.sortBy === "category") n = cmpStr(categoryOf(a), categoryOf(b));
        else if (prefs.sortBy === "package") n = cmpStr(String(a.packageName || ""), String(b.packageName || ""));
        else n = cmpStr(String(a.label || a.packageName || ""), String(b.label || b.packageName || ""));
        if (!n) n = cmpStr(String(a.label || ""), String(b.label || ""));
        if (!n) n = cmpStr(String(a.packageName || ""), String(b.packageName || ""));
        return n * dir;
    });
};
