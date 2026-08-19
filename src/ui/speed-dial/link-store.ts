/*
 * Filename: link-store.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/link-store.ts
 * Change date and time: 09.10.00_19.08.2026
 * Reason for changes: Per-item JSON under `/user/links/<id>.json` instead of one `links.json`.
 *
 * Speed-dial persistence lives in OPFS under `/user/links/`.
 * WHY: localStorage is synchronous, quota-bound, and shared across origins; OPFS gives
 * us a real file tree the Explorer can browse (`/user/links/<id>.json` per tile).
 *
 * INVARIANT: this module is pure w.r.t. IO — it never touches `navigator.storage` or
 * `localStorage` directly. Callers inject `LinkStoreIo` (OPFS in browser, memory in tests)
 * and a `Map | Storage`-like object for legacy LS reads. That keeps the unit tests pure
 * and lets `launcher-state.ts` own the fallback policy (OPFS fail → warn + LS).
 *
 * COMPAT: persisted LS payloads may be JSOX (unquoted keys) or JSON; we accept both on
 * read. OPFS files are written as JSON for hand-editability. `packLinksFromSpeedDial`
 * accepts the existing `SpeedDialPersistedItem` shape (cell as `[x,y]` or observe proxy)
 * and emits plain `LinkStoreItem` POJOs.
 */

import { JSOX } from "jsox";
// WHY (final review #1/#5): use the `fl-ui/explorer/fs-backend` alias so this
// file resolves the canonical FsBackend helpers from any hardlinked copy
// (e.g. `modules/views/home-view/src/ts/link-store.ts`), where the relative
// `../explorer/fs-backend.ts` path does not exist.
import type { EntryKind } from "#fl-ui/explorer/fs-backend";
import { resolveEntryIcon } from "#fl-ui/explorer/fs-backend";

/**
 * Virtual directory holding curated speed-dial files. Matches the PathRouter
 * `/user/` OpfsBackend root so Explorer can browse the same tree.
 */
export const LINKS_DIR = "/user/links/";
/** Legacy aggregate file — still read on boot, then split into per-item JSON. */
export const LINKS_JSON = "/user/links/links.json";
export const META_JSON = "/user/links/meta.json";
const RESERVED_LINK_FILES = new Set(["links.json", "meta.json"]);

/**
 * Safe leaf name for a curated item. Ids are UUID / `shortcut-*` / `sd-*`;
 * strip path separators so Explorer + OPFS can treat each tile as one file.
 */
export function itemFileName(id: string): string {
    const raw = String(id || "").trim();
    const safe = raw.replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^\.+/, "_") || "item";
    return `${safe}.json`;
}

export function itemJsonPath(id: string): string {
    return `${LINKS_DIR}${itemFileName(id)}`;
}

const isItemJsonPath = (path: string): boolean => {
    const name = String(path || "").split("/").filter(Boolean).pop() || "";
    if (!name.endsWith(".json")) return false;
    return !RESERVED_LINK_FILES.has(name);
};

/**
 * localStorage keys mirror `launcher-state.ts` so a one-time migration can copy
 * the existing grid into OPFS without a schema change.
 */
export const LS_ITEMS_KEY = "cw::workspace::speed-dial";
export const LS_META_KEY = "cw::workspace::speed-dial::meta";
/**
 * Marker written to LS after a successful migration so we never re-import and
 * overwrite user edits. Kept in LS (not OPFS) so it survives OPFS wipe.
 */
export const LS_MIGRATED_KEY = "cw::workspace::speed-dial::migrated-opfs-v1";

export interface LinkStoreItem {
    id: string;
    label: string;
    action: string;
    icon: string;
    href?: string;
    path?: string;
    /** Path under `/user/links/icons/` when a custom icon blob was stored. */
    iconAsset?: string;
    /**
     * Grid cell carried alongside the item. WHY: legacy `packState` (launcher-state)
     * stores `cell` on the item itself, not in the meta registry. We preserve it
     * here on read so `normalizeLegacyMeta` can copy it into `meta.items[id].cell`
     * during migration. On OPFS reads `meta.json` is the canonical cell source;
     * each `/user/links/<id>.json` keeps `cell` for hand-editability too.
     */
    cell?: [number, number];
}

