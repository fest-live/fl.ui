/*
 * Filename: widgets.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/widgets.ts
 * Change date and time: 18.52.00_03.09.2026
 * Reason for changes: Heal widget action/span; reuse clock/search nodes across CRX remounts.
 * FIND:speed-dial-widgets
 */

import {
    defaultWidgetSpan,
    getItemSpan,
    getSpeedDialMeta,
    persistSpeedDialItems,
    persistSpeedDialMeta,
    setItemSpan,
    speedDialItems,
    type SpeedDialItem
} from "./launcher-state";
import { logicalToVisualSpan, normalizeOrient, normalizeSpan, type GridSpan } from "./layout";
import { isTilesLocked } from "./tiles-lock";

export type SpeedDialWidgetKind = "clock" | "search" | "android";

export type AndroidWidgetProvider = {
    provider: string;
    packageName: string;
    className?: string;
    label: string;
    spanCols: number;
    spanRows: number;
    preview?: string;
};

export type AndroidWidgetBindResult = AndroidWidgetProvider & { widgetId: number };

export type AndroidWidgetBox = {
    widgetId: number;
    x: number;
    y: number;
    w: number;
    h: number;
    dpr?: number;
};

export type AndroidWidgetBridge = {
    widgetList: (query?: string) => Promise<AndroidWidgetProvider[]>;
    widgetBind: (provider: string) => Promise<AndroidWidgetBindResult | null>;
    widgetAttach: (box: AndroidWidgetBox) => Promise<boolean>;
    widgetLayout?: (box: AndroidWidgetBox) => Promise<boolean>;
    widgetDetach?: (widgetId: number) => Promise<boolean>;
    widgetDelete?: (widgetId: number) => Promise<boolean>;
    widgetHideAll?: () => Promise<boolean>;
    widgetConfigure?: (widgetId: number) => Promise<boolean>;
};

export type WidgetPickResult =
    | { kind: "clock" | "search" }
    | { kind: "android"; bound: AndroidWidgetBindResult };

let androidBridge: AndroidWidgetBridge | null = null;

export const setAndroidWidgetBridge = (api: AndroidWidgetBridge | null): void => {
    androidBridge = api;
};

export const hasAndroidWidgetBridge = (): boolean => {
    if (androidBridge) return true;
    try {
        const c = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        return typeof c?.isNativePlatform === "function" && c.isNativePlatform();
    } catch {
        return false;
    }
};

const VALID_WIDGET_KINDS = new Set<SpeedDialWidgetKind>(["clock", "search", "android"]);

const asWidgetKind = (value: unknown): SpeedDialWidgetKind | "" => {
    const kind = String(value || "").toLowerCase();
    return VALID_WIDGET_KINDS.has(kind as SpeedDialWidgetKind) ? (kind as SpeedDialWidgetKind) : "";
};

/** True when the tile is a widget — `item.action` wins over a stale `meta.action`. */
export const isSpeedDialWidgetItem = (item?: SpeedDialItem | null): boolean => {
    if (!item?.id) return false;
    const meta = getSpeedDialMeta(item.id);
    const itemAction = String(item.action || "").toLowerCase();
    const metaAction = String(meta?.action || "").toLowerCase();
    if (itemAction === "widget" || metaAction === "widget") return true;
    const kind = asWidgetKind(meta?.widgetKind);
    /* WHY: Properties stamped `widgetKind: clock` on shortcuts — clock alone is not proof. */
    return kind === "search" || kind === "android";
};

export const getSpeedDialWidgetKind = (item: SpeedDialItem): SpeedDialWidgetKind | "" => {
    if (!isSpeedDialWidgetItem(item)) return "";
    const meta = getSpeedDialMeta(item.id);
    return asWidgetKind(meta?.widgetKind) || "clock";
};

