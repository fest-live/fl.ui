/*
 * Filename: action-registry.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/action-registry.ts
 * Change date and time: 11.26.00_03.08.2026
 * Reason for changes: Cherry-pick richer open-view / open-link builtins + markdown-view alias normalization from second half (Task 4).
 */

import { navigate } from "@fest-lib/lure";
import {
    NAVIGATION_SHORTCUTS,
    buildSpeedDialViewPathHref,
    isExternalWebHref,
    normalizeExternalWebHref,
    openInDetachedBrowserWindow,
    openInNewBrowserTab,
    parseSpeedDialViewFromHref,
    normalizeOpenLinkTarget,
    resolveItemOpenLinkTarget,
    resolveSpeedDialItemHref,
    snapshotSpeedDialItem,
    getSpeedDialMeta,
    type SpeedDialItem,
    type SpeedDialMetaRegistry
} from "./launcher-state";
import { showSuccess, showError } from "./toast";
import { getSpeedDialViewOpener } from "./view-opener";

/** Minimal launcher IPC surface — host registers at boot (Capacitor entry). */
export type LauncherBridgeSpeedDialApi = {
    launcherLaunch: (pkg: string, component?: string) => Promise<boolean>;
    launcherIcon?: (cacheKey: string, size?: number) => Promise<string>;
};

let registeredLauncherBridge: LauncherBridgeSpeedDialApi | null = null;

/** Host injects launcher IPC when dynamic `com/routing/native/launcher-bridge` is unavailable. */
export function setLauncherBridgeForSpeedDial(api: LauncherBridgeSpeedDialApi | null): void {
    registeredLauncherBridge = api;
}

async function resolveLauncherBridgeForSpeedDial(): Promise<LauncherBridgeSpeedDialApi | null> {
    if (registeredLauncherBridge) return registeredLauncherBridge;
    try {
        return (await import("com/routing/native/launcher-bridge")) as LauncherBridgeSpeedDialApi;
    } catch {
        return null;
    }
}

/** Apply fetched Android icon URL to a tile `<img>`. */
export function applyLauncherIconImgUrl(host: HTMLImageElement, dataUrl: string): void {
    const url = String(dataUrl || "").trim();
    if (!url) return;
    host.src = url;
    host.toggleAttribute("data-launcher-icon-ready", true);
}