export interface LinkStoreMetaFile {
    version: 1;
    mirrorPath?: string | null;
    items: Record<
        string,
        {
            cell?: [number, number];
            shape?: string;
            openLinkTarget?: string;
            hidden?: boolean;
            form?: string;
            // retain existing SpeedDialItemMeta fields as needed
            [key: string]: unknown;
        }
    >;
    grid?: unknown;
}

export interface LinkStoreIo {
    readText(path: string): Promise<string | null>;
    writeText(path: string, text: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    /** Direct-child virtual paths under `dir` (files only). Optional on older mocks. */
    list?(dir: string): Promise<string[]>;
    remove?(path: string): Promise<void>;
}

/**
 * Minimal LS-like reader. We accept either a `Map<string, string>` (tests) or the
 * real `Storage` (browser). Only `getItem`/`setItem` are required.
 */
export interface LsLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

const clone = <T>(value: T): T => {
    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        } catch {
            /* proxies / non-cloneable — fall through to JSON */
        }
    }
    try {
        return JSON.parse(JSON.stringify(value as any)) as T;
    } catch {
        return value;
    }
};

/**
 * Accept JSOX (unquoted keys, what `launcher-state.ts` writes today) or JSON on read.
 * WHY: `makeUIState` packs via `JSOX.stringify`; existing LS payloads are JSOX. OPFS
 * files we write are JSON, so this stays forward-compatible too.
 */
const parseLoose = (raw: string | null | undefined): any => {
    if (raw == null || !String(raw).trim()) return null;
    try {
        return JSON.parse(raw as string);
    } catch {
        try {
            return JSOX.parse(raw as string);
        } catch {
            return null;
        }
    }
};

/** Unwrap observe/stringRef proxies into plain values for OPFS serialization. */
const unwrapRef = (value: unknown, fallback?: string): string => {
    if (value && typeof value === "object" && "value" in (value as any)) {
        return String((value as any).value ?? fallback ?? "");
    }
    return String(value ?? fallback ?? "");
};

/**
 * Pack existing `SpeedDialPersistedItem`-shaped items (cell may be `[x,y]` or an
 * observe proxy; meta may live on the item or in a side registry) into plain
 * `LinkStoreItem` POJOs for OPFS.
 *
 * WHY: keeps the OPFS file free of reactive proxies (which break roundtrips and
 * hand-editing) while preserving `href`/`path`/`iconAsset` for open-link/path tiles.
 */
export function packLinksFromSpeedDial(items: any[]): LinkStoreItem[] {
    if (!Array.isArray(items)) return [];
    return items.map((entry) => {
        const cell = entry?.cell;
        const meta = entry?.meta && typeof entry.meta === "object" ? entry.meta : null;
        const item: LinkStoreItem & { cell?: [number, number]; [k: string]: unknown } = {
            id: String(entry?.id || ""),
            label: unwrapRef(entry?.label, "Shortcut"),
            action: String(entry?.action || "open-view"),
            icon: unwrapRef(entry?.icon, "sparkle")
        };
        if (cell != null) {
            const x = Number(Array.isArray(cell) ? cell[0] : (cell as any)?.[0]) || 0;
            const y = Number(Array.isArray(cell) ? cell[1] : (cell as any)?.[1]) || 0;
            item.cell = [x, y];
        }
        const href = unwrapRef(meta?.href ?? entry?.href, "") || (meta?.href ?? entry?.href);
        if (href) item.href = String(href);
        const path = unwrapRef(meta?.path ?? entry?.path, "") || (meta?.path ?? entry?.path);
        if (path) item.path = String(path);
        const iconAsset = meta?.iconAsset ?? entry?.iconAsset;
        if (iconAsset) item.iconAsset = String(iconAsset);
        return item;
    });
}