/** Properties used to stamp `widgetKind: clock` on every save — drop that on shortcuts. */
export const stripStaleWidgetMetaFromShortcuts = (): boolean => {
    let metaChanged = false;
    let itemsChanged = false;
    for (const item of speedDialItems || []) {
        if (!item?.id) continue;
        const meta = getSpeedDialMeta(item.id);
        if (!meta) continue;
        if (isSpeedDialWidgetItem(item)) {
            if (String(item.action || "").toLowerCase() !== "widget") {
                item.action = "widget";
                itemsChanged = true;
            }
            if (String(meta.action || "").toLowerCase() !== "widget") {
                meta.action = "widget";
                metaChanged = true;
            }
            if (!asWidgetKind(meta.widgetKind)) {
                meta.widgetKind = "clock";
                metaChanged = true;
            }
            continue;
        }
        const stampedKind = asWidgetKind(meta.widgetKind);
        if (stampedKind) {
            const [dc, dr] = defaultWidgetSpan(stampedKind);
            delete meta.widgetKind;
            metaChanged = true;
            const cols = Number(meta.spanCols);
            const rows = Number(meta.spanRows);
            /* WHY: only unwind the Properties default span — do not smash user 2×N icon tiles. */
            if (cols === dc && rows === dr) {
                meta.spanCols = 1;
                meta.spanRows = 1;
            }
        }
    }
    if (itemsChanged) persistSpeedDialItems();
    if (metaChanged) persistSpeedDialMeta();
    return metaChanged || itemsChanged;
};

export const getAndroidWidgetId = (item: SpeedDialItem): number => {
    const meta = getSpeedDialMeta(item.id) as { androidWidgetId?: unknown } | null;
    return Math.max(0, Number(meta?.androidWidgetId) || 0);
};

const pad = (n: number): string => String(n).padStart(2, "0");

export const formatWidgetClock = (
    now = new Date(),
    format: string = "24h"
): { time: string; date: string } => {
    const use12 = String(format || "").toLowerCase() === "12h";
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    let suffix = "";
    if (use12) {
        suffix = hours >= 12 ? " PM" : " AM";
        hours = hours % 12 || 12;
    }
    const time = `${use12 ? String(hours) : pad(hours)}:${minutes}${suffix}`;
    const date = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    return { time, date };
};

export const runWidgetSearch = (query: string, template?: string): void => {
    const q = String(query || "").trim();
    if (!q) return;
    const raw = String(template || "").trim();
    const href = raw
        ? raw.includes("%s")
            ? raw.replace("%s", encodeURIComponent(q))
            : `${raw}${raw.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}`
        : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    try {
        const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        if (typeof cap?.isNativePlatform === "function" && cap.isNativePlatform()) {
            window.open(href, "_blank");
            return;
        }
    } catch {
        /* ignore */
    }
    window.open(href, "_blank", "noopener,noreferrer");
};

const ensureWidgetChrome = (el: HTMLElement): void => {
    /* WHY: desktop/CRX need a dedicated grab strip — clock text and search input are poor hit targets. */
    if (!el.querySelector(".sd-widget-chrome")) {
        const chrome = document.createElement("div");
        chrome.className = "sd-widget-chrome";
        chrome.title = "Move widget";
        el.append(chrome);
    }
    if (!el.querySelector(".sd-widget-resize")) {
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className = "sd-widget-resize";
        handle.title = "Resize widget";
        handle.setAttribute("aria-label", "Resize widget");
        handle.addEventListener("pointerdown", (ev) => ev.stopPropagation());
        el.append(handle);
    }
};

type CachedWidgetNode = { kind: SpeedDialWidgetKind; node: HTMLElement; stop?: () => void };

const widgetNodeCache = (): Map<string, CachedWidgetNode> => {
    const g = globalThis as Record<string, Map<string, CachedWidgetNode> | undefined>;
    if (!(g.__CWSP_SD_WIDGET_NODES_V1__ instanceof Map)) {
        g.__CWSP_SD_WIDGET_NODES_V1__ = new Map();
    }
    return g.__CWSP_SD_WIDGET_NODES_V1__;
};

type CachedWidgetHost = { kind: SpeedDialWidgetKind; host: HTMLElement };

const widgetHostCache = (): Map<string, CachedWidgetHost> => {
    const g = globalThis as Record<string, Map<string, CachedWidgetHost> | undefined>;
    if (!(g.__CWSP_SD_WIDGET_HOSTS_V1__ instanceof Map)) {
        g.__CWSP_SD_WIDGET_HOSTS_V1__ = new Map();
    }
    return g.__CWSP_SD_WIDGET_HOSTS_V1__;
};

