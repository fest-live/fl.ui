/*
 * Filename: app-launch.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/app-launch.ts
 * FIND:app-menu
 * TAG:sku
 * Change date and time: 12.10.00_28.08.2026
 * Reason for changes: Per-app launch overrides (action / data / extras / flags) for App Menu + Speed Dial.
 *
 * INVARIANT: empty spec means stock MAIN/LAUNCHER. javascript: data is never stored.
 */

export type LauncherLaunchSpec = {
    action?: string;
    data?: string;
    mimeType?: string;
    extras?: Record<string, string | number | boolean>;
    flags?: string[];
    categories?: string[];
    componentName?: string;
};

const STORAGE_KEY = "cwsp-app-launch-spec-v1";

type SpecMap = Record<string, LauncherLaunchSpec>;

let cache: SpecMap | null = null;

const launchKey = (packageName: string): string => `app:${String(packageName || "").trim()}`;

function readAll(): SpecMap {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            cache = {};
            return cache;
        }
        const parsed = JSON.parse(raw);
        cache = parsed && typeof parsed === "object" ? (parsed as SpecMap) : {};
    } catch {
        cache = {};
    }
    return cache;
}

function writeAll(map: SpecMap): void {
    cache = map;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        /* quota / private mode */
    }
}

const sanitizeDataUri = (raw: string): string => {
    const data = String(raw || "").trim();
    if (!data) return "";
    if (/^javascript:/i.test(data)) return "";
    return data;
};

export function normalizeLauncherLaunchSpec(raw: unknown): LauncherLaunchSpec {
    const src = raw && typeof raw === "object" ? (raw as LauncherLaunchSpec) : {};
    const extrasIn = src.extras && typeof src.extras === "object" ? src.extras : {};
    const extras: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(extrasIn)) {
        const key = String(k || "").trim();
        if (!key) continue;
        if (typeof v === "boolean" || typeof v === "number" || typeof v === "string") extras[key] = v;
    }
    const flags = Array.isArray(src.flags)
        ? src.flags.map((f) => String(f || "").trim().toUpperCase()).filter(Boolean)
        : [];
    const categories = Array.isArray(src.categories)
        ? src.categories.map((c) => String(c || "").trim()).filter(Boolean)
        : [];
    return {
        action: String(src.action || "").trim(),
        data: sanitizeDataUri(String(src.data || "")),
        mimeType: String(src.mimeType || "").trim(),
        extras,
        flags,
        categories,
        componentName: String(src.componentName || "").trim()
    };
}

export function isLauncherLaunchSpecEmpty(spec: LauncherLaunchSpec | null | undefined): boolean {
    if (!spec) return true;
    return (
        !spec.action &&
        !spec.data &&
        !spec.mimeType &&
        !spec.componentName &&
        (!spec.flags || spec.flags.length === 0) &&
        (!spec.categories || spec.categories.length === 0) &&
        (!spec.extras || Object.keys(spec.extras).length === 0)
    );
}

export function getAppLaunchSpec(packageName: string): LauncherLaunchSpec {
    const key = launchKey(packageName);
    if (!key || key === "app:") return {};
    return normalizeLauncherLaunchSpec(readAll()[key]);
}

export function setAppLaunchSpec(packageName: string, spec: LauncherLaunchSpec): LauncherLaunchSpec {
    const key = launchKey(packageName);
    if (!key || key === "app:") return {};
    const next = normalizeLauncherLaunchSpec(spec);
    const all = { ...readAll() };
    if (isLauncherLaunchSpecEmpty(next)) delete all[key];
    else all[key] = next;
    writeAll(all);
    return next;
}

export function clearAppLaunchSpec(packageName: string): void {
    const key = launchKey(packageName);
    if (!key || key === "app:") return;
    const all = { ...readAll() };
    delete all[key];
    writeAll(all);
}

/** Stock MAIN/LAUNCHER when nothing is stored. */
export function resolveAppLaunchSpec(packageName: string): LauncherLaunchSpec {
    return getAppLaunchSpec(packageName);
}