/**
 * Merge a per-id meta registry (from `launcher-state` `packMetaRegistry`) into an
 * existing `LinkStoreMetaFile`. Existing per-id fields are preserved; new fields
 * from `perId` are overlaid without dropping `cell`/`version`/`mirrorPath`.
 */
export function mergeMetaFile(
    base: LinkStoreMetaFile,
    perId: Record<string, Record<string, unknown>> | Map<string, Record<string, unknown>>
): LinkStoreMetaFile {
    const next: LinkStoreMetaFile = {
        version: 1,
        mirrorPath: base?.mirrorPath ?? null,
        items: { ...(base?.items || {}) },
        grid: base?.grid
    };
    const entries =
        perId instanceof Map
            ? Array.from(perId.entries())
            : Object.entries(perId || {});
    for (const [id, meta] of entries) {
        if (!id || !meta || typeof meta !== "object") continue;
        const existing = (next.items[id] || {}) as Record<string, unknown>;
        next.items[id] = { ...existing, ...clone(meta) } as any;
    }
    return next;
}

const emptyMeta = (): LinkStoreMetaFile => ({
    version: 1,
    mirrorPath: null,
    items: {}
});

/**
 * One-time migration of legacy localStorage speed-dial into OPFS.
 *
 * Returns:
 * - `"migrated"` — LS had data and OPFS was empty; we copied it.
 * - `"skipped"`  — OPFS already had curated item JSON (or legacy `links.json`);
 *   we just ensure the LS marker so we never re-import even if LS still holds
 *   the old payload.
 * - `"already"`  — LS marker already set; nothing to do.
 *
 * WHY: idempotent — running twice never overwrites OPFS edits. We never delete LS
 * (one-release backup window); we only set `LS_MIGRATED_KEY = "1"`.
 */
export async function migrateLocalStorageToOpfsIfNeeded(
    io: LinkStoreIo,
    ls: LsLike | Map<string, string>
): Promise<"migrated" | "skipped" | "already"> {
    const lsReader = toLsReader(ls);
    if (lsReader.getItem(LS_MIGRATED_KEY)) return "already";

    const opfsHasLinks = await hasCuratedOpfsData(io);
    if (opfsHasLinks) {
        // WHY: OPFS already populated (e.g. another tab migrated first). Mark LS so
        // we don't keep re-checking on every boot.
        safeSet(ls, LS_MIGRATED_KEY, "1");
        return "skipped";
    }

    const rawItems = lsReader.getItem(LS_ITEMS_KEY);
    const rawMeta = lsReader.getItem(LS_META_KEY);
    if (!rawItems && !rawMeta) {
        // Nothing legacy to import — still mark so we don't re-scan every boot.
        safeSet(ls, LS_MIGRATED_KEY, "1");
        return "skipped";
    }

    const items = normalizeLegacyItems(parseLoose(rawItems));
    const meta = normalizeLegacyMeta(parseLoose(rawMeta), items);
    await writeLinkStore(io, items, meta);
    safeSet(ls, LS_MIGRATED_KEY, "1");
    return "migrated";
}

const toLsReader = (ls: LsLike | Map<string, string>): LsLike => {
    if (ls instanceof Map) {
        return {
            getItem(key: string): string | null {
                return ls.has(key) ? (ls.get(key) as string) : null;
            },
            setItem(key: string, value: string): void {
                ls.set(key, value);
            }
        };
    }
    return ls;
};

const safeSet = (ls: LsLike | Map<string, string>, key: string, value: string): void => {
    try {
        if (ls instanceof Map) {
            ls.set(key, value);
        } else {
            ls.setItem(key, value);
        }
    } catch {
        /* private mode / quota — marker is best-effort */
    }
};