export const disposeWidgetNode = (id?: string | null): void => {
    const key = String(id || "").trim();
    if (!key) return;
    const prev = widgetNodeCache().get(key);
    prev?.stop?.();
    widgetNodeCache().delete(key);
    widgetHostCache().delete(key);
};

/** Reuse a disconnected host only — never steal a node still in a live Mapped grid. */
export const reuseWidgetHost = (
    id: string,
    kind: SpeedDialWidgetKind
): HTMLElement | null => {
    const prev = widgetHostCache().get(id);
    if (!prev || prev.kind !== kind) return null;
    if (prev.host.isConnected) return null;
    return prev.host;
};

export const rememberWidgetHost = (
    id: string,
    kind: SpeedDialWidgetKind,
    host: HTMLElement
): void => {
    if (!id || !(host instanceof HTMLElement)) return;
    widgetHostCache().set(id, { kind, host });
};

export const createClockWidgetNode = (item?: SpeedDialItem): HTMLElement => {
    const el = document.createElement("div");
    el.className = "sd-widget sd-widget--clock";
    el.setAttribute("data-widget", "clock");
    const time = document.createElement("div");
    time.className = "sd-widget__time";
    const date = document.createElement("div");
    date.className = "sd-widget__date";
    const paint = (): void => {
        const format = String(getSpeedDialMeta(item?.id)?.clockFormat || "24h");
        const now = formatWidgetClock(new Date(), format);
        time.textContent = now.time;
        date.textContent = now.date;
    };
    paint();
    /* WHY: 15s ticks freeze the minute (status bar 18:09 vs widget 18:00). */
    const timer = window.setInterval(paint, 1_000);
    el.append(time, date);
    const stop = (): void => clearInterval(timer);
    (el as HTMLElement & { __cwspClockStop?: () => void }).__cwspClockStop = stop;
    return el;
};

export const createSearchWidgetNode = (item?: SpeedDialItem): HTMLElement => {
    const el = document.createElement("form");
    el.className = "sd-widget sd-widget--search";
    el.setAttribute("data-widget", "search");
    const input = document.createElement("input");
    input.type = "search";
    input.className = "sd-widget__search";
    input.placeholder = "Search";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Search");
    el.addEventListener("submit", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        runWidgetSearch(input.value, String(getSpeedDialMeta(item?.id)?.searchUrl || ""));
    });
    /* WHY: only the field eats the pointer — the tile must stay draggable. */
    input.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    el.append(input);
    return el;
};

export const createAndroidWidgetNode = (item: SpeedDialItem): HTMLElement => {
    const meta = getSpeedDialMeta(item.id) as { iconUrl?: string; preview?: string } | null;
    const el = document.createElement("div");
    el.className = "sd-widget sd-widget--android";
    el.setAttribute("data-widget", "android");
    el.setAttribute("data-android-widget", String(getAndroidWidgetId(item) || ""));
    const preview = String(meta?.iconUrl || meta?.preview || "").trim();
    if (preview) {
        const img = document.createElement("img");
        img.className = "sd-widget__preview";
        img.alt = "";
        img.src = preview;
        el.append(img);
    }
    return el;
};

export const createWidgetNode = (kind: SpeedDialWidgetKind, item?: SpeedDialItem): HTMLElement => {
    const id = String(item?.id || "").trim();
    const cache = widgetNodeCache();
    if (id) {
        const prev = cache.get(id);
        if (prev && prev.kind === kind) return prev.node;
        prev?.stop?.();
        cache.delete(id);
    }
    const node =
        kind === "search"
            ? createSearchWidgetNode(item)
            : kind === "android" && item
              ? createAndroidWidgetNode(item)
              : createClockWidgetNode(item);
    const stop = (node as HTMLElement & { __cwspClockStop?: () => void }).__cwspClockStop;
    if (id) cache.set(id, { kind, node, stop });
    return node;
};

export const decorateWidgetHost = (host: HTMLElement, _kind: SpeedDialWidgetKind): void => {
    ensureWidgetChrome(host);
    host.dataset.widgetChromeBound = "1";
};

