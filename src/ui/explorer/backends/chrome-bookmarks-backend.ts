/*
 * Filename: chrome-bookmarks-backend.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/backends/chrome-bookmarks-backend.ts
 * Change date and time: 07.50.00_19.08.2026
 * Reason for changes: Task 4 — Chrome Bookmarks API ↔ FsBackend adapter. Maps
 *   `/bookmarks/<id>/.../<id>` paths to live chrome.bookmarks nodes so the
 *   Explorer Operative can browse and edit Chrome bookmarks (CRX only).
 *
 * INVARIANT:
 *   - Folders map to directory paths ending with `/` (e.g. `/bookmarks/1/`).
 *   - URL entries map to file paths with no trailing slash (e.g. `/bookmarks/10`).
 *   - Path segments are stable Chrome bookmark ids so renames do not break links.
 *   - This backend never stores file bytes; `writeFile` throws a clear error.
 */

import {
    normalizeVirtualPath,
    type FsBackend,
    type FileEntryLike
} from "../fs-backend.ts";

/**
 * Minimal subset of `chrome.bookmarks` this adapter depends on. Kept structural
 * so unit tests can pass a plain mock without loading the real `chrome` types.
 */
export interface ChromeBookmarksApi {
    getTree(): Promise<ChromeBookmarkNode[]>;
    getChildren(id: string): Promise<ChromeBookmarkNode[]>;
    create(opts: { parentId: string; title: string; url?: string }): Promise<ChromeBookmarkNode>;
    update(id: string, changes: { title?: string; url?: string }): Promise<ChromeBookmarkNode>;
    move(id: string, dest: { parentId: string; index?: number }): Promise<ChromeBookmarkNode>;
    remove(id: string): Promise<void>;
    removeTree(id: string): Promise<void>;
    onCreated?: ChromeBookmarkEventSlot;
    onChanged?: ChromeBookmarkEventSlot;
    onRemoved?: ChromeBookmarkEventSlot;
    onMoved?: ChromeBookmarkEventSlot;
}

export interface ChromeBookmarkNode {
    id: string;
    title?: string;
    url?: string;
    parentId?: string;
    children?: ChromeBookmarkNode[];
}

export interface ChromeBookmarkEventSlot {
    addListener(cb: (...args: any[]) => void): () => void;
}

const BOOKMARKS_ROOT = "/bookmarks/";

/**
 * chrome.bookmarks is callback-first historically; modern Chromium returns a
 * Promise when the callback arg is omitted. Normalize both shapes so
 * `await api.getTree()` never resolves to `undefined` (empty Explorer list).
 */
function promisifyBookmarksApi(api: ChromeBookmarksApi): ChromeBookmarksApi {
    const chromeErr = (): Error | null => {
        try {
            const err = (globalThis as any)?.chrome?.runtime?.lastError;
            return err ? new Error(String(err.message || err)) : null;
        } catch {
            return null;
        }
    };
    const call = <T>(method: keyof ChromeBookmarksApi, ...args: unknown[]): Promise<T> => {
        const fn = (api as any)?.[method];
        if (typeof fn !== "function") {
            return Promise.reject(new Error(`chrome.bookmarks.${String(method)} missing`));
        }
        try {
            const result = fn.apply(api, args);
            if (result != null && typeof (result as Promise<T>).then === "function") {
                return result as Promise<T>;
            }
        } catch (e) {
            return Promise.reject(e);
        }
        return new Promise<T>((resolve, reject) => {
            try {
                fn.apply(api, [
                    ...args,
                    (res: T) => {
                        const err = chromeErr();
                        if (err) reject(err);
                        else resolve(res);
                    }
                ]);
            } catch (e) {
                reject(e);
            }
        });
    };
    return {
        getTree: () => call("getTree"),
        getChildren: (id) => call("getChildren", id),
        create: (opts) => call("create", opts),
        update: (id, changes) => call("update", id, changes),
        move: (id, dest) => call("move", id, dest),
        remove: (id) => call("remove", id),
        removeTree: (id) => call("removeTree", id),
        onCreated: api.onCreated,
        onChanged: api.onChanged,
        onRemoved: api.onRemoved,
        onMoved: api.onMoved
    };
}

const toEntry = (node: ChromeBookmarkNode): FileEntryLike => {
    const isUrl = typeof node.url === "string" && node.url.length > 0;
    if (isUrl) {
        return {
            name: node.title || node.id,
            kind: "file",
            href: node.url,
            type: "text/uri-list",
            bookmarkId: node.id,
            path: `${BOOKMARKS_ROOT}${node.id}`
        };
    }
    return {
        name: node.title || node.id,
        kind: "directory",
        bookmarkId: node.id,
        path: `${BOOKMARKS_ROOT}${node.id}/`
    };
};

/**
 * Extract the trailing path segment as a Chrome bookmark id.
 * `/bookmarks/1/` → "1"; `/bookmarks/1/10` → "10"; `/bookmarks/` → "" (root).
 */