const normalizeLegacyItems = (raw: any): LinkStoreItem[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((entry: any): LinkStoreItem => {
            const item: LinkStoreItem = {
                id: String(entry?.id || ""),
                label: unwrapRef(entry?.label, "Shortcut"),
                action: String(entry?.action || "open-view"),
                icon: unwrapRef(entry?.icon, "sparkle")
            };
            if (entry?.href) item.href = String(entry.href);
            if (entry?.path) item.path = String(entry.path);
            if (entry?.iconAsset) item.iconAsset = String(entry.iconAsset);
            // WHY: legacy `packState` (launcher-state.serializeItemState) puts `cell`
            // on the item. Preserve it so `normalizeLegacyMeta` can lift it into
            // `meta.items[id].cell`; without this the grid collapses to [0,0] on migrate.
            if (Array.isArray(entry?.cell)) {
                item.cell = [
                    Number(entry.cell[0]) || 0,
                    Number(entry.cell[1]) || 0
                ] as [number, number];
            }
            return item;
        })
        .filter((item: LinkStoreItem) => item.id);
};

const normalizeLegacyMeta = (raw: any, items: LinkStoreItem[]): LinkStoreMetaFile => {
    const meta: LinkStoreMetaFile = emptyMeta();
    // WHY: top-level keys that are NOT per-id entries. `packMetaRegistry`
    // (launcher-state) writes a flat `{ [id]: meta }` map with no `items`
    // wrapper and no top-level metadata, so when `raw.items` is absent we
    // treat the entire raw object as the per-id map (skipping these keys).
    const knownTopKeys = new Set(["version", "mirrorPath", "grid", "items"]);
    if (raw && typeof raw === "object") {
        if (raw.mirrorPath != null) meta.mirrorPath = String(raw.mirrorPath);
        if (raw.grid != null) meta.grid = raw.grid;
        const itemsMap = raw.items;
        let entries: Array<[string, any]>;
        if (itemsMap instanceof Map) {
            entries = Array.from(itemsMap.entries()) as Array<[string, any]>;
        } else if (Array.isArray(itemsMap)) {
            entries = itemsMap
                .map((e: any) =>
                    e && typeof e === "object" && "id" in e
                        ? [e.id, e.meta || e] as [string, any]
                        : null
                )
                .filter((e): e is [string, any] => e !== null);
        } else if (itemsMap && typeof itemsMap === "object") {
            entries = Object.entries(itemsMap) as Array<[string, any]>;
        } else {
            // WHY: flat `{ [id]: meta }` shape (what `packMetaRegistry` actually writes).
            // Treat the entire raw object as the per-id map, skipping known top-level keys.
            entries = Object.entries(raw).filter(
                ([k]) => !knownTopKeys.has(k)
            ) as Array<[string, any]>;
        }
        for (const [id, m] of entries) {
            if (!id || !m || typeof m !== "object") continue;
            const entry: Record<string, unknown> = { ...(m as any) };
            if (Array.isArray((m as any).cell)) {
                entry.cell = [
                    Number((m as any).cell[0]) || 0,
                    Number((m as any).cell[1]) || 0
                ] as [number, number];
            }
            meta.items[String(id)] = entry as any;
        }
    }
    // WHY: ensure every item has at least a meta slot so the registry round-trips,
    // and lift `cell` from legacy items (where `packState` stored it) into
    // `meta.items[id].cell` when the meta registry didn't already carry it.
    for (const item of items) {
        const slot = (meta.items[item.id] || {}) as Record<string, unknown>;
        if (item.cell && !Array.isArray(slot.cell)) {
            slot.cell = item.cell;
        }
        meta.items[item.id] = slot as any;
    }
    return meta;
};

const listItemJsonPaths = async (io: LinkStoreIo): Promise<string[]> => {
    if (typeof io.list !== "function") return [];
    try {
        const children = await io.list(LINKS_DIR);
        return (children || []).filter(isItemJsonPath);
    } catch {
        return [];
    }
};

const hasCuratedOpfsData = async (io: LinkStoreIo): Promise<boolean> => {
    if (await io.exists(LINKS_JSON)) return true;
    const files = await listItemJsonPaths(io);
    return files.length > 0;
};

