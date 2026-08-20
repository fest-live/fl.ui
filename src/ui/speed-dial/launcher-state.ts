/*
 * Filename: launcher-state.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/launcher-state.ts
 * Change date and time: 09.35.00_19.08.2026
 * Reason for changes: Workspace settings apply grid/shape/default action via cwsp:workspace-grid.
 *
 * Speed-dial / launcher persistence for fl.ui only (no core).
 * Storage keys match CWSP-shell `StateStorage` so shells sharing one origin keep one grid.
 */

import { JSOX } from "jsox";
import { makeObjectAssignable, observe, stringRef, safe } from "@fest-lib/object";
import { relocateItemsToLayout, normalizeOrient, pointToLogicalCell } from "./layout.ts";
import { decodeDesktopState, loadDesktopRaw, makeUIState, saveUIState } from "@fest-lib/lure";
import {
    createOpfsLinkStoreIo,
    migrateLocalStorageToOpfsIfNeeded,
    readLinkStore,
    writeLinkStore,
    packLinksFromSpeedDial,
    mergeMetaFile,
    buildMirrorSpeedDialItems,
    LS_ITEMS_KEY,
    LS_META_KEY,
    LS_MIGRATED_KEY,
    type LinkStoreIo,
    type LinkStoreItem,
    type LinkStoreMetaFile,
    type MirrorSpeedDialItem
} from "./link-store.ts";
/*
 * WHY (final review #1/#5): import PathRouter via the `fl-ui/explorer/path-router`
 * package alias instead of the relative `../explorer/path-router.ts`. fl.ui is
 * hardlinked into several host trees (e.g. `modules/views/home-view/src/ts/`),
 * where the relative path resolves to a non-existent `../explorer/…` folder.
 * The `fl-ui/*` alias is declared in both fl.ui's and CRX's tsconfig and maps
 * to the canonical `modules/projects/fl.ui/src/ui/*` tree, so every host
 * (CRX boot, Explorer, SpeedDial, hardlinked copies) resolves to ONE module
 * instance — no dual PathRouter registry.
 */
import { resolveFsBackend, subscribeFsBackendRegister } from "#fl-ui/explorer/path-router";

/*
 * WHY: fl.ui must stay standalone — it cannot import `core/routing/core/views`
 * (that module only exists inside CWSP-shell / CrossWord hosts). Hosts may
 * register a build-time view enablement check; when none is registered we
 * allow every view so the speed-dial grid renders identically in isolation.
 */
type ViewEnabledCheck = (view: string) => boolean;
let viewEnabledCheck: ViewEnabledCheck | null = null;
/** Hosts (CWSP/CrossWord) may register build-time view enablement. Default: allow all. */
export function setSpeedDialViewEnabledCheck(fn: ViewEnabledCheck | null): void {
    viewEnabledCheck = typeof fn === "function" ? fn : null;
}
const isEnabledView = (view: string): boolean =>
    viewEnabledCheck ? viewEnabledCheck(String(view || "").trim()) : true;

export type GridCell = [number, number];

export interface SpeedDialItemMeta {
    action?: string;
    view?: string;
    href?: string;
    description?: string;
    shape?: string;
    /**
     * Icon presentation:
     * - `glyph` — Phosphor name in `item.icon`
     * - `masked` / `masked-inverse` / `colored` — resource in `iconUrl` (URL / data / blob)
     */
    iconDisplay?: string;
    /** Resource for masked / masked-inverse / colored (URL, data:, blob:). */
    iconUrl?: string;
    /**
     * Open destination:
     * - `native-window` — new browser window / mono native immersive
     * - `inline` — in-session floating window (same browser tab)
     * - `new-tab` — new browser tab (http/https/www and app deep links)
     */
    openLinkTarget?: OpenLinkTarget | string;
    /** Android package id for `launch-app` tiles (launcher SKU). */
    packageName?: string;
    /** Android activity component for `launch-app` tiles. */
    componentName?: string;
    /** Launcher icon cache key (matches AppMenu / launcher-bridge). */
    iconCacheKey?: string;
    /** e.g. `android-app` for launcher shortcuts. */
    entityType?: string;
    tags?: string[];
    [key: string]: any;
}

/**
 * How Open link / Open opens a destination.
 * - `native-window` — new **PWA app window** when installed (`?native=1`); else detached window
 * - `inline` — same tab, floating `ui-window` in the current environment shell
 * - `new-tab` — ordinary browser **tab** (`target=_blank`) for http(s)/www or app URL
 * COMPAT: persisted `in-shell` → `inline`. Literal `new-tab` is the browser-tab mode again.
 */
export type OpenLinkTarget = "native-window" | "inline" | "new-tab";

const OPEN_LINK_TARGET_KEY = "rs-open-link-target";

export const normalizeOpenLinkTarget = (raw: unknown): OpenLinkTarget => {
    const v = String(raw || "").trim().toLowerCase();
    /* WHY: empty/unknown → inline (same-tab env window); native only when explicit. */
    if (!v) return "inline";
    if (v === "inline" || v === "in-shell" || v === "env" || v === "shell") {
        return "inline";
    }
    if (
        v === "new-tab" ||
        v === "newtab" ||
        v === "tab" ||
        v === "browser" ||
        v === "browser-tab" ||
        v === "external-tab"
    ) {
        return "new-tab";
    }
    if (v === "native-window" || v === "native" || v === "window" || v === "app-window") {
        return "native-window";
    }
    return "inline";
};

/** True for http(s), protocol-relative, or bare `www.` hosts (not app view paths). */
export const isExternalWebHref = (raw: unknown): boolean => {
    const s = String(raw || "").trim();
    if (!s || /^(mailto:|blob:|data:|javascript:)/i.test(s)) return false;
    if (/^https?:\/\//i.test(s) || /^\/\//.test(s)) return true;
    if (/^www\./i.test(s)) return true;
    /* Bare host.tld[/…] — not a single view token like `settings`. */
    if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/:?#]|$)/i.test(s) && !s.startsWith("/") && !s.startsWith("#")) {
        return true;
    }
    return false;
};