export const bindWidgetResize = (
    host: HTMLElement,
    item: SpeedDialItem,
    hooks: { refresh: () => void }
): void => {
    if (host.dataset.widgetResizeBound === "1") return;
    const handle = host.querySelector<HTMLElement>(".sd-widget-resize");
    if (!handle) return;
    host.dataset.widgetResizeBound = "1";
    let pointerId: number | null = null;
    let start: { x: number; y: number; span: GridSpan; cellW: number; cellH: number } | null = null;

    const readVisualCellSize = (): { cellW: number; cellH: number } => {
        const rect = host.getBoundingClientRect();
        const cs = getComputedStyle(host);
        const [sx, sy] = normalizeSpan([
            Number(host.style.getPropertyValue("--cell-span-x") || cs.getPropertyValue("--cell-span-x")) || 1,
            Number(host.style.getPropertyValue("--cell-span-y") || cs.getPropertyValue("--cell-span-y")) || 1
        ]);
        return {
            cellW: Math.max(16, rect.width / sx),
            cellH: Math.max(16, rect.height / sy)
        };
    };

    handle.addEventListener("pointerdown", (ev) => {
        if (ev.button !== 0 || isTilesLocked()) return;
        ev.preventDefault();
        ev.stopPropagation();
        pointerId = ev.pointerId;
        handle.setPointerCapture?.(ev.pointerId);
        const meta = getSpeedDialMeta(item.id);
        const size = readVisualCellSize();
        start = {
            x: ev.clientX,
            y: ev.clientY,
            span: getItemSpan(item.id),
            cellW: size.cellW,
            cellH: size.cellH
        };
        host.dataset.resizing = "1";
        if (meta) {
            /* seed so getItemSpan has explicit values while dragging */
            meta.spanCols = start.span[0];
            meta.spanRows = start.span[1];
        }
    });

    handle.addEventListener("pointermove", (ev) => {
        if (pointerId !== ev.pointerId || !start) return;
        ev.preventDefault();
        ev.stopPropagation();
        const root = host.closest<HTMLElement>(".speed-dial-root");
        const orient = normalizeOrient(root?.dataset.orient || root?.style.getPropertyValue("--orient"));
        const [visX0, visY0] = logicalToVisualSpan(start.span, orient);
        const nextVisX = Math.max(1, Math.min(8, visX0 + Math.round((ev.clientX - start.x) / start.cellW)));
        const nextVisY = Math.max(1, Math.min(8, visY0 + Math.round((ev.clientY - start.y) / start.cellH)));
        const [cols, rows] = logicalToVisualSpan([nextVisX, nextVisY], orient);
        const current = getItemSpan(item.id);
        if (current[0] === cols && current[1] === rows) return;
        setItemSpan(item.id, [cols, rows]);
        hooks.refresh();
    });

    const endResize = (ev: PointerEvent): void => {
        if (pointerId !== ev.pointerId) return;
        pointerId = null;
        start = null;
        delete host.dataset.resizing;
        handle.releasePointerCapture?.(ev.pointerId);
        persistSpeedDialMeta();
        hooks.refresh();
    };
    handle.addEventListener("pointerup", endResize);
    handle.addEventListener("pointercancel", endResize);
};

export const releaseAndroidWidget = (item: SpeedDialItem): void => {
    const id = getAndroidWidgetId(item);
    if (!id || !androidBridge?.widgetDelete) return;
    void androidBridge.widgetDelete(id);
};

const boxFromElement = (widgetId: number, el: HTMLElement): AndroidWidgetBox => {
    const rect = el.getBoundingClientRect();
    return {
        widgetId,
        x: rect.left,
        y: rect.top,
        w: Math.max(8, rect.width),
        h: Math.max(8, rect.height),
        dpr: Number(window.devicePixelRatio) || 1
    };
};