const parseItemFile = (raw: string | null | undefined, fallbackId?: string): LinkStoreItem | null => {
    const parsed = parseLoose(raw);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
    const id = String((parsed as any).id || fallbackId || "").trim();
    if (!id) return null;
    const [item] = normalizeLegacyItems([{ ...(parsed as any), id }]);
    return item || null;
};

/**
 * Read curated items + meta from OPFS. Prefers per-item `/user/links/<id>.json`.
 * Falls back to legacy `links.json` (array) when no item files exist.
 * Returns `null` when neither is present (caller should fall back to defaults / LS).
 * `meta.json` missing is non-fatal — we return an empty meta shell so callers can
 * overlay cells later.
 */
export async function readLinkStore(
    io: LinkStoreIo
): Promise<{ items: LinkStoreItem[]; meta: LinkStoreMetaFile } | null> {
    const itemPaths = await listItemJsonPaths(io);
    let items: LinkStoreItem[] = [];
    if (itemPaths.length) {
        const loaded: LinkStoreItem[] = [];
        for (const path of itemPaths) {
            const raw = await io.readText(path);
            const leaf = path.split("/").filter(Boolean).pop() || "";
            const fallbackId = leaf.replace(/\.json$/i, "");
            const item = parseItemFile(raw, fallbackId);
            if (item) loaded.push(item);
        }
        items = loaded;
    }
    // WHY: a stray `.json` in `/user/links/` must not hide legacy `links.json`.
    // Also recover when per-item files exist but fail to parse.
    if (!items.length) {
        const itemsRaw = await io.readText(LINKS_JSON);
        if (itemsRaw != null && String(itemsRaw).trim()) {
            const parsed = parseLoose(itemsRaw);
            if (Array.isArray(parsed)) items = normalizeLegacyItems(parsed);
        }
    }
    const metaRaw = await io.readText(META_JSON);
    const metaParsed = parseLoose(metaRaw);
    if (!items.length) {
        // WHY: empty-write wipe deleted `links.json` but often left `meta.json`
        // with per-id href/view/cell. Rebuild tiles from that overlay.
        const recovered = itemsFromMetaSlots(metaParsed);
        if (!recovered.length) return null;
        const meta = normalizeLegacyMeta(metaParsed, recovered);
        return { items: recovered, meta };
    }
    const meta = normalizeLegacyMeta(metaParsed, items);
    return { items, meta };
}

const itemsFromMetaSlots = (raw: any): LinkStoreItem[] => {
    if (!raw || typeof raw !== "object") return [];
    const map = raw.items && typeof raw.items === "object" && !Array.isArray(raw.items)
        ? raw.items
        : raw;
    const knownTop = new Set(["version", "mirrorPath", "grid", "items"]);
    const out: LinkStoreItem[] = [];
    for (const [id, slot] of Object.entries(map || {})) {
        if (!id || knownTop.has(id) || id.startsWith("mirror:")) continue;
        if (!slot || typeof slot !== "object") continue;
        const rec = slot as Record<string, unknown>;
        const href = rec.href != null ? String(rec.href) : "";
        const view = rec.view != null ? String(rec.view) : "";
        const path = rec.path != null ? String(rec.path) : "";
        const action = String(rec.action || (href ? "open-link" : view || path ? "open-view" : "") || "");
        if (!action && !href && !view && !path) continue;
        const item: LinkStoreItem = {
            id,
            label: String(rec.label || id),
            action: action || "open-view",
            icon: String(rec.icon || (href ? "link" : "sparkle"))
        };
        if (href) item.href = href;
        if (path) item.path = path;
        if (Array.isArray(rec.cell)) {
            item.cell = [Number((rec.cell as any)[0]) || 0, Number((rec.cell as any)[1]) || 0];
        }
        out.push(item);
    }
    return out;
};