const lastId = (path: string): string => {
    const norm = normalizeVirtualPath(path, false);
    const segments = norm.split("/").filter(Boolean);
    // Drop the leading `bookmarks` segment; the rest are bookmark ids.
    const ids = segments[0] === "bookmarks" ? segments.slice(1) : segments;
    return ids[ids.length - 1] ?? "";
};

/**
 * `true` when the path addresses a folder (ends with `/`).
 *
 * WHY (final review #3): the previous impl called `normalizeVirtualPath(path,
 * true)` which **forces** a trailing slash onto every input, so URL bookmark
 * paths like `/bookmarks/10` were rewritten to `/bookmarks/10/` and `remove`
 * always picked `removeTree`. Chrome `remove` rejects folders-with-children
 * and `removeTree` rejects URL nodes, so URL deletes failed. We now collapse
 * duplicate slashes only and inspect the original trailing slash, which the
 * backend's own `toEntry` sets deterministically (folders end with `/`, URL
 * nodes do not).
 */
const isFolderPath = (path: string): boolean => {
    const raw = String(path || "").replace(/\/{2,}/g, "/");
    return raw.length > 1 && raw.endsWith("/");
};

export interface ChromeBookmarksBackend extends FsBackend {
    subscribeBookmarksInvalidation(cb: () => void): () => void;
}

/**
 * Build a FsBackend backed by `chrome.bookmarks`. Pass the real API in CRX
 * boot, or a mock in tests. Returns `null` if no API is provided so callers
 * can short-circuit registration outside CRX.
 */
export function createChromeBookmarksBackend(api?: ChromeBookmarksApi): ChromeBookmarksBackend | null {
    if (!api) return null;
    const bookmarks = promisifyBookmarksApi(api);

    const list = async (path: string): Promise<FileEntryLike[]> => {
        const norm = normalizeVirtualPath(path, true);
        if (norm === BOOKMARKS_ROOT) {
            const tree = await bookmarks.getTree();
            const entries: FileEntryLike[] = [];
            for (const root of tree || []) {
                for (const child of root?.children ?? []) {
                    entries.push(toEntry(child));
                }
            }
            return entries;
        }
        const id = lastId(norm);
        if (!id) return [];
        const children = await bookmarks.getChildren(id);
        return (children || []).map(toEntry);
    };

    const mkdir = async (parentPath: string, name: string): Promise<void> => {
        const parentId = lastId(parentPath) || "0";
        await bookmarks.create({ parentId, title: name });
    };

    const createUrl = async (parentPath: string, title: string, url: string): Promise<void> => {
        const parentId = lastId(parentPath) || "0";
        await bookmarks.create({ parentId, title, url });
    };

    const rename = async (path: string, newName: string): Promise<void> => {
        const id = lastId(path);
        if (!id) return;
        await bookmarks.update(id, { title: newName });
    };

    const move = async (fromPath: string, toDirPath: string): Promise<void> => {
        const id = lastId(fromPath);
        const parentId = lastId(toDirPath) || "0";
        if (!id) return;
        await bookmarks.move(id, { parentId });
    };

    const remove = async (path: string, _recursive?: boolean): Promise<void> => {
        const id = lastId(path);
        if (!id) return;
        if (isFolderPath(path)) {
            await bookmarks.removeTree(id);
        } else {
            await bookmarks.remove(id);
        }
    };

    const writeFile = async (_parentPath: string, _file: File): Promise<void> => {
        throw new Error("bookmarks backend does not store file bytes");
    };

    const invalidationListeners = new Set<() => void>();
    const emitInvalidation = (): void => {
        for (const cb of invalidationListeners) {
            try { cb(); } catch { /* listener errors are non-fatal */ }
        }
    };

    // INVARIANT: chrome.bookmarks event listeners are attached once for the
    // backend lifetime and never torn down. WHY: the previous design detached
    // them when the last subscriber left, but never re-attached on a later
    // subscribe — so navigating away from `/bookmarks/` and back would leave
    // the backend silent (chrome events still firing into a dead `emitInvalidation`
    // that had been removed via the mock's `addListener` return value). Keeping
    // the chrome listeners alive means `emitInvalidation` always runs and simply
    // iterates the (possibly empty) subscriber set.
    if (bookmarks.onCreated?.addListener) bookmarks.onCreated.addListener(emitInvalidation);
    if (bookmarks.onChanged?.addListener) bookmarks.onChanged.addListener(emitInvalidation);
    if (bookmarks.onRemoved?.addListener) bookmarks.onRemoved.addListener(emitInvalidation);
    if (bookmarks.onMoved?.addListener) bookmarks.onMoved.addListener(emitInvalidation);

    const subscribeBookmarksInvalidation = (cb: () => void): (() => void) => {
        if (typeof cb !== "function") return () => {};
        invalidationListeners.add(cb);
        return () => {
            invalidationListeners.delete(cb);
        };
    };

    return {
        root: BOOKMARKS_ROOT,
        writable: true,
        list,
        mkdir,
        createUrl,
        rename,
        move,
        remove,
        writeFile,
        subscribeBookmarksInvalidation
    };
}