export const syncAndroidWidgetHosts = (root?: HTMLElement | null): void => {
    if (!androidBridge) return;
    const host = root || document.getElementById("home");
    if (!host) return;
    host.querySelectorAll<HTMLElement>('[data-speed-dial-item][data-widget="android"][data-layer="icons"]').forEach(
        (node) => {
            const item = (speedDialItems || []).find((it) => it?.id === node.dataset.id);
            if (!item) return;
            const widgetId = getAndroidWidgetId(item);
            if (!widgetId) return;
            const box = boxFromElement(widgetId, node);
            void androidBridge!.widgetAttach(box);
        }
    );
    /*
     * WHY: do not detach ids missing from this page — other workspace sides
     * still own those AppWidget ids. hideAll() parks them GONE until return.
     */
};

export const hideAndroidWidgetHosts = (): void => {
    void androidBridge?.widgetHideAll?.();
};

const closeDialog = (dialog: HTMLDialogElement): void => {
    try {
        dialog.close();
    } catch {
        /* ignore */
    }
    dialog.remove();
};

const showProviderPicker = async (): Promise<AndroidWidgetBindResult | null> => {
    if (!androidBridge?.widgetList || !androidBridge.widgetBind) return null;
    let providers: AndroidWidgetProvider[] = [];
    try {
        providers = await androidBridge.widgetList();
    } catch (e) {
        console.warn("[widgets] list failed", e);
        return null;
    }
    if (!providers.length) return null;

    return new Promise((resolve) => {
        const dialog = document.createElement("dialog");
        dialog.className = "sd-widget-picker";
        const title = document.createElement("h3");
        title.textContent = "Android widgets";
        const list = document.createElement("div");
        list.className = "sd-widget-picker__list";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "btn";
        cancel.textContent = "Cancel";
        const finish = (value: AndroidWidgetBindResult | null): void => {
            closeDialog(dialog);
            resolve(value);
        };
        cancel.addEventListener("click", () => finish(null));
        for (const provider of providers) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "sd-widget-picker__item";
            const size = `${provider.spanCols}×${provider.spanRows}`;
            btn.innerHTML = provider.preview
                ? `<img alt="" src="${provider.preview}" /><span>${provider.label} · ${size}</span>`
                : `<span>${provider.label} · ${size}</span>`;
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                try {
                    const bound = await androidBridge!.widgetBind(provider.provider);
                    finish(bound);
                } catch (e) {
                    console.warn("[widgets] bind failed", e);
                    finish(null);
                }
            });
            list.append(btn);
        }
        dialog.append(title, list, cancel);
        document.body.append(dialog);
        try {
            dialog.showModal();
        } catch {
            finish(null);
        }
    });
};

/** Clock / Search on CRX + web; Android list on Capacitor. */
export const openWidgetPicker = async (): Promise<WidgetPickResult | null> =>
    new Promise((resolve) => {
        const dialog = document.createElement("dialog");
        dialog.className = "sd-widget-picker";
        const title = document.createElement("h3");
        title.textContent = "Add widget";
        const list = document.createElement("div");
        list.className = "sd-widget-picker__list";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "btn";
        cancel.textContent = "Cancel";
        const finish = (value: WidgetPickResult | null): void => {
            closeDialog(dialog);
            resolve(value);
        };
        cancel.addEventListener("click", () => finish(null));
        const builtins: Array<{ kind: "clock" | "search"; label: string }> = [
            { kind: "clock", label: "Clock · 2×1" },
            { kind: "search", label: "Search · 2×1" }
        ];
        for (const entry of builtins) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "sd-widget-picker__item";
            btn.textContent = entry.label;
            btn.addEventListener("click", () => finish({ kind: entry.kind }));
            list.append(btn);
        }
        if (hasAndroidWidgetBridge() && androidBridge?.widgetList) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "sd-widget-picker__item";
            btn.textContent = "Android widgets…";
            btn.addEventListener("click", async () => {
                closeDialog(dialog);
                const bound = await showProviderPicker();
                resolve(bound ? { kind: "android", bound } : null);
            });
            list.append(btn);
        }
        dialog.append(title, list, cancel);
        document.body.append(dialog);
        try {
            dialog.showModal();
        } catch {
            finish(null);
        }
    });

export const openAndroidWidgetPicker = async (): Promise<AndroidWidgetBindResult | null> =>
    showProviderPicker();