export interface MirrorSpeedDialItem {
    id: string;
    label: string;
    action: string;
    icon: string;
    cell: [number, number];
    path?: string;
    href?: string;
    /**
     * Task 5 — favicon URL for entries that carry an http(s) `href` (e.g. Chrome
     * bookmark URL nodes mirrored under `/bookmarks/…`). When set, the SpeedDial
     * mirror renderer paints an `<img>` instead of a named `<ui-icon>`. `icon`
     * remains the named-icon fallback used when `iconUrl` is empty or fails to
     * load. WHY: keep `icon` stable so existing tests / packs that only read
     * `icon` (e.g. `link`) stay green; `iconUrl` is purely additive.
     */
    iconUrl?: string;
}

/**
 * Default column count for auto-placing mirror tiles below the curated grid.
 * WHY: matches `gridLayoutState.columns` default (4). Auto-placement only kicks
 * in when meta has no per-id `cell` override; an explicit override always wins.
 */
const MIRROR_AUTO_PLACE_COLUMNS = 4;

/**
 * Build speed-dial display items from a PathRouter directory listing merged
 * with per-id meta overrides (`cell`, `hidden`, `shape`, …).
 *
 * WHY: in mirror mode the speed-dial grid is driven by a virtual directory
 * (OPFS folder or CRX `/bookmarks/…`) instead of curated `links.json`. The
 * meta registry still holds per-id overrides so users can pin a mirror tile to
 * a specific cell or hide it without mutating the source tree.
 *
 * INVARIANT: ids are `mirror:${path}` so they never collide with curated ids.
 * Directories and `.md`/`.markdown`/`.txt`/image files map to `open-path`
 * (Explorer / viewer). Entries carrying an `href` (e.g. Chrome bookmark URLs)
 * map to `open-link`. Anything else falls back to `open-path` so the Explorer
 * can decide how to render it.
 *
 * Task 3 fix — auto-placement: when meta has no `cell` override for a mirror
 * item, the item is auto-placed on the next free cell below the curated grid's
 * max Y (so mirror tiles never overlap curated tiles at `[0,0]` anymore).
 * Meta `cell` overrides are always honored. `curatedItems` is optional; when
 * omitted, `maxY` is treated as -1 so the first auto-placed tile lands at
 * `[0,0]` (preserves the old default for callers that don't pass curated state).
 *
 * COMPAT: `meta.items[id].hidden === true` drops the entry.
 */