/** Normalize `www…` / `//…` / bare host into an absolute http(s) URL. */
export const normalizeExternalWebHref = (raw: unknown): string => {
    const s = String(raw || "").trim();
    if (!s) return "";
    try {
        if (/^https?:\/\//i.test(s)) return new URL(s).href;
        if (/^\/\//.test(s)) return new URL(`https:${s}`).href;
        if (/^www\./i.test(s) || /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/:?#]|$)/i.test(s)) {
            return new URL(`https://${s.replace(/^\/+/, "")}`).href;
        }
    } catch {
        return "";
    }
    return "";
};

/** Global default (Settings / localStorage); per-tile meta.openLinkTarget wins. */
export const getDefaultOpenLinkTarget = (): OpenLinkTarget => {
    try {
        const stored = localStorage.getItem(OPEN_LINK_TARGET_KEY);
        if (stored == null || !String(stored).trim()) return "inline";
        return normalizeOpenLinkTarget(stored);
    } catch {
        return "inline";
    }
};

export const setDefaultOpenLinkTarget = (target: OpenLinkTarget): void => {
    try {
        localStorage.setItem(OPEN_LINK_TARGET_KEY, normalizeOpenLinkTarget(target));
    } catch {
        /* private mode */
    }
};

export const resolveItemOpenLinkTarget = (meta?: SpeedDialItemMeta | null): OpenLinkTarget => {
    if (meta?.openLinkTarget != null && String(meta.openLinkTarget).trim()) {
        return normalizeOpenLinkTarget(meta.openLinkTarget);
    }
    /* WHY: http(s)/www tiles default to a browser tab, not mono native app chrome. */
    if (isExternalWebHref(meta?.href)) return "new-tab";
    return getDefaultOpenLinkTarget();
};

export interface SpeedDialPersistedItem {
    id: string;
    /** Runtime uses observe([x,y]); packed storage uses a plain `[x,y]` tuple. */
    cell: GridCell | ReturnType<typeof observe<GridCell>>;
    icon: string;
    label: string;
    action: string;
    meta?: SpeedDialItemMeta;
}

type SpeedDialRecord = Omit<SpeedDialPersistedItem, "meta">;

export interface SpeedDialItem {
    id: string;
    cell: ReturnType<typeof observe>;
    icon: ReturnType<typeof stringRef>;
    label: ReturnType<typeof stringRef>;
    action: string;
}

const NAVIGATION_SHORTCUTS_ALL = [
    { view: "home", label: "Home", icon: "house-line" },
    { view: "network", label: "Network", icon: "wifi-high" },
    { view: "viewer", label: "Markdown", icon: "article" },
    { view: "explorer", label: "Explorer", icon: "books" },
    { view: "workcenter", label: "Work Center", icon: "briefcase" },
    { view: "history", label: "History", icon: "clock-counter-clockwise" },
    { view: "settings", label: "Settings", icon: "gear-six" }
] as const;

/** WHY: document PWA disables Network at build time — hide it from add-shortcut menus too. */
export const NAVIGATION_SHORTCUTS = NAVIGATION_SHORTCUTS_ALL.filter((shortcut) =>
    isEnabledView(shortcut.view)
);

const STORAGE_KEY = "cw::workspace::speed-dial";
const META_STORAGE_KEY = `${STORAGE_KEY}::meta`;

const fallbackClone = <T>(value: T): T => {
    if (typeof structuredClone === "function") {
        try {
            return structuredClone(safe(value));
        } catch {
            /* proxies / non-cloneable */
        }
    }
    try {
        return JSON.parse(JSON.stringify(safe(value) as any)) as T;
    } catch {
        return value;
    }
};

const generateItemId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `sd-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000)}`;
};

const EXTERNAL_SHORTCUTS: SpeedDialPersistedItem[] = [
    /*
     * WHY: Out-of-box tiles for sibling VDS host apps (manifest hosts).
     * INVARIANT: `.md` → md.u2re.space (CWSP-document); `.cwsp` → cwsp.u2re.space (CWSP-transfer).
     * ensureExternalShortcuts() merges these into persisted grids on next load.
     */
];

const DEFAULT_SPEED_DIAL_DATA_ALL: SpeedDialPersistedItem[] = [
    {
        id: "shortcut-explorer",
        cell: observe([2, 0]),
        icon: "books",
        label: "Explorer",
        action: "open-view",
        meta: { view: "explorer" }
    },
    {
        id: "shortcut-settings",
        cell: observe([3, 0]),
        icon: "gear-six",
        label: "Settings",
        action: "open-view",
        meta: { view: "settings" }
    },
    {
        id: "shortcut-viewer",
        cell: observe([1, 0]),
        icon: "article",
        label: "Markdown",
        action: "open-view",
        meta: { view: "viewer" }
    },
    ...EXTERNAL_SHORTCUTS
];

/** Drop view shortcuts that this host build disabled (e.g. Network on CWSP-document). */
const isSpeedDialViewAllowed = (
    meta?: SpeedDialItemMeta,
    id?: string
): boolean => {
    if (id === "shortcut-network" && !isEnabledView("network")) return false;
    const view = String(meta?.view || "").trim();
    if (!view) return true;
    return isEnabledView(view);
};

const DEFAULT_SPEED_DIAL_DATA: SpeedDialPersistedItem[] = DEFAULT_SPEED_DIAL_DATA_ALL.filter((entry) =>
    isSpeedDialViewAllowed(entry.meta, entry.id)
);

const splitDefaultEntries = (entries: SpeedDialPersistedItem[]) => {
    const records: SpeedDialRecord[] = [];
    const metaEntries: Array<[string, SpeedDialItemMeta]> = [];
    entries.forEach((entry) => {
        const { meta, ...record } = entry;
        records.push(record as SpeedDialRecord);
        const normalizedMeta: SpeedDialItemMeta = { action: entry.action, ...(meta || {}) };
        metaEntries.push([entry.id, normalizedMeta]);
    });
    return { records, metaEntries };
};

const { records: DEFAULT_SPEED_DIAL_RECORDS, metaEntries: DEFAULT_META_ENTRIES } = splitDefaultEntries(DEFAULT_SPEED_DIAL_DATA);
const legacyMetaBuffer: Array<[string, SpeedDialItemMeta]> = [];

const ensureCell = (cell?: ReturnType<typeof observe<GridCell>>): ReturnType<typeof observe<GridCell>> => {
    if (cell && Array.isArray(cell) && cell.length >= 2) {
        return observe([Number(cell[0]) || 0, Number(cell[1]) || 0]);
    }
    return observe([0, 0]);
};

const createMetaState = (meta: SpeedDialItemMeta = {}) => {
    return makeObjectAssignable(observe({
        action: meta.action || "open-view",
        view: meta.view || "",
        href: meta.href || "",
        description: meta.description || "",
        entityType: meta.entityType || "",
        tags: Array.isArray(meta.tags) ? [...meta.tags] : [],
        ...meta
    }));
};

export type SpeedDialMetaEntry = ReturnType<typeof createMetaState>;
export type SpeedDialMetaRegistry = Map<string, SpeedDialMetaEntry>;

const registryFromEntries = (entries: Iterable<[string, SpeedDialItemMeta]>) => {
    const registry = new Map<string, SpeedDialMetaEntry>();
    for (const [id, meta] of entries) {
        registry.set(id, createMetaState(meta));
    }
    return registry as SpeedDialMetaRegistry;
};

const normalizeMetaEntries = (raw?: any): Array<[string, SpeedDialItemMeta]> => {
    if (!raw) return [];
    if (raw instanceof Map) {
        return Array.from(raw.entries());
    }
    if (Array.isArray(raw)) {
        return raw
            .map((entry: any) => {
                if (entry && typeof entry === "object" && "id" in entry) {
                    return [entry.id, (entry.meta || entry) as SpeedDialItemMeta] as [string, SpeedDialItemMeta];
                }
                return null;
            })
            .filter(Boolean) as Array<[string, SpeedDialItemMeta]>;
    }
    if (typeof raw === "object") {
        return Object.entries(raw as Record<string, SpeedDialItemMeta>) as Array<[string, SpeedDialItemMeta]>;
    }
    return [];
};

const packMetaRegistry = (registry: SpeedDialMetaRegistry) => {
    const payload: Record<string, SpeedDialItemMeta> = {};
    registry?.forEach((meta, id) => {
        payload[id] = fallbackClone(meta ?? {});
    });
    return payload;
};

const createInitialMetaRegistry = () => registryFromEntries(DEFAULT_META_ENTRIES);
const unpackMetaRegistry = (raw?: any) => {
    const entries = normalizeMetaEntries(raw);
    return registryFromEntries(entries.length ? entries : DEFAULT_META_ENTRIES);
};

const unwrapRef = (value: any, fallback?: string) => {
    if (value && typeof value === "object" && "value" in value) {
        return value.value ?? fallback;
    }
    return value ?? fallback;
};

const serializeItemState = (item: SpeedDialItem): SpeedDialRecord => {
    // WHY: pack must be plain POJO — observe proxies in storage break migrate/custom checks and roundtrips.
    return {
        id: item.id,
        cell: [Number(item.cell?.[0]) || 0, Number(item.cell?.[1]) || 0] as GridCell,
        icon: unwrapRef(item.icon, "sparkle"),
        label: unwrapRef(item.label, "Shortcut"),
        action: item.action
    };
};

const createStatefulItem = (config: SpeedDialRecord): SpeedDialItem => {
    return observe({
        id: config.id || generateItemId(),
        cell: observe(ensureCell(config.cell)),
        icon: stringRef(config.icon || "sparkle"),
        label: stringRef(config.label || "Shortcut"),
        action: config.action || "open-view"
    }) as any;
};

const createInitialState = () => observe(DEFAULT_SPEED_DIAL_RECORDS.map(createStatefulItem));
const unpackState = (raw?: SpeedDialPersistedItem[]) => {
    // WHY: strip persisted Network (etc.) tiles when this host build disabled the view.
    const source = (Array.isArray(raw) && raw.length ? raw : DEFAULT_SPEED_DIAL_DATA).filter((entry) =>
        isSpeedDialViewAllowed(entry.meta, entry.id)
    );
    const records = source.map((entry) => {
        const { meta, ...record } = entry;
        if (meta) {
            legacyMetaBuffer.push([entry.id, { action: entry.action, ...meta }]);
        } else {
            legacyMetaBuffer.push([entry.id, { action: entry.action }]);
        }
        return record as SpeedDialRecord;
    });
    return observe(records.map(createStatefulItem));
};
const packState = (collection: SpeedDialItem[]) => collection.map(serializeItemState);

/**
 * WHY: Vite `preserveSymlinks` can load this file via fl.ui and home-view paths as
 * two module graphs. Without a process singleton, idle-save from the stale copy
 * overwrites user shortcuts with defaults after refresh.
 */
const SPEED_DIAL_ITEMS_BOOT = "__CWSP_SPEED_DIAL_ITEMS_V1__";
const SPEED_DIAL_META_BOOT = "__CWSP_SPEED_DIAL_META_V1__";

const bootSpeedDialMeta = (): SpeedDialMetaRegistry => {
    const g = globalThis as any;
    if (g[SPEED_DIAL_META_BOOT]) return g[SPEED_DIAL_META_BOOT] as SpeedDialMetaRegistry;
    const state = makeUIState(META_STORAGE_KEY, createInitialMetaRegistry, unpackMetaRegistry, packMetaRegistry) as unknown as SpeedDialMetaRegistry;
    g[SPEED_DIAL_META_BOOT] = state;
    return state;
};

const bootSpeedDialItems = (): SpeedDialItem[] => {
    const g = globalThis as any;
    if (g[SPEED_DIAL_ITEMS_BOOT]) return g[SPEED_DIAL_ITEMS_BOOT] as SpeedDialItem[];
    const state = makeUIState(STORAGE_KEY, createInitialState, unpackState, packState) as unknown as SpeedDialItem[];
    g[SPEED_DIAL_ITEMS_BOOT] = state;
    return state;
};

export const speedDialMeta = bootSpeedDialMeta();
export const speedDialItems = bootSpeedDialItems();

/*
 * OPFS-first persistence (Task 2).
 *
 * WHY: localStorage is the synchronous boot source so the grid renders instantly;
 * OPFS is the durable source-of-truth. On boot we (1) create OPFS IO, (2) migrate
 * LS → OPFS once, (3) hydrate the in-memory state from OPFS when present. Persists
 * write OPFS first (debounced) and mirror LS for one release so a backup exists.
 *
 * INVARIANT: public names `speedDialItems` / `speedDialMeta` /
 * `persistSpeedDialItems` / `persistSpeedDialMeta` are unchanged. OPFS failure is
 * non-fatal — we warn and keep LS as the persistence carrier.
 */
let opfsIo: LinkStoreIo | null = null;
let opfsReady: Promise<void> | null = null;
let opfsFlushTimer: ReturnType<typeof setTimeout> | null = null;
let opfsHydrated = false;

/*
 * Task 3 — Mirror mode state.
 *
 * WHY: `mirrorPath` lives in `meta.json` (LinkStoreMetaFile), not in the
 * per-id `speedDialMeta` registry. We keep a dedicated observe ref so the
 * SpeedDial grid can react to mode toggles, and persist it back into OPFS
 * `meta.json` via `packMetaFileFromState` (and an LS backup key for the
 * non-OPFS fallback path).
 *
 * INVARIANT: `mirrorSpeedDialItems` is a display-only observe array. It is
 * rebuilt by `refreshSpeedDialMirror()` from a PathRouter listing. Curated
 * `speedDialItems` remain the editable / draggable source-of-truth; mirror
 * tiles are appended below them in the grid (see SpeedDial.ts).
 */
const MIRROR_PATH_LS_KEY = "cw::workspace::speed-dial::mirror-path";
/*
 * WHY: `observe(null)` returns `null` (primitives are not wrapped) — then
 * `mirrorPathState.value` throws. Use `stringRef("")`; empty = no mirror path.
 */
export const mirrorPathState = stringRef("");
export const mirrorSpeedDialItems = observe<MirrorSpeedDialItem[]>([]);

export const isMirrorMode = (): boolean => Boolean(String(mirrorPathState.value || "").trim());

export function getSpeedDialMirrorPath(): string | null {
    const v = String(mirrorPathState.value || "").trim();
    return v ? v : null;
}

/**
 * Persist `mirrorPath` into OPFS `meta.json` (canonical) and an LS backup key.
 * WHY: OPFS is async + durable; LS keeps the value when OPFS is unavailable
 * (private mode / quota) so the mode survives reloads on hosts without OPFS.
 */
export function setSpeedDialMirrorPath(path: string | null): void {
    const normalized = path ? String(path).trim() : "";
    if (normalized === String(mirrorPathState.value || "").trim()) return;
    markUserEditedBeforeHydrate();
    mirrorPathState.value = normalized;
    try {
        if (typeof localStorage !== "undefined") {
            if (normalized) localStorage.setItem(MIRROR_PATH_LS_KEY, normalized);
            else localStorage.removeItem(MIRROR_PATH_LS_KEY);
        }
    } catch { /* private mode */ }
    persistSpeedDialMeta();
    void refreshSpeedDialMirror();
}

/**
 * Rebuild `mirrorSpeedDialItems` from the current `mirrorPath` via PathRouter.
 *
 * WHY: SpeedDial calls this on mount and whenever the mirror path changes. If
 * no backend is registered for the path (e.g. tests without OPFS/Chrome), we
 * surface a soft warning and keep an empty listing so the grid stays usable.
 *
 * Task 3 fix: pass curated `speedDialItems` cells to `buildMirrorSpeedDialItems`
 * so mirror tiles auto-place below the curated grid's max Y instead of
 * stacking at `[0,0]`. Meta per-id `cell` overrides still win.
 */
export async function refreshSpeedDialMirror(): Promise<void> {
    const path = getSpeedDialMirrorPath();
    if (!path) {
        mirrorSpeedDialItems.splice(0, mirrorSpeedDialItems.length);
        return;
    }
    try {
        const backend = resolveFsBackend(path);
        if (!backend) {
            console.warn(`[link-store] no fs backend for mirror path: ${path}`);
            mirrorSpeedDialItems.splice(0, mirrorSpeedDialItems.length);
            return;
        }
        const listing = await backend.list(path);
        // WHY: read the current meta so per-id cell/hidden overrides apply.
        const meta = packMetaFileFromState();
        // WHY: pass curated cells so mirror tiles auto-place below the curated
        // grid extent. Each curated item exposes its `cell` as `[x,y]`.
        const curated = (speedDialItems || []).map((item) => ({
            cell: Array.isArray(item?.cell) ? (item.cell as unknown as [number, number]) : undefined
        }));
        const items = buildMirrorSpeedDialItems(listing as any, meta, path, curated);
        mirrorSpeedDialItems.splice(0, mirrorSpeedDialItems.length);
        for (const item of items) mirrorSpeedDialItems.push(item);
    } catch (e) {
        console.warn(`[link-store] mirror list failed for ${path}`, e);
        mirrorSpeedDialItems.splice(0, mirrorSpeedDialItems.length);
    }
}

/*
 * Task 3 fix (nice-to-have) — refresh mirror when a backend registers.
 *
 * WHY: `ensureDefaultFsBackends()` runs at path-router module boot, but in
 * some load orders SpeedDial may mount before the registry is populated, or a
 * CRX backend may register late. Subscribing here means a newly-registered
 * backend (for the current mirror path) triggers a re-fetch so mirror tiles
 * appear without a manual mode toggle. The listener is module-scoped and
 * never unregistered (lifetime = tab lifetime).
 */
if (typeof globalThis !== "undefined") {
    subscribeFsBackendRegister((root) => {
        const path = getSpeedDialMirrorPath();
        if (!path) return;
        // WHY: only refresh when the registered root covers the mirror path.
        if (path === root || path.startsWith(root === "/" ? "/" : root)) {
            void refreshSpeedDialMirror();
        }
    });
}
/*
 * WHY: hydrate vs mid-boot edit race. The grid renders synchronously from LS,
 * then `initLinkStore` runs async (migrate + hydrate). If a user / UI edit
 * completes, the in-memory state already reflects newer data than OPFS
 * (which was just migrated from the same LS). Letting hydrate splice OPFS
 * data back in would clobber that edit. We record the dirty signal only on
 * user-initiated mutations (add/remove/move/edit helpers), not boot/init
 * persist paths (`flushLegacyMetaBuffer`, `ensureCoreViewShortcuts`, …).
 * The scheduled OPFS flush still runs (it awaits `opfsReady`) and writes
 * the newer state to OPFS when dirty.
 */
let userEditedBeforeHydrate = false;

/** WHY: boot/init code may persist before hydrate; only user edits skip the OPFS splice. */
const markUserEditedBeforeHydrate = (): void => {
    if (!opfsHydrated) userEditedBeforeHydrate = true;
};

const getLsLike = (): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null => {
    try {
        if (typeof localStorage === "undefined") return null;
        return localStorage;
    } catch {
        return null;
    }
};

/**
 * Pack the current in-memory state into a `LinkStoreMetaFile` for OPFS.
 * WHY: cells live in `speedDialItems` (state) while href/view/shape live in
 * `speedDialMeta` (registry); OPFS `meta.json` merges both per id.
 */
const packMetaFileFromState = (): LinkStoreMetaFile => {
    const perId: Record<string, Record<string, unknown>> = {};
    speedDialMeta?.forEach((meta, id) => {
        perId[id] = fallbackClone(meta ?? {}) as Record<string, unknown>;
    });
    (speedDialItems || []).forEach((item) => {
        const id = String(item?.id || "");
        if (!id) return;
        const cell = item?.cell;
        const x = Number(Array.isArray(cell) ? cell[0] : (cell as any)?.[0]) || 0;
        const y = Number(Array.isArray(cell) ? cell[1] : (cell as any)?.[1]) || 0;
        perId[id] = { ...(perId[id] || {}), cell: [x, y] as [number, number] };
    });
    return { version: 1, mirrorPath: getSpeedDialMirrorPath(), items: perId };
};

const flushLinkStoreToOpfs = async (): Promise<void> => {
    if (!opfsIo) return;
    // WHY: wait for init (migration + hydration) so a sync-boot persist can't
    // overwrite newer OPFS data with stale LS state before hydration reads it.
    try {
        await opfsReady;
    } catch {
        return;
    }
    if (!opfsIo) return;
    try {
        const items = packLinksFromSpeedDial(speedDialItems as any);
        const meta = packMetaFileFromState();
        await writeLinkStore(opfsIo, items, meta);
    } catch (e) {
        console.warn("[link-store] OPFS write failed; localStorage remains primary", e);
    }
};

const scheduleOpfsFlush = (): void => {
    if (!opfsIo) return;
    if (opfsFlushTimer) clearTimeout(opfsFlushTimer);
    opfsFlushTimer = setTimeout(() => {
        opfsFlushTimer = null;
        void flushLinkStoreToOpfs();
    }, 150);
};

/**
 * Hydrate the in-memory state from OPFS after migration. Only runs when no
 * user edit has fired yet (module-load race window) and OPFS has data.
 *
 * WHY: if `persistSpeedDialItems` / `persistSpeedDialMeta` already ran before
 * hydrate completed, the in-memory state is newer than the just-migrated OPFS
 * snapshot. Splicing OPFS back in would clobber the edit, so we mark hydrated
 * and bail — the pending OPFS flush (awaiting `opfsReady`) will persist the
 * newer state instead.
 */
const hydrateFromOpfs = async (io: LinkStoreIo): Promise<void> => {
    if (opfsHydrated) return;
    if (userEditedBeforeHydrate) {
        // WHY: user/UI already edited the boot state; keep it, skip the splice.
        // The scheduled flush will write the newer state to OPFS.
        opfsHydrated = true;
        return;
    }
    try {
        const got = await readLinkStore(io);
        if (!got || !got.items.length) {
            opfsHydrated = true;
            return;
        }
        // WHY: re-check the dirty flag after the async read — an edit may have
        // landed while we were awaiting OPFS. If so, keep the in-memory state.
        if (userEditedBeforeHydrate) {
            opfsHydrated = true;
            return;
        }
        opfsHydrated = true;
        const nextItems: SpeedDialItem[] = [];
        const nextMeta = new Map<string, SpeedDialItemMeta>();
        for (const raw of got.items) {
            const metaEntry = got.meta.items[raw.id] || {};
            const cell = Array.isArray((metaEntry as any).cell)
                ? ([(metaEntry as any).cell[0], (metaEntry as any).cell[1]] as [number, number])
                : (Array.isArray(raw.cell)
                    ? ([raw.cell[0], raw.cell[1]] as [number, number])
                    : ([0, 0] as [number, number]));
            const item = createStatefulItem({
                id: raw.id,
                cell: observe([Number(cell[0]) || 0, Number(cell[1]) || 0]),
                icon: raw.icon || "sparkle",
                label: raw.label || "Shortcut",
                action: raw.action || "open-view"
            });
            const meta: SpeedDialItemMeta = {
                action: raw.action || "open-view",
                ...(metaEntry as any),
                ...(raw.href ? { href: raw.href } : {}),
                ...(raw.path ? { path: raw.path } : {})
            };
            nextItems.push(observe(item) as any);
            nextMeta.set(item.id, meta);
        }
        if (!nextItems.length) return;
        // WHY: never splice-to-empty first — a throw mid-loop used to persist an empty grid.
        speedDialItems.splice(0, speedDialItems.length, ...nextItems);
        speedDialMeta.clear();
        if (got.meta.mirrorPath != null) {
            mirrorPathState.value = String(got.meta.mirrorPath || "");
        }
        for (const [id, meta] of nextMeta) {
            ensureSpeedDialMeta(id, meta);
        }
    } catch (e) {
        console.warn("[link-store] OPFS hydration failed; using localStorage boot state", e);
    }
};

const initLinkStore = (): Promise<void> => {
    if (opfsReady) return opfsReady;
    opfsReady = (async () => {
        const ls = getLsLike();
        try {
            opfsIo = await createOpfsLinkStoreIo();
        } catch (e) {
            console.warn("[link-store] OPFS unavailable; using localStorage", e);
            opfsIo = null;
            return;
        }
        if (!opfsIo) return;
        try {
            if (ls) {
                await migrateLocalStorageToOpfsIfNeeded(opfsIo, ls);
            }
            await hydrateFromOpfs(opfsIo);
        } catch (e) {
            console.warn("[link-store] OPFS init failed; using localStorage boot state", e);
        }
    })();
    return opfsReady;
};

/**
 * Hosts may await this to know when OPFS migration/hydration is done. The grid
 * renders immediately from LS; this resolves after the async OPFS step.
 */
export const linkStoreReady = (): Promise<void> => initLinkStore();

/*
 * WHY: hydrate mirrorPath from the LS backup key synchronously so the grid
 * renders in mirror mode before OPFS hydration resolves (OPFS path overrides
 * this value when it lands). Then trigger the initial mirror listing fetch.
 */
if (typeof globalThis !== "undefined") {
    try {
        if (typeof localStorage !== "undefined") {
            const lsMirror = localStorage.getItem(MIRROR_PATH_LS_KEY);
            if (lsMirror && !mirrorPathState.value) mirrorPathState.value = lsMirror;
        }
    } catch { /* private mode */ }
    void initLinkStore().then(() => { void refreshSpeedDialMirror(); });
}

export const persistSpeedDialItems = () => {
    scheduleOpfsFlush();
    try {
        saveUIState(STORAGE_KEY);
        return;
    } catch { /* fall through */ }
    try {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(STORAGE_KEY, JSOX.stringify(packState(speedDialItems as any)));
    } catch { /* quota / private mode */ }
};

export const persistSpeedDialMeta = () => {
    scheduleOpfsFlush();
    try {
        saveUIState(META_STORAGE_KEY);
        return;
    } catch { /* fall through */ }
    try {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(META_STORAGE_KEY, JSOX.stringify(packMetaRegistry(speedDialMeta)));
    } catch { /* quota / private mode */ }
};

export const getSpeedDialMeta = (id?: string | null) => {
    if (!id) return null;
    return speedDialMeta?.get?.(id) ?? null;
};

export const ensureSpeedDialMeta = (id: string, defaults: SpeedDialItemMeta = {}) => {
    let meta = speedDialMeta?.get?.(id);
    if (!meta) {
        meta = createMetaState(defaults);
        speedDialMeta?.set?.(id, meta);
        persistSpeedDialMeta();
        return meta;
    }
    let changed = false;
    for (const [key, value] of Object.entries(defaults)) {
        if (value == null || value === "") continue;
        if ((meta as Record<string, unknown>)[key] !== value) {
            (meta as Record<string, unknown>)[key] = value;
            changed = true;
        }
    }
    if (changed) persistSpeedDialMeta();
    return meta;
};

export const removeSpeedDialMeta = (id: string) => {
    const removed = speedDialMeta?.delete?.(id);
    if (removed) {
        persistSpeedDialMeta();
    }
    return removed;
};

const syncMetaActionFromItem = (item?: SpeedDialItem | null) => {
    if (!item) return false;
    const desiredAction = item.action || "open-view";
    const meta = ensureSpeedDialMeta(item.id, { action: desiredAction });
    if (meta.action !== desiredAction) {
        meta.action = desiredAction;
        return true;
    }
    return false;
};

const syncMetaActionsForAllItems = () => {
    let changed = false;
    speedDialItems?.forEach?.((item) => {
        if (syncMetaActionFromItem(item)) {
            changed = true;
        }
    });
    if (changed) {
        persistSpeedDialMeta();
    }
};

const flushLegacyMetaBuffer = () => {
    if (!legacyMetaBuffer.length) return;
    legacyMetaBuffer.forEach(([id, meta]) => {
        const target = ensureSpeedDialMeta(id, meta);
        Object.assign(target, meta);
    });
    legacyMetaBuffer.length = 0;
    persistSpeedDialMeta();
};

flushLegacyMetaBuffer();
syncMetaActionsForAllItems();

const ensureExternalShortcuts = () => {
    let changed = false;
    EXTERNAL_SHORTCUTS.forEach((shortcut) => {
        const exists = speedDialItems?.find?.((item) => item?.id === shortcut.id);
        if (!exists) {
            const item = createStatefulItem(shortcut);
            if (shortcut.label && item.label && typeof item.label === "object" && "value" in item.label) {
                item.label.value = shortcut.label;
            }
            if (shortcut.icon && item.icon && typeof item.icon === "object" && "value" in item.icon) {
                item.icon.value = shortcut.icon;
            }

            speedDialItems.push(observe(item) as any);
            ensureSpeedDialMeta(item.id, shortcut.meta);
            changed = true;
        } else {
            const currentMeta = getSpeedDialMeta(shortcut.id);
            if (shortcut.meta && currentMeta) {
                const nextHref = String(shortcut.meta.href ?? "");
                if (nextHref !== String(currentMeta.href ?? "")) {
                    currentMeta.href = nextHref;
                    changed = true;
                }
                const nextDesc = String(shortcut.meta.description ?? "");
                if (nextDesc !== String(currentMeta.description ?? "")) {
                    currentMeta.description = nextDesc;
                    changed = true;
                }
            } else if (shortcut.meta && !currentMeta) {
                ensureSpeedDialMeta(shortcut.id, shortcut.meta);
                changed = true;
            }
        }
    });
    if (changed) {
        persistSpeedDialItems();
        persistSpeedDialMeta();
    }
};
ensureExternalShortcuts();

/**
 * WHY: Existing IDB/localStorage grids keep old default sets — missing core view tiles
 * (e.g. Work Center) never appear until storage is wiped. Merge by id or meta.view.
 */
const ensureCoreViewShortcuts = () => {
    const core = DEFAULT_SPEED_DIAL_DATA_ALL.filter(
        (entry) => entry.action === "open-view" && isSpeedDialViewAllowed(entry.meta, entry.id)
    );
    let changed = false;
    const occupied = new Set(
        (speedDialItems || []).map((item) => `${Number(item?.cell?.[0]) || 0}:${Number(item?.cell?.[1]) || 0}`)
    );
    for (const shortcut of core) {
        const shortcutView = String(shortcut.meta?.view || "").trim().toLowerCase();
        /* WHY: legacy persisted tiles used bare ids (`settings`) while defaults use `shortcut-settings` — match by view too. */
        const exists = speedDialItems?.find?.((item) => {
            if (item?.id === shortcut.id) return true;
            if (!shortcutView) return false;
            const metaView = String(getSpeedDialMeta(item.id)?.view || "").trim().toLowerCase();
            return metaView === shortcutView;
        });
        if (exists) {
            const meta = getSpeedDialMeta(exists.id) || ensureSpeedDialMeta(exists.id, {
                action: "open-view",
                ...(shortcut.meta || {})
            });
            if (!String(meta.view || "").trim() && shortcut.meta?.view) {
                meta.view = shortcut.meta.view;
                meta.action = meta.action || "open-view";
                changed = true;
            }
            continue;
        }
        let cellX = Number(shortcut.cell?.[0]) || 0;
        let cellY = Number(shortcut.cell?.[1]) || 0;
        let key = `${cellX}:${cellY}`;
        if (occupied.has(key)) {
            let placed = false;
            for (let y = 0; y < 12 && !placed; y += 1) {
                for (let x = 0; x < 8 && !placed; x += 1) {
                    const candidate = `${x}:${y}`;
                    if (!occupied.has(candidate)) {
                        cellX = x;
                        cellY = y;
                        key = candidate;
                        placed = true;
                    }
                }
            }
        }
        occupied.add(key);
        const item = createStatefulItem({
            ...shortcut,
            cell: observe([cellX, cellY])
        });
        if (shortcut.label && item.label && typeof item.label === "object" && "value" in item.label) {
            item.label.value = shortcut.label;
        }
        if (shortcut.icon && item.icon && typeof item.icon === "object" && "value" in item.icon) {
            item.icon.value = shortcut.icon;
        }
        speedDialItems.push(observe(item) as any);
        ensureSpeedDialMeta(item.id, { action: "open-view", ...(shortcut.meta || {}) });
        changed = true;
    }
    if (changed) {
        persistSpeedDialItems();
        persistSpeedDialMeta();
    }
};
ensureCoreViewShortcuts();

/**
 * WHY: Past merges left both legacy `settings` and `shortcut-settings` (same view) on disk.
 * Keep the preferred default id when present; otherwise keep the first match.
 */
const dedupeCoreOpenViewTiles = () => {
    let changed = false;
    const core = DEFAULT_SPEED_DIAL_DATA_ALL.filter(
        (entry) => entry.action === "open-view" && isSpeedDialViewAllowed(entry.meta, entry.id)
    );
    const getItemLabel = (item: any): string => {
        const raw = item?.label;
        if (raw && typeof raw === "object" && "value" in raw) return String(raw.value || "").trim().toLowerCase();
        return String(raw || "").trim().toLowerCase();
    };
    for (const shortcut of core) {
        const view = String(shortcut.meta?.view || "").trim().toLowerCase();
        const label = String(shortcut.label || "").trim().toLowerCase();
        if (!view && !label) continue;
        const matches = (speedDialItems || []).filter((item) => {
            const metaView = String(getSpeedDialMeta(item.id)?.view || "").trim().toLowerCase();
            const action = String(getSpeedDialMeta(item.id)?.action || item?.action || "open-view").toLowerCase();
            if (action !== "open-view") return false;
            if (view && metaView === view) return true;
            /* WHY: legacy tiles may lack meta.view but share the same visible label. */
            return Boolean(label) && getItemLabel(item) === label;
        });
        if (matches.length <= 1) continue;
        const keep = matches.find((item) => item.id === shortcut.id) || matches[0];
        for (const item of matches) {
            if (item === keep) continue;
            const idx = speedDialItems.findIndex((row) => row?.id === item.id);
            if (idx >= 0) {
                speedDialItems.splice(idx, 1);
                changed = true;
            }
        }
    }
    if (changed) {
        persistSpeedDialItems();
        persistSpeedDialMeta();
    }
};
dedupeCoreOpenViewTiles();

/** Router mount prefix (`/cwsp`, `/markdown`, …) when present on `<html>`. */
const getSpeedDialRouterBase = (): string => {
    try {
        return String(document.documentElement?.dataset?.cwspRouterBase || "")
            .trim()
            .replace(/\/+$/, "");
    } catch {
        return "";
    }
};

/**
 * Entry URL for a view deep link: `/settings?shell=environment[&native=1]&view=settings`
 * WHY: address-bar readable path; environment keeps `/${view}` (not root `/?view=`).
 * INVARIANT: open with this path; `preserveNativeDeepLink` must not strip it to `/`.
 */
export const buildSpeedDialViewPathHref = (
    viewId: string,
    absolute = false,
    opts?: { native?: boolean }
): string => {
    const id = String(viewId || "")
        .trim()
        .replace(/^#/, "")
        .replace(/^\/+/, "")
        .split(/[/?#]/)[0]
        .toLowerCase();
    if (!id) return "";
    const useNative = opts?.native === true;
    const base = getSpeedDialRouterBase().replace(/\/+$/, "") || "";
    const path = `${base}/${id}`.replace(/\/{2,}/g, "/") || `/${id}`;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const withQuery = useNative
        ? `${normalized}?shell=environment&native=1&view=${encodeURIComponent(id)}`
        : `${normalized}?shell=environment&view=${encodeURIComponent(id)}`;
    if (!absolute || typeof location === "undefined") return withQuery;
    try {
        const url = new URL(location.href);
        url.pathname = normalized;
        url.hash = "";
        url.search = "";
        url.searchParams.set("shell", "environment");
        url.searchParams.set("view", id);
        if (useNative) {
            url.searchParams.set("native", "1");
        } else {
            url.searchParams.delete("native");
        }
        return url.href;
    } catch {
        return withQuery;
    }
};

/**
 * Open `href` in a **new browser tab** without navigating the current tab.
 * WHY: `window.open(url, "_blank", "noopener")` returns `null` by spec even when the
 * window opened — our old `if (!opened) location.assign(href)` hijacked the desktop.
 * INVARIANT: never `location.assign` / `location.href =` from native/open-link paths.
 */
export const openInNewBrowserTab = (href: string): boolean => {
    const url = String(href || "").trim();
    if (!url || typeof document === "undefined") return false;
    try {
        window?.open?.(url, window?.self != window?.top ? "_unfencedTop" : "_blank", "noreferrer,noopener");
        return true;
    } catch (e) {
        console.warn("[home-view] openInNewBrowserTab failed", e);
        return false;
    }
};

/** @deprecated alias — prefer {@link openInNewBrowserTab} or {@link openInDetachedBrowserWindow}. */
export const openInNewBrowserWindow = openInNewBrowserTab;

/** True when this browsing context is an installed-like PWA (WCO / standalone / …). */
export const isInstalledPwaDisplayContext = (): boolean => {
    if (typeof globalThis === "undefined") return false;
    try {
        const nav = globalThis.navigator as Navigator & {
            windowControlsOverlay?: { visible?: boolean };
        };
        if (nav?.windowControlsOverlay?.visible) return true;
    } catch {
        /* ignore */
    }
    if (typeof globalThis.matchMedia !== "function") return false;
    try {
        for (const q of [
            "(display-mode: window-controls-overlay)",
            "(display-mode: standalone)",
            "(display-mode: fullscreen)",
            "(display-mode: minimal-ui)"
        ]) {
            if (globalThis.matchMedia(q).matches) return true;
        }
    } catch {
        /* ignore */
    }
    return false;
};

/**
 * Open a **detached window** for native-window mode (never a browser tab).
 *
 * INVARIANT:
 * - Do **not** use bare `window.open(url, "_blank")` — Chromium/Edge treat that as a **tab**.
 * - Do **not** fall back to {@link openInNewBrowserTab} (that is the `new-tab` mode).
 * - Do **not** request `menubar`/`toolbar`/`location` — those force full browser chrome
 *   and break PWA/WCO when the window is captured as an app window.
 * - Use a unique window name + `popup=yes,width,height` so each Native open is a
 *   separate window. From an installed PWA, size features still open another app window.
 *
 * Never hijack the opener via `location.assign`.
 */
let windowOpenThrottled = Date.now();
export const openInDetachedBrowserWindow = (href: string): boolean => {
    const url = String(href || "").trim();
    if (!url || typeof window === "undefined") return false;
    try {
        /* Do NOT put noopener in the features string — that forces a null return even on success. */
        const name = `cwsp-native-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const features = "popup,menubar=false,toolbar=false,location=false,width=1280,height=800";
        const opened = ((Date.now() - windowOpenThrottled) > 200) ? window.open(url, name, features) : null;
        windowOpenThrottled = Date.now();
        if (opened) {
            try {
                opened.opener = null;
            } catch {
                /* ignore */
            }
            return true;
        }
    } catch (e) {
        console.warn("[home-view] openInDetachedBrowserWindow failed", e);
    }
    /* WHY: native-window ≠ new-tab — surface failure instead of silently opening a tab. */
    return false;
};

/** True when href is (or resolves to) a same-origin app view path / bare view token. */
export const parseSpeedDialViewFromHref = (raw: string): string => {
    const input = String(raw || "").trim();
    if (!input || /^(mailto:|blob:|data:)/i.test(input)) return "";
    try {
        if (/^https?:\/\//i.test(input)) {
            const u = new URL(input);
            if (typeof location !== "undefined" && u.origin !== location.origin) return "";
            const seg = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop() || "";
            const id = seg.toLowerCase();
            if (!id || id === "home") return "";
            return id === "markdown" ? "viewer" : id;
        }
    } catch {
        return "";
    }
    if (input.startsWith("/")) {
        const seg = input.replace(/^\//, "").split(/[/?#]/)[0].toLowerCase();
        if (!seg || seg === "home") return "";
        return seg === "markdown" ? "viewer" : seg;
    }
    const token = input.replace(/^#/, "").split(/[/?#]/)[0].trim().toLowerCase();
    if (!token || token === "home" || /[.:]/.test(token)) return "";
    return token === "markdown" ? "viewer" : token;
};

/**
 * Prefer explicit `meta.href`; for view tiles synthesize path deep links
 * (`/settings`, `/workcenter`, …) for Open link → new tab / native window.
 */
export const resolveSpeedDialItemHref = (item?: SpeedDialItem | null): string => {
    if (!item?.id) return "";
    const meta = getSpeedDialMeta(item.id);
    const explicit = String(meta?.href || (item as any)?.href || "").trim();
    if (explicit) return explicit;
    const view = String(meta?.view || "").trim().replace(/^#/, "");
    if (!view) return "";
    return buildSpeedDialViewPathHref(view, true);
};

export const findSpeedDialItem = (id?: string | null) => {
    if (!id) return null;
    return speedDialItems?.find?.((item) => item?.id === id) || null;
};

export const createEmptySpeedDialItem = (
    cell: ReturnType<typeof observe<GridCell>> = observe([0, 0]) as ReturnType<typeof observe<GridCell>>
): SpeedDialItem => {
    const action = getDefaultSpeedDialAction();
    const item = createStatefulItem({
        id: generateItemId(),
        cell,
        icon: "sparkle",
        label: "New shortcut",
        action
    });
    ensureSpeedDialMeta(item.id, {
        action,
        href: "",
        description: "",
        shape: getDefaultTileShape(),
        openLinkTarget: getDefaultOpenLinkTarget()
    });
    return item;
};

export const addSpeedDialItem = (item: SpeedDialItem) => {
    markUserEditedBeforeHydrate();
    speedDialItems?.push?.(observe(item) as any);
    syncMetaActionFromItem(item);
    // INVARIANT: always flush both carriers — meta holds href/view for open-link tiles.
    persistSpeedDialItems();
    persistSpeedDialMeta();
    return item;
};

export type LauncherAppPinPayload = {
    packageName: string;
    label: string;
    componentName: string;
    iconCacheKey: string;
};

/** JSON drag envelope for AppMenu → SpeedDial (launcher design spec). */
export function buildLauncherAppDragEnvelope(app: LauncherAppPinPayload): string {
    return JSON.stringify({
        state: { icon: "device-mobile", label: app.label },
        desc: {
            action: "launch-app",
            meta: {
                packageName: app.packageName,
                componentName: app.componentName,
                entityType: "android-app",
                iconCacheKey: app.iconCacheKey || app.packageName
            }
        }
    });
}

/** First unoccupied logical cell on the current grid. */
export function findNextFreeSpeedDialCell(): GridCell {
    const columns = Math.max(1, Math.min(16, Number(gridLayoutState?.columns) || 4));
    const rows = Math.max(1, Math.min(16, Number(gridLayoutState?.rows) || 8));
    const occupied = new Set(
        (speedDialItems || []).map(
            (item) => `${Number(item?.cell?.[0]) || 0}:${Number(item?.cell?.[1]) || 0}`
        )
    );
    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
            const key = `${x}:${y}`;
            if (!occupied.has(key)) return [x, y];
        }
    }
    return [0, 0];
}

const querySpeedDialGridElement = (): HTMLElement | null =>
    document.querySelector<HTMLElement>('#home .speed-dial-grid[data-grid-layer="icons"]') ||
    document.querySelector<HTMLElement>("#home .speed-dial-grid:last-of-type") ||
    document.querySelector<HTMLElement>("#home .speed-dial-grid");

const readSpeedDialGridLayout = (): [number, number] => [
    Math.max(1, Math.min(16, Number(gridLayoutState?.columns) || 4)),
    Math.max(1, Math.min(16, Number(gridLayoutState?.rows) || 8))
];

/** Map viewport coordinates to a logical SpeedDial cell (null when grid is absent). */
export function resolveSpeedDialCellFromClientPoint(clientX: number, clientY: number): GridCell | null {
    const grid = querySpeedDialGridElement();
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const styles = getComputedStyle(grid);
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const size: [number, number] = [
        Math.max(1, rect.width - paddingLeft - paddingRight),
        Math.max(1, rect.height - paddingTop - paddingBottom)
    ];
    const point: [number, number] = [
        clientX - rect.left - paddingLeft,
        clientY - rect.top - paddingTop
    ];
    const root = grid.closest<HTMLElement>(".speed-dial-root") || document.getElementById("home");
    const orientRaw = root?.getAttribute?.("data-orient") ?? root?.dataset?.orient ?? "0";
    return pointToLogicalCell(point, size, readSpeedDialGridLayout(), normalizeOrient(orientRaw));
}

export function isClientPointOverSpeedDial(clientX: number, clientY: number): boolean {
    const hit = document.elementFromPoint(clientX, clientY);
    return !!hit?.closest?.("#home, .speed-dial-root");
}

/** Create a persisted `launch-app` tile from an AppMenu entry. */
export function pinLauncherAppEntry(app: LauncherAppPinPayload, cell?: GridCell): SpeedDialItem | null {
    const targetCell = cell ?? findNextFreeSpeedDialCell();
    const item = parseSpeedDialItemFromJSON(buildLauncherAppDragEnvelope(app), targetCell);
    if (!item) return null;
    addSpeedDialItem(item);
    return item;
}

export const upsertSpeedDialItem = (item: SpeedDialItem) => {
    markUserEditedBeforeHydrate();
    const existingIndex = speedDialItems?.findIndex?.((entry) => entry?.id === item?.id) ?? -1;
    if (existingIndex === -1) {
        speedDialItems?.push?.(observe(item) as any);
    } else if (speedDialItems[existingIndex] !== item) {
        speedDialItems.splice(existingIndex, 1, observe(item) as any);
    }
    syncMetaActionFromItem(item);
    persistSpeedDialItems();
    persistSpeedDialMeta();
    return item;
};

export const removeSpeedDialItem = (id: string) => {
    markUserEditedBeforeHydrate();
    const index = speedDialItems?.findIndex?.((entry) => entry?.id === id) ?? -1;
    if (index === -1) return false;
    speedDialItems.splice(index, 1);
    removeSpeedDialMeta(id);
    persistSpeedDialItems();
    return true;
};

/** WHY: cell drag in SpeedDial calls `persistSpeedDialItems` directly — mark the hydrate race. */
export const markSpeedDialUserEditBeforeHydrate = markUserEditedBeforeHydrate;

export const snapshotSpeedDialItem = (item: SpeedDialItem) => {
    const meta = getSpeedDialMeta(item.id);
    const resolvedAction = meta?.action || item.action;
    const metaSnapshot = fallbackClone((meta ?? {}) as SpeedDialItemMeta) as SpeedDialItemMeta;
    if (!metaSnapshot.action) {
        metaSnapshot.action = resolvedAction;
    }
    return {
        state: {
            id: item.id,
            cell: observe([item.cell?.[0] ?? 0, item.cell?.[1] ?? 0]),
            icon: unwrapRef(item.icon, ""),
            label: unwrapRef(item.label, "")
        },
        desc: {
            action: resolvedAction,
            meta: metaSnapshot
        }
    };
};

const WALLPAPER_KEY = "cw::workspace::wallpaper";
export const wallpaperState = makeUIState(WALLPAPER_KEY, () => observe({
    src: "/assets/wallpaper.jpg",
    opacity: 1,
    blur: 0
}), (raw) => observe(raw || {
    src: "/assets/wallpaper.jpg",
    opacity: 1,
    blur: 0
}), (state) => ({ ...state })) as unknown as { src: string; opacity: number; blur: number };

export const persistWallpaper = () => (wallpaperState as any)?.$save?.();

export type GridShape = "square" | "squircle" | "circle" | "rounded" | "hexagon" | "diamond" | "wavy";

export interface GridLayoutSettings {
    columns: number;
    rows: number;
    shape: GridShape;
    /** Default click action for newly created tiles (`open-link` / `open-view`). */
    defaultAction?: string;
}

const GRID_LAYOUT_KEY = "cw::workspace::grid-layout";
const WORKSPACE_GRID_EVENT = "cwsp:workspace-grid";
const TILE_SHAPES = new Set<string>(["square", "squircle", "circle", "rounded", "hexagon", "diamond", "wavy"]);

export const normalizeTileShape = (raw: unknown, fallback: GridShape = "squircle"): GridShape => {
    const v = String(raw || "").trim().toLowerCase();
    return TILE_SHAPES.has(v) ? (v as GridShape) : fallback;
};

export const gridLayoutState = makeUIState(GRID_LAYOUT_KEY, () => observe({
    columns: 4,
    rows: 8,
    shape: "squircle" as GridShape,
    defaultAction: "open-link"
}), (raw) => observe(raw || {
    columns: 4,
    rows: 8,
    shape: "squircle" as GridShape,
    defaultAction: "open-link"
}), (state) => ({ ...state })) as unknown as GridLayoutSettings;

export const persistGridLayout = () => (gridLayoutState as any)?.$save?.();

export function getDefaultTileShape(): GridShape {
    return normalizeTileShape(gridLayoutState?.shape, "squircle");
}

export function setDefaultTileShape(shape: GridShape): void {
    gridLayoutState.shape = normalizeTileShape(shape, "squircle");
    persistGridLayout();
}

function normalizeDefaultAction(raw: unknown, fallback = "open-link"): string {
    const v = String(raw || "").trim().toLowerCase();
    if (v === "open-view" || v === "view") return "open-view";
    if (v === "open-link" || v === "link") return "open-link";
    return fallback;
}

/** Default action id for newly created shortcuts (Settings → Workspace). */
export function getDefaultSpeedDialAction(): string {
    return normalizeDefaultAction(gridLayoutState?.defaultAction, "open-link");
}

export function setDefaultSpeedDialAction(action: string): void {
    gridLayoutState.defaultAction = normalizeDefaultAction(action, "open-link");
    persistGridLayout();
}

const hasStoredValue = (key: string): boolean => {
    try {
        return typeof localStorage !== "undefined" && localStorage.getItem(key) !== null;
    } catch {
        return false;
    }
};

const storedSpeedDialStateIsCustom = (): boolean => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        // WHY: makeUIState writes JSOX (unquoted keys) — JSON.parse always fails and
        // used to report "not custom", letting migrateLegacyDesktopState wipe user tiles.
        const parsed = JSOX.parse(raw);
        if (!Array.isArray(parsed)) return false;
        const signature = (entry: any): string => JSOX.stringify([
            String(entry?.id || ""),
            Number(entry?.cell?.[0]) || 0,
            Number(entry?.cell?.[1]) || 0,
            String(unwrapRef(entry?.icon, "") || ""),
            String(unwrapRef(entry?.label, "") || ""),
            String(entry?.action || "")
        ]);
        const defaults = DEFAULT_SPEED_DIAL_DATA.map(signature).sort();
        const current = parsed.map(signature).sort();
        return defaults.length !== current.length || defaults.some((value, index) => value !== current[index]);
    } catch {
        // Prefer preserving whatever is already under STORAGE_KEY over a blind legacy wipe.
        return true;
    }
};

/**
 * Import the former orient-layer storage once. The renderer now has one state
 * model, but old users must not lose shortcuts when the new entrypoint mounts.
 */
const migrateLegacyDesktopState = (): void => {
    const legacy = loadDesktopRaw();
    const decoded = legacy ? decodeDesktopState(legacy) : null;
    if (!decoded?.items?.length) return;
    if (hasStoredValue(STORAGE_KEY) && storedSpeedDialStateIsCustom()) return;

    const columns = Math.max(1, Math.min(32, Number(decoded.columns) || 4));
    const rows = Math.max(1, Math.min(32, Number(decoded.rows) || 8));
    const nextItems: SpeedDialItem[] = [];

    speedDialItems.splice(0, speedDialItems.length);
    speedDialMeta.clear();

    for (const raw of decoded.items as Array<Record<string, any>>) {
        const action = raw?.action === "open-link" ? "open-link" : "open-view";
        const item = createStatefulItem({
            id: String(raw?.id || generateItemId()),
            cell: observe([
                Number(raw?.cell?.[0]) || 0,
                Number(raw?.cell?.[1]) || 0
            ]),
            icon: String(raw?.icon || (action === "open-link" ? "link" : "sparkle")),
            label: String(raw?.label || "Shortcut"),
            action
        });
        const meta: SpeedDialItemMeta = {
            action,
            view: action === "open-view" ? String(raw?.viewId || "") : "",
            href: action === "open-link" ? String(raw?.href || "") : "",
            description: String(raw?.description || ""),
            shape: String(raw?.shape || "squircle"),
            iconSrc: String(raw?.iconSrc || "")
        };
        speedDialItems.push(item);
        ensureSpeedDialMeta(item.id, meta);
        nextItems.push(item);
    }

    if (!nextItems.length) return;

    gridLayoutState.columns = columns;
    gridLayoutState.rows = rows;
    gridLayoutState.shape = "square";
    persistSpeedDialItems();
    persistSpeedDialMeta();
    persistGridLayout();
};

migrateLegacyDesktopState();

export const applyGridSettings = (settings?: {
    grid?: Partial<GridLayoutSettings> & { defaultOpenLinkTarget?: string };
}) => {
    const gridConfig = settings?.grid || gridLayoutState;
    const columns = Math.max(1, Math.min(16, Number(gridConfig?.columns) || gridLayoutState.columns || 4));
    const rows = Math.max(1, Math.min(16, Number(gridConfig?.rows) || gridLayoutState.rows || 8));
    const shape = normalizeTileShape(gridConfig?.shape ?? gridLayoutState.shape, "squircle");
    const defaultAction = normalizeDefaultAction(
        gridConfig?.defaultAction ?? gridLayoutState.defaultAction,
        "open-link"
    );

    // WHY: shrink before writing layout state so the first visual pass already
    // has in-bounds cells. Clamping in logicalToVisualCell would stack overflow
    // tiles on the last track; CSS grid-column then grows implicit columns.
    if (relocateItemsToLayout(speedDialItems, [columns, rows])) {
        persistSpeedDialItems();
    }

    if (gridLayoutState) {
        gridLayoutState.columns = columns;
        gridLayoutState.rows = rows;
        gridLayoutState.shape = shape;
        gridLayoutState.defaultAction = defaultAction;
        persistGridLayout();
    }

    const openTarget = (gridConfig as { defaultOpenLinkTarget?: string } | undefined)?.defaultOpenLinkTarget;
    if (openTarget != null && String(openTarget).trim()) {
        setDefaultOpenLinkTarget(normalizeOpenLinkTarget(openTarget));
    }

    if (typeof document === "undefined") {
        return;
    }

    // INVARIANT: visual `data-grid-columns/rows` on `.speed-dial-grid` belong to
    // syncGridLayout (orient-aware). Logical counts live on documentElement.
    document.documentElement.dataset.gridColumns = String(columns);
    document.documentElement.dataset.gridRows = String(rows);
    document.documentElement.dataset.gridShape = shape;
};

type WorkspaceGridEventDetail = Partial<GridLayoutSettings> & {
    defaultOpenLinkTarget?: string;
    query?: boolean;
    receive?: (grid: Partial<GridLayoutSettings> & { defaultOpenLinkTarget: OpenLinkTarget }) => void;
    ack?: () => void;
};

if (typeof window !== "undefined") {
    window.addEventListener(WORKSPACE_GRID_EVENT, (ev: Event) => {
        const detail = (ev as CustomEvent<WorkspaceGridEventDetail>).detail;
        if (!detail) return;
        if (detail.query && typeof detail.receive === "function") {
            detail.receive({
                columns: gridLayoutState.columns,
                rows: gridLayoutState.rows,
                shape: gridLayoutState.shape,
                defaultAction: getDefaultSpeedDialAction(),
                defaultOpenLinkTarget: getDefaultOpenLinkTarget()
            });
            return;
        }
        applyGridSettings({ grid: detail });
        detail.ack?.();
    });
}

if (typeof globalThis !== "undefined" && typeof document !== "undefined") {
    const run = () => applyGridSettings();
    if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(run);
    } else {
        queueMicrotask(run);
    }
}

const looksLikeJsonObject = (raw: string): boolean => {
    const t = String(raw || "").trim();
    return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
};

/**
 * Explorer virtual paths (`/bookmarks/…`, `/user/…`, `/assets/…`).
 * WHY: drag from Explorer used to put these in `text/plain`; they are not JSON.
 */
export const isSpeedDialVirtualPath = (raw: string): boolean => {
    const p = String(raw || "").trim();
    if (!p.startsWith("/") || p.includes("://") || /\s/.test(p)) return false;
    return (
        p === "/" ||
        p === "/bookmarks" ||
        p.startsWith("/bookmarks/") ||
        p === "/user" ||
        p.startsWith("/user/") ||
        p === "/assets" ||
        p.startsWith("/assets/")
    );
};

export const parseSpeedDialItemFromVirtualPath = (
    pathText: string,
    suggestedCell?: GridCell,
    extras?: { label?: string; href?: string; kind?: string }
): SpeedDialItem | null => {
    const path = String(pathText || "").trim();
    if (!isSpeedDialVirtualPath(path)) return null;
    const href = String(extras?.href || "").trim();
    const isUrl = /^https?:\/\//i.test(href);
    const isDir = path.endsWith("/") || extras?.kind === "directory";
    const labelFromPath = path.split("/").filter(Boolean).pop() || path;
    const item = createStatefulItem({
        id: generateItemId(),
        cell: suggestedCell || [0, 0],
        icon: isUrl ? "link" : isDir ? "folder" : "file",
        label: String(extras?.label || "").trim() || labelFromPath,
        action: isUrl ? "open-link" : "open-path"
    });
    const meta: SpeedDialItemMeta = {
        action: isUrl ? "open-link" : "open-path",
        path,
        ...(isUrl ? { href } : {}),
        kind: extras?.kind || (isDir ? "directory" : "file")
    };
    ensureSpeedDialMeta(item.id, meta);
    return item;
};

export const parseSpeedDialItemFromJSON = (jsonText: string, suggestedCell?: GridCell): SpeedDialItem | null => {
    const raw = String(jsonText || "").trim();
    if (!raw) return null;
    // WHY: Explorer bookmark drags used to send `/bookmarks/…` here. That is
    // not JSON — parse as a virtual path instead of `JSON.parse` + console.warn.
    if (isSpeedDialVirtualPath(raw)) {
        return parseSpeedDialItemFromVirtualPath(raw, suggestedCell);
    }
    if (!looksLikeJsonObject(raw)) return null;
    try {
        const parsed = JSON.parse(raw) as any;
        if (!parsed || typeof parsed !== "object") return null;

        const state = parsed.state || parsed;
        const desc = parsed.desc || parsed.meta || {};

        if (!state || typeof state !== "object") return null;

        const cellValue = state.cell && Array.isArray(state.cell) && state.cell.length >= 2
            ? [Number(state.cell[0]) || 0, Number(state.cell[1]) || 0] as GridCell
            : (suggestedCell || [0, 0] as GridCell);

        const href = String(desc.href || desc.meta?.href || state.href || "").trim();
        const path = String(desc.path || desc.meta?.path || state.path || "").trim();
        const action =
            desc.action ||
            state.action ||
            (href ? "open-link" : path ? "open-path" : "open-view");

        const item = createStatefulItem({
            id: state.id || generateItemId(),
            cell: cellValue,
            icon:
                state.icon ||
                desc.icon ||
                (action === "launch-app" ? "device-mobile" : href ? "link" : path ? "folder" : "sparkle"),
            label: state.label || desc.label || "Shortcut",
            action
        });

        const meta: SpeedDialItemMeta = {
            action,
            ...(desc.meta || desc || {}),
            ...(state.meta || {}),
            ...(href ? { href } : {}),
            ...(path ? { path } : {})
        };
        meta.action = action;

        ensureSpeedDialMeta(item.id, meta);
        return item;
    } catch (e) {
        console.warn("Failed to parse JSON for speed dial item:", e);
        return null;
    }
};

export const parseSpeedDialItemFromURL = (urlText: string, suggestedCell?: GridCell): SpeedDialItem | null => {
    try {
        const trimmed = urlText.trim();
        if (!trimmed) return null;

        let url: URL;
        try {
            url = new URL(trimmed);
        } catch {
            try {
                url = new URL(trimmed, globalThis?.location?.href);
            } catch {
                return null;
            }
        }

        const hostname = url.hostname || "";
        const domain = hostname.replace(/^www\./, "");
        const pathname = url.pathname || "";
        const label = domain || url.host || "Link";

        const item = createStatefulItem({
            id: generateItemId(),
            cell: suggestedCell || [0, 0],
            icon: "link",
            label,
            action: "open-link"
        });

        const meta: SpeedDialItemMeta = {
            action: "open-link",
            href: url.href,
            description: `${label}${pathname ? ` - ${pathname}` : ""}`
        };

        ensureSpeedDialMeta(item.id, meta);
        return item;
    } catch (e) {
        console.warn("Failed to parse URL for speed dial item:", e);
        return null;
    }
};

const readClipboardTextBrowser = async (): Promise<{ ok: boolean; data?: string; error?: string }> => {
    try {
        if (!navigator.clipboard?.readText) {
            return { ok: false, error: "clipboard.readText unavailable" };
        }
        const data = await navigator.clipboard.readText();
        return { ok: true, data: String(data ?? "") };
    } catch (e: any) {
        return { ok: false, error: String(e?.message || e) };
    }
};

export const createSpeedDialItemFromClipboard = async (suggestedCell?: GridCell): Promise<SpeedDialItem | null> => {
    try {
        const clipboardResult = await readClipboardTextBrowser();
        if (!clipboardResult.ok || !clipboardResult.data) {
            console.warn("Failed to read clipboard text:", clipboardResult.error);
            return null;
        }

        const clipboardText = String(clipboardResult.data);
        if (!clipboardText.trim()) return null;

        // WHY: take first non-comment line — same hygiene as drop uri-list parsing.
        const firstLine =
            clipboardText
                .split(/\r?\n/)
                .map((l) => l.trim())
                .find((l) => l && !l.startsWith("#")) || clipboardText.trim();
        let trimmed = firstLine;
        if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
            trimmed = trimmed.slice(1, -1).trim();
        }

        let absolute: string | null = null;
        try {
            const parsed = new URL(trimmed);
            if (/^https?:$/i.test(parsed.protocol)) absolute = parsed.href;
        } catch {
            const bare =
                /^(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:[/:?#][^\s]*)?$/i.test(trimmed);
            if (bare && !/\s/.test(trimmed)) {
                try {
                    absolute = new URL(`https://${trimmed.replace(/^\/+/, "")}`).href;
                } catch {
                    absolute = null;
                }
            }
        }

        if (absolute) {
            return parseSpeedDialItemFromURL(absolute, suggestedCell);
        }

        if (isSpeedDialVirtualPath(trimmed)) {
            return parseSpeedDialItemFromVirtualPath(trimmed, suggestedCell);
        }

        if (looksLikeJsonObject(trimmed)) {
            const parsed = parseSpeedDialItemFromJSON(trimmed, suggestedCell);
            if (parsed) return parsed;
        }

        return null;
    } catch (e) {
        console.warn("Failed to create speed dial item from clipboard:", e);
        return null;
    }
};