/** @deprecated WebView often ignores `mask-image: var(--url)` — prefer {@link applyLauncherIconImgUrl}. */
export function applyLauncherIconMaskUrl(host: HTMLElement, dataUrl: string): void {
    const url = String(dataUrl || "").trim();
    if (!url) return;
    const safe = url.replace(/"/g, '\\"');
    const maskValue = `url("${safe}")`;
    host.style.setProperty("-webkit-mask-image", maskValue);
    host.style.setProperty("mask-image", maskValue);
    host.toggleAttribute("data-launcher-icon-ready", true);
}

/** Create a launcher app icon `<img>` host (`data-launcher-icon`). */
export function createLauncherIconImgElement(): HTMLImageElement {
    const host = document.createElement("img");
    host.className = "ui-ws-item-icon-img";
    host.dataset.launcherIcon = "1";
    host.alt = "";
    host.decoding = "async";
    host.draggable = false;
    return host;
}

/** Create a launcher app icon mask host (`data-launcher-icon`). */
export function createLauncherIconMaskElement(): HTMLElement {
    const host = document.createElement("span");
    host.className = "ui-ws-item-icon-mask";
    host.dataset.launcherIcon = "1";
    host.setAttribute("aria-hidden", "true");
    return host;
}

/** Load Android app icon into a SpeedDial tile (`launch-app` meta). */
export async function hydrateLauncherAppTileIcon(
    el: HTMLElement,
    item: { id: string; action?: string }
): Promise<void> {
    const meta = getSpeedDialMeta(item.id);
    const action = String(meta?.action || item.action || "").trim();
    if (action !== "launch-app" && meta?.entityType !== "android-app") return;

    const cacheKey = String(meta?.iconCacheKey || meta?.packageName || "").trim();
    if (!cacheKey) return;

    const bridge = await resolveLauncherBridgeForSpeedDial();
    if (!bridge?.launcherIcon) return;

    let dataUrl = "";
    try {
        dataUrl = await bridge.launcherIcon(cacheKey, 64);
    } catch {
        return;
    }
    if (!dataUrl || !el.isConnected) return;

    el.querySelector(".ui-ws-item-icon-mask[data-launcher-icon]")?.remove();

    let img = el.querySelector<HTMLImageElement>("img[data-launcher-icon]");
    if (!img) {
        img = createLauncherIconImgElement();
        const uiIcon = el.querySelector("ui-icon");
        if (uiIcon) uiIcon.replaceWith(img);
        else el.prepend(img);
    }
    applyLauncherIconImgUrl(img, dataUrl);
}

/*
 * Markdown-view family alias normalization (inlined from
 * `modules/views/window-frame/src/views/markdown-view-window.ts`).
 * WHY: fl.ui must stay standalone — the relative import `../../../window-frame/...`
 * does not resolve from this package. The alias set is tiny and stable, so we keep
 * a private copy here to avoid a broken cross-package dependency.
 * INVARIANT: keep this set in sync with the source-of-truth module if it changes.
 */
const MARKDOWN_VIEW_MANAGED_WINDOW_KEY = "viewer" as const;
const MARKDOWN_VIEW_ALIASES = new Set([
    "markdown",
    "markdown-view",
    "markdown-viewer",
    "reader",
    /* `ui-taskbar` / `makeTask("#env-viewer")` — hash becomes this id. */
    "env-viewer"
]);
/**
 * Strip legacy desktop typos, normalize markdown family → {@link MARKDOWN_VIEW_MANAGED_WINDOW_KEY};
 * leave all other ids unchanged (`explorer`, `settings`, …).
 */
const normalizeMarkdownViewWindowId = (raw: string): string => {
    let id = String(raw ?? "").trim().toLowerCase();
    id = id.replace(/^#/, "");
    const todo = /^todo:\s*(.*)$/i.exec(id);
    if (todo) id = String(todo[1] ?? "").trim().toLowerCase();
    id = id.replace(/\s+/g, "");
    if (!id) return "";
    if (id === MARKDOWN_VIEW_MANAGED_WINDOW_KEY || MARKDOWN_VIEW_ALIASES.has(id)) {
        return MARKDOWN_VIEW_MANAGED_WINDOW_KEY;
    }
    return id;
};

/**
 * Resolve speed-dial / shortcut `meta.view` and desktop `viewId` strings to a canonical `ViewId`.
 * WHY: Persisted rows may store the human label ("Markdown", "Plan") or legacy ids; {@link normalizeMarkdownViewWindowId}
 * only covers the markdown family.
 */
export function resolveOpenViewTarget(raw: string | undefined | null): string {
    const t = String(raw ?? "").trim();
    if (!t) return "";
    const tLower = t.toLowerCase().replace(/^#/, "");
    const byShortcut = NAVIGATION_SHORTCUTS.find(
        (s) =>
            String(s.view).toLowerCase() === tLower ||
            String(s.label).trim().toLowerCase() === tLower
    );
    if (byShortcut) return String(byShortcut.view);
    const md = normalizeMarkdownViewWindowId(t);
    return md || t.replace(/^#/, "").trim();
}

/** Same arity as handlers invoked from SpeedDial.runItemAction. */
export type SpeedDialActionHandler = (context: any, second?: any, third?: HTMLElement) => any;

const actionRegistry = new Map<string, SpeedDialActionHandler>();
const labelsPerAction = new Map<string, (entityDesc: any) => string>();
const iconsPerAction = new Map<string, string>();

let builtinsInstalled = false;

/**
 * Turn bare view tokens (`settings`, `#workcenter`, `/viewer`) into absolute
 * mono-app URLs (`https://host/settings?shell=environment&native=1&view=settings`).
 * External http(s)/mailto links pass through unchanged.
 */
export const normalizeSpeedDialOpenHref = (raw: string): string => {
    const input = String(raw || "").trim();
    if (!input) return "";
    if (/^(mailto:|blob:|data:)/i.test(input)) return input;

    const asView = (candidate: string): string => {
        const view = resolveOpenViewTarget(candidate);
        return view ? buildSpeedDialViewPathHref(view, true, { native: true }) : "";
    };

    /* Already absolute http(s). */
    if (/^https?:\/\//i.test(input)) {
        try {
            const u = new URL(input);
            if (typeof location !== "undefined" && u.origin === location.origin) {
                const seg = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop() || "";
                const mono = asView(seg);
                if (mono) return mono;
            }
            return u.href;
        } catch {
            return input;
        }
    }

    if (input.startsWith("/")) {
        const seg = input.replace(/^\//, "").split(/[/?#]/)[0];
        const mono = asView(seg);
        if (mono) return mono;
        try {
            return new URL(input, location.href).href;
        } catch {
            return input;
        }
    }

    const token = input.replace(/^#/, "").split(/[/?#]/)[0].trim();
    const mono = asView(token);
    if (mono && !/[.:]/.test(token)) return mono;

    try {
        return new URL(input, location.href).href;
    } catch {
        return input;
    }
};

const copyTextToClipboard = async (text: string): Promise<void> => {
    const t = String(text || "").trim();
    if (!t.length) throw new Error("empty");
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(t);
        return;
    }
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
};

const ensureHashNavigation = (view: string, viewMaker?: any, props?: Record<string, string>): void => {
    if (!view || typeof window === "undefined") return;
    if (typeof viewMaker === "function") {
        viewMaker(view, props);
        return;
    }
    const opener = getSpeedDialViewOpener();
    if (opener) {
        opener(view, props);
        return;
    }
    const hash = `#${String(view).replace(/^#/, "")}`;
    if (location.hash !== hash) navigate(hash);
};

const installBuiltins = (): void => {
    if (builtinsInstalled) return;
    builtinsInstalled = true;

    iconsPerAction.set("open-view", "compass");
    iconsPerAction.set("open-link", "arrow-square-out");
    iconsPerAction.set("copy-link", "copy");
    iconsPerAction.set("copy-state-desc", "brackets-curly");

    labelsPerAction.set("open-view", (d: any) => `Open ${d?.label || "view"}`);
    labelsPerAction.set("open-link", (d: any) => (d?.label ? `Open ${d.label}` : "Open link"));
    labelsPerAction.set("copy-link", () => "Copy link");
    labelsPerAction.set("copy-state-desc", () => "Copy shortcut JSON");

    actionRegistry.set("open-view", async (context: any, entityDesc?: any) => {
        const item = context?.items?.find?.((i: SpeedDialItem) => i?.id === context?.id) || null;
        const metaMap = context?.meta as SpeedDialMetaRegistry | undefined;
        const meta = item && metaMap?.get ? metaMap.get(item.id) : null;
        const rawTarget = meta?.view || entityDesc?.view || entityDesc?.type || "";
        const targetView = resolveOpenViewTarget(String(rawTarget || ""));
        if (!targetView) {
            showError("No view target");
            return;
        }
        const viewMaker = context?.viewMaker ?? getSpeedDialViewOpener();
        /*
         * Explicit per-tile / menu Native → new PWA/app window (same as open-link native).
         * Default open-view stays inline in the current environment shell.
         */
        const linkTarget =
            context?.openLinkTarget != null
                ? normalizeOpenLinkTarget(context.openLinkTarget)
                : meta?.openLinkTarget != null && String(meta.openLinkTarget).trim()
                  ? normalizeOpenLinkTarget(meta.openLinkTarget)
                  : "inline";
        if (linkTarget === "native-window") {
            const href = buildSpeedDialViewPathHref(targetView, true, { native: true });
            if (!href) {
                showError("Link is missing");
                return;
            }
            if (!openInDetachedBrowserWindow(href)) {
                showError("Unable to open native window");
            }
            return;
        }
        if (linkTarget === "new-tab") {
            const href = buildSpeedDialViewPathHref(targetView, true, { native: false });
            if (!href) {
                showError("Link is missing");
                return;
            }
            if (!openInNewBrowserTab(href)) {
                showError("Unable to open new tab");
            }
            return;
        }
        ensureHashNavigation(targetView, viewMaker, {});
    });

    actionRegistry.set("open-link", async (context: any) => {
        const item = context?.items?.find?.((i: SpeedDialItem) => i?.id === context?.id) || null;
        const metaMap = context?.meta as SpeedDialMetaRegistry | undefined;
        const meta = item && metaMap?.get ? metaMap.get(item.id) : null;
        /*
         * - native-window → PWA app window when installed (mono `?native=1`); else detached
         * - inline → openView in current environment shell (same tab)
         * - new-tab → ordinary browser tab (`target=_blank`) for http(s)/www or app URL
         */
        const raw = meta?.href || (item as any)?.href || context?.href || resolveSpeedDialItemHref(item);
        const viewFromMeta = resolveOpenViewTarget(String(meta?.view || ""));
        const externalHref = isExternalWebHref(raw) ? normalizeExternalWebHref(raw) || normalizeSpeedDialOpenHref(String(raw || "")) : "";
        const view = externalHref
            ? ""
            : resolveOpenViewTarget(parseSpeedDialViewFromHref(String(raw || ""))) || viewFromMeta;
        const linkTarget =
            context?.openLinkTarget != null
                ? normalizeOpenLinkTarget(context.openLinkTarget)
                : resolveItemOpenLinkTarget(meta);
        const opener = context?.viewMaker ?? getSpeedDialViewOpener();

        /* Inline: always in-session env window — never a second browser window/tab. */
        if (linkTarget === "inline") {
            if (view && typeof opener === "function") {
                try {
                    opener(view, {});
                    return;
                } catch (e) {
                    console.warn("[speed-dial] inline openView failed; falling back to URL", e);
                }
            }
            if (externalHref && typeof opener === "function") {
                try {
                    /* Prefer in-shell viewer for arbitrary http(s) when available. */
                    opener("viewer", { params: { url: externalHref, href: externalHref } } as any);
                    return;
                } catch (e) {
                    console.warn("[speed-dial] inline viewer open failed", e);
                }
            }
            showError(externalHref ? "Unable to open link inline" : "Link is missing");
            return;
        }

        /* New browser tab — keep external URLs as-is; app views open without native=1. */
        if (linkTarget === "new-tab") {
            const href = externalHref
                ? externalHref
                : view
                  ? buildSpeedDialViewPathHref(view, true, { native: false })
                  : normalizeSpeedDialOpenHref(String(raw || ""));
            if (!href) {
                showError("Link is missing");
                return;
            }
            if (!openInNewBrowserTab(href)) {
                showError("Unable to open new tab");
            }
            return;
        }

        /* Native / detached window: mono boot for app views; sized window for http(s). */
        const href = externalHref
            ? externalHref
            : view
              ? buildSpeedDialViewPathHref(view, true, { native: true })
              : normalizeSpeedDialOpenHref(String(raw || ""));
        if (!href) {
            showError("Link is missing");
            return;
        }
        if (!openInDetachedBrowserWindow(href)) {
            showError("Unable to open native window (popup blocked?)");
        }
    });

    actionRegistry.set("copy-link", async (context: any) => {
        const item = context?.items?.find?.((i: SpeedDialItem) => i?.id === context?.id) || null;
        const metaMap = context?.meta as SpeedDialMetaRegistry | undefined;
        const meta = item && metaMap?.get ? metaMap.get(item.id) : null;
        const raw = meta?.href || (item as any)?.href || context?.href || resolveSpeedDialItemHref(item);
        const href = normalizeSpeedDialOpenHref(String(raw || ""));
        if (!href) {
            showError("Nothing to copy");
            return;
        }
        try {
            await copyTextToClipboard(String(href));
            showSuccess("Link copied");
        } catch (e) {
            console.warn(e);
            showError("Failed to copy link");
        }
    });

    actionRegistry.set("copy-state-desc", async (context: any) => {
        const item = context?.items?.find?.((i: SpeedDialItem) => i?.id === context?.id) || null;
        if (!item) {
            showError("Nothing to copy");
            return;
        }
        const snapshot = snapshotSpeedDialItem(item);
        if (!snapshot) {
            showError("Nothing to copy");
            return;
        }
        try {
            const text = JSON.stringify(snapshot, null, 2);
            await copyTextToClipboard(text);
            showSuccess("Shortcut saved to clipboard");
        } catch (e) {
            console.warn(e);
            showError("Failed to copy shortcut");
        }
    });

    /*
     * Task 3 — open a virtual path (directory or file) from a mirror tile.
     *
     * WHY: mirror tiles carry `path` (PathRouter virtual path) and optionally
     * `href` (Chrome bookmark URL). Directories open the Explorer at that
     * path; `.md`/`.txt`/image files open the viewer; URL hrefs delegate to
     * `open-link`. The Explorer view reads `params.path` into `initialPath`
     * (see environment-shell explorer runtime.ts `loadLastPath`).
     *
     * INVARIANT: never `location.assign` — go through the registered view
     * opener so the shell controls window/tab placement.
     */
    iconsPerAction.set("launch-app", "device-mobile");
    labelsPerAction.set("launch-app", (d: any) => `Launch ${d?.label || d?.packageName || "app"}`);
    actionRegistry.set("launch-app", async (context: any, entityDesc?: any) => {
        const item =
            context?.items?.find?.((i: SpeedDialItem) => i?.id === context?.id) ||
            (entityDesc?.id ? entityDesc : null);
        const metaMap = context?.meta as SpeedDialMetaRegistry | undefined;
        const itemId = String(entityDesc?.id || context?.id || item?.id || "").trim();
        const meta =
            (itemId && metaMap?.get ? metaMap.get(itemId) : null) ||
            entityDesc?.meta ||
            null;
        const pkg = String(meta?.packageName || entityDesc?.packageName || "").trim();
        if (!pkg) {
            showError("App missing");
            return;
        }
        const bridge = await resolveLauncherBridgeForSpeedDial();
        if (!bridge?.launcherLaunch) {
            showError("Unable to launch app");
            return;
        }
        const component = String(meta?.componentName || entityDesc?.componentName || "").trim() || undefined;
        const ok = await bridge.launcherLaunch(pkg, component);
        if (!ok) showError("Unable to launch app");
    });

    iconsPerAction.set("open-path", "folder");
    labelsPerAction.set("open-path", (d: any) => `Open ${d?.label || d?.path || "path"}`);
    actionRegistry.set("open-path", async (context: any, entityDesc?: any) => {
        const metaMap = context?.meta as SpeedDialMetaRegistry | undefined;
        const itemId = String(entityDesc?.id || context?.id || "").trim();
        const meta = (itemId && metaMap?.get ? metaMap.get(itemId) : null) || entityDesc?.meta || null;
        const path = String(entityDesc?.path || meta?.path || context?.path || "").trim();
        if (!path) {
            showError("Path is missing");
            return;
        }
        const opener = context?.viewMaker || getSpeedDialViewOpener();
        const isDirectory = path.endsWith("/") || entityDesc?.kind === "directory" || meta?.kind === "directory";
        if (isDirectory) {
            await opener?.("explorer", { path, initialPath: path } as any);
            return;
        }
        if (/\.(md|markdown|txt)$/i.test(path) || (entityDesc?.type && String(entityDesc.type).startsWith("text/"))) {
            await opener?.("viewer", { src: path, path } as any);
            return;
        }
        if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(path)) {
            await opener?.("viewer", { src: path, path } as any);
            return;
        }
        // fallback: explorer parent
        await opener?.("explorer", { path, initialPath: path } as any);
    });

    for (const shortcut of NAVIGATION_SHORTCUTS) {
        const actionId = `open-view-${shortcut.view}`;
        if (!iconsPerAction.has(actionId)) iconsPerAction.set(actionId, shortcut.icon);
        if (!labelsPerAction.has(actionId)) labelsPerAction.set(actionId, () => `Open ${shortcut.label}`);
        if (!actionRegistry.has(actionId)) {
            actionRegistry.set(actionId, async (context: any) => {
                return actionRegistry.get("open-view")?.(context, {
                    label: shortcut.label,
                    type: shortcut.view,
                    view: shortcut.view,
                    DIR: "/"
                });
            });
        }
    }

    /*
     * WHY: `NAVIGATION_SHORTCUTS` registers `open-view-viewer` only; persisted grids / older builds used
     * `open-view-markdown` or `open-view-reader`. Re-map to canonical `viewer` (markdown-view module).
     */
    const viewerAliasActions: Array<{ alias: string; label: string }> = [
        { alias: "markdown", label: "Markdown" },
        { alias: "reader", label: "Markdown" }
    ];
    for (const { alias, label } of viewerAliasActions) {
        const actionId = `open-view-${alias}`;
        if (actionRegistry.has(actionId)) continue;
        iconsPerAction.set(actionId, "article");
        labelsPerAction.set(actionId, () => `Open ${label}`);
        actionRegistry.set(actionId, async (context: any) => {
            return actionRegistry.get("open-view")?.(context, {
                label,
                type: MARKDOWN_VIEW_MANAGED_WINDOW_KEY,
                view: MARKDOWN_VIEW_MANAGED_WINDOW_KEY,
                DIR: "/"
            });
        });
    }
};

/** Override or add a launcher action (e.g. host-specific). */
export function registerSpeedDialAction(id: string, handler: SpeedDialActionHandler): void {
    installBuiltins();
    actionRegistry.set(id, handler);
}

export function getSpeedDialActionRegistry(): Map<string, SpeedDialActionHandler> {
    installBuiltins();
    return actionRegistry;
}

export function getSpeedDialActionLabels(): Map<string, (entityDesc: any) => string> {
    installBuiltins();
    return labelsPerAction;
}

export function getSpeedDialActionIcons(): Map<string, string> {
    installBuiltins();
    return iconsPerAction;
}