export function buildMirrorSpeedDialItems(
    listing: Array<{ name: string; kind: EntryKind; path: string; href?: string; type?: string }>,
    meta: LinkStoreMetaFile,
    _mirrorPath: string,
    curatedItems?: Array<{ cell?: [number, number] | Array<number> }>
): MirrorSpeedDialItem[] {
    if (!Array.isArray(listing)) return [];
    const metaItems = meta?.items || {};

    // WHY: compute the starting row for auto-placement = one below the
    // curated grid's max Y. No curated items → startY = 0 (maxY = -1).
    let maxCuratedY = -1;
    if (Array.isArray(curatedItems)) {
        for (const entry of curatedItems) {
            const cell = entry?.cell;
            if (!Array.isArray(cell) || cell.length < 2) continue;
            const y = Number(cell[1]) || 0;
            if (y > maxCuratedY) maxCuratedY = y;
        }
    }
    const startY = maxCuratedY + 1;

    // WHY: occupied cells start from curated cells + mirror items that carry
    // an explicit meta `cell` override. Auto-placement skips these so mirror
    // tiles never stack on top of curated or pinned tiles.
    const occupied = new Set<string>();
    if (Array.isArray(curatedItems)) {
        for (const entry of curatedItems) {
            const cell = entry?.cell;
            if (!Array.isArray(cell) || cell.length < 2) continue;
            occupied.add(`${Number(cell[0]) || 0}:${Number(cell[1]) || 0}`);
        }
    }

    // First pass: build items, collect explicit overrides + occupied set.
    const pending: Array<{ item: MirrorSpeedDialItem; hasOverride: boolean }> = [];
    for (const entry of listing) {
        if (!entry || !entry.name) continue;
        const path = String(entry.path || "");
        const id = `mirror:${path}`;
        const perId = metaItems[id] || {};
        if (perId.hidden === true) continue;

        const isDirectory = entry.kind === "directory" || path.endsWith("/");
        const href = entry.href ? String(entry.href) : "";
        const mimeType = String(entry.type || "").toLowerCase();
        const isMarkdown = /\.(md|markdown|txt)$/i.test(path) || mimeType.startsWith("text/");
        const isImage = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(path) || mimeType.startsWith("image/");

        let action: string;
        let icon: string;
        if (href) {
            action = "open-link";
            icon = "link";
        } else if (isDirectory) {
            action = "open-path";
            icon = "folder";
        } else if (isMarkdown) {
            action = "open-path";
            icon = "article";
        } else if (isImage) {
            action = "open-path";
            icon = "image";
        } else {
            action = "open-path";
            icon = "file-text";
        }

        const item: MirrorSpeedDialItem = {
            id,
            label: String(entry.name),
            action,
            icon,
            cell: [0, 0]
        };
        if (path) item.path = path;
        if (href) {
            item.href = href;
            // Task 5: resolve a favicon URL for http(s) hrefs so the mirror
            // grid shows site icons instead of a generic `link` glyph. Empty
            // return keeps the named `icon` fallback above.
            const fav = resolveEntryIcon(entry);
            if (fav) item.iconUrl = fav;
        }

        const hasOverride = Array.isArray(perId.cell);
        if (hasOverride) {
            const overrideCell = perId.cell as Array<number>;
            const x = Number(overrideCell[0]) || 0;
            const y = Number(overrideCell[1]) || 0;
            item.cell = [x, y];
            occupied.add(`${x}:${y}`);
        }
        pending.push({ item, hasOverride });
    }

    // Second pass: auto-place items without an override on the next free cell
    // starting at [0, startY], scanning column-first then row-first.
    let cursorX = 0;
    let cursorY = startY;
    const nextFreeCell = (): [number, number] => {
        for (;;) {
            const key = `${cursorX}:${cursorY}`;
            if (!occupied.has(key)) {
                occupied.add(key);
                return [cursorX, cursorY];
            }
            cursorX += 1;
            if (cursorX >= MIRROR_AUTO_PLACE_COLUMNS) {
                cursorX = 0;
                cursorY += 1;
            }
        }
    };

    const items: MirrorSpeedDialItem[] = [];
    for (const { item, hasOverride } of pending) {
        if (!hasOverride) {
            item.cell = nextFreeCell();
        }
        items.push(item);
    }
    return items;
}

/**
 * Write curated items + meta to OPFS as JSON. Each item is `/user/links/<id>.json`;
 * `meta.json` holds grid overlays. Stale item files and legacy `links.json` are
 * removed after a successful write so Explorer shows one file per tile.
 */
export async function writeLinkStore(
    io: LinkStoreIo,
    items: LinkStoreItem[],
    meta: LinkStoreMetaFile
): Promise<void> {
    const list = Array.isArray(items) ? items.filter((item) => item?.id) : [];
    if (!list.length) {
        // WHY: boot/hydrate races used to persist an empty grid and delete
        // `links.json`, wiping the only copy of curated tiles.
        if (await hasCuratedOpfsData(io)) {
            console.warn("[link-store] skip empty write; keeping existing curated OPFS files");
            return;
        }
    }
    const keep = new Set<string>();
    for (const item of list) {
        const path = itemJsonPath(item.id);
        keep.add(path);
        await io.writeText(path, JSON.stringify(item, null, 2));
    }
    const metaFile: LinkStoreMetaFile = {
        version: 1,
        mirrorPath: meta?.mirrorPath ?? null,
        items: meta?.items ?? {},
        grid: meta?.grid
    };
    await io.writeText(META_JSON, JSON.stringify(metaFile, null, 2));

    const existing = await listItemJsonPaths(io);
    if (typeof io.remove === "function") {
        for (const path of existing) {
            if (!keep.has(path)) {
                try { await io.remove(path); } catch { /* stale delete is best-effort */ }
            }
        }
        if (await io.exists(LINKS_JSON)) {
            try { await io.remove(LINKS_JSON); } catch { /* legacy split is best-effort */ }
        }
    }
}

/**
 * Browser-only OPFS IO helper. Walks/creates `/user/links/` via
 * `navigator.storage.getDirectory()` and reads/writes leaf files.
 *
 * WHY: throws on failure — `launcher-state.ts` catches and falls back to LS with
 * `console.warn("[link-store] OPFS unavailable; using localStorage")`.
 *
 * NOTE: virtual paths (`/user/links/<id>.json`) are mapped to OPFS by stripping
 * the `/user/` prefix — the PathRouter `/user/` OpfsBackend uses the same root.
 */
export async function createOpfsLinkStoreIo(): Promise<LinkStoreIo> {
    if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) {
        throw new Error("[link-store] OPFS not available");
    }
    const root = await navigator.storage.getDirectory();
    // `/user/links/...` → OPFS `links/...` (the `/user/` virtual root maps to OPFS root).
    const segmentsFor = (path: string): string[] => {
        const vpath = String(path || "").replace(/^\/+/, "");
        if (vpath.startsWith("user/")) return vpath.slice("user/".length).split("/").filter(Boolean);
        return vpath.split("/").filter(Boolean);
    };

    const resolveDir = async (dirPath: string, create: boolean): Promise<FileSystemDirectoryHandle> => {
        const segments = segmentsFor(dirPath);
        let dir: FileSystemDirectoryHandle = root;
        for (const seg of segments) {
            dir = await dir.getDirectoryHandle(seg, { create });
        }
        return dir;
    };

    const resolveHandle = async (path: string, create: boolean): Promise<FileSystemFileHandle> => {
        const segments = segmentsFor(path);
        if (!segments.length) throw new Error(`[link-store] invalid path: ${path}`);
        let dir: FileSystemDirectoryHandle = root;
        for (let i = 0; i < segments.length - 1; i += 1) {
            dir = await dir.getDirectoryHandle(segments[i], { create });
        }
        return dir.getFileHandle(segments[segments.length - 1], { create });
    };

    const toVirtualPath = (dirPath: string, name: string): string => {
        const base = String(dirPath || "/").replace(/\/+$/, "") || "";
        return `${base}/${name}`;
    };

    return {
        async readText(path) {
            try {
                const handle = await resolveHandle(path, false);
                const file = await handle.getFile();
                return file.text();
            } catch (e: any) {
                if (e?.name === "NotFoundError" || e?.name === "TypeMismatchError") return null;
                throw e;
            }
        },
        async writeText(path, text) {
            const handle = await resolveHandle(path, true);
            // @ts-ignore createWritable is part of the writable-files spec
            const writable = await handle.createWritable();
            await writable.write(text);
            await writable.close();
        },
        async exists(path) {
            try {
                await resolveHandle(path, false);
                return true;
            } catch {
                return false;
            }
        },
        async list(dirPath) {
            try {
                const dir = await resolveDir(dirPath, false);
                const out: string[] = [];
                for await (const [name, handle] of dir.entries()) {
                    // WHY: some OPFS implementations omit `kind`; skip only real directories.
                    if (handle?.kind === "directory") continue;
                    out.push(toVirtualPath(dirPath, name));
                }
                return out;
            } catch (e: any) {
                if (e?.name === "NotFoundError") return [];
                throw e;
            }
        },
        async remove(path) {
            const segments = segmentsFor(path);
            if (segments.length < 1) return;
            let dir: FileSystemDirectoryHandle = root;
            for (let i = 0; i < segments.length - 1; i += 1) {
                dir = await dir.getDirectoryHandle(segments[i], { create: false });
            }
            await dir.removeEntry(segments[segments.length - 1]);
        }
    };
}
