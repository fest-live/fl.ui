/*
 * Filename: mounts.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/mounts.ts
 * Change date: 16.44.00_21.08.2026
 * Reason: PWA showDirectoryPicker mounts under /mounts/<id>/.
 */

import { registerDirectoryRoot, unregisterDirectoryRoot } from "@fest-lib/lure";
import { normalizeVirtualPath, type FileEntryLike, type FsBackend } from "./fs-backend.ts";
import { registerFsBackend, unregisterFsBackend } from "./path-router.ts";

export const MOUNTS_ROOT = "/mounts/";
const CATALOG_KEY = "cw::explorer::mounts";

export type ExplorerMount = {
    id: string;
    label: string;
    path: string;
};

type Catalog = { mounts: ExplorerMount[] };

const handles = new Map<string, FileSystemDirectoryHandle>();
let observer: { disconnect?: () => void } | null = null;

const readCatalog = (): Catalog => {
    try {
        const raw = localStorage.getItem(CATALOG_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && Array.isArray(parsed.mounts)) return parsed;
    } catch {
        /* ignore */
    }
    return { mounts: [] };
};

const writeCatalog = (catalog: Catalog): void => {
    try {
        localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
    } catch {
        /* ignore */
    }
};

const walkHandle = async (
    dir: FileSystemDirectoryHandle,
    virtualDir: string
): Promise<FileEntryLike[]> => {
    const entries: FileEntryLike[] = [];
    const base = normalizeVirtualPath(virtualDir, true);
    try {
        for await (const [name, handle] of dir.entries()) {
            const kind = handle.kind === "directory" ? "directory" : "file";
            entries.push({
                name,
                kind,
                path: `${base}${name}${kind === "directory" ? "/" : ""}`
            });
        }
    } catch {
        return [];
    }
    return entries;
};

const resolveNestedHandle = async (
    root: FileSystemDirectoryHandle,
    rel: string
): Promise<FileSystemDirectoryHandle | null> => {
    let dir = root;
    for (const seg of rel.split("/").filter(Boolean)) {
        try {
            dir = await dir.getDirectoryHandle(seg, { create: false });
        } catch {
            return null;
        }
    }
    return dir;
};

const createMountBackend = (mount: ExplorerMount): FsBackend => ({
    root: mount.path,
    writable: true,
    async list(path: string) {
        const handle = handles.get(mount.id);
        if (!handle) return [];
        const rel = normalizeVirtualPath(path, true).slice(mount.path.length);
        const dir = rel ? await resolveNestedHandle(handle, rel) : handle;
        if (!dir) return [];
        return walkHandle(dir, path);
    }
});

const observeHandle = (handle: FileSystemDirectoryHandle): void => {
    const Ctor = (globalThis as { FileSystemObserver?: new (cb: Function) => { observe: Function; disconnect: Function } })
        .FileSystemObserver;
    if (typeof Ctor !== "function") return;
    try {
        observer?.disconnect?.();
        const next = new Ctor(() => {
            window.dispatchEvent(new CustomEvent("cwsp:explorer-mount-change"));
        });
        void next.observe(handle);
        observer = next;
    } catch {
        /* experimental API */
    }
};

export const listExplorerMounts = (): ExplorerMount[] => readCatalog().mounts;

export const addDirectoryMount = (handle: FileSystemDirectoryHandle, label?: string): ExplorerMount => {
    const catalog = readCatalog();
    const id = `mnt-${Date.now().toString(36)}`;
    const mount: ExplorerMount = {
        id,
        label: String(label || handle.name || id),
        path: `${MOUNTS_ROOT}${id}/`
    };
    handles.set(id, handle);
    catalog.mounts.push(mount);
    writeCatalog(catalog);
    registerFsBackend(createMountBackend(mount));
    registerDirectoryRoot(mount.path, handle);
    void persistMountHandle(id, handle);
    observeHandle(handle);
    return mount;
};

export const removeDirectoryMount = (id: string): void => {
    const catalog = readCatalog();
    const mount = catalog.mounts.find((m) => m.id === id);
    catalog.mounts = catalog.mounts.filter((m) => m.id !== id);
    writeCatalog(catalog);
    handles.delete(id);
    if (mount) {
        unregisterFsBackend(mount.path);
        unregisterDirectoryRoot(mount.path);
    }
    void forgetMountHandle(id);
};

export const restoreDirectoryMounts = (): void => {
    void restorePersistedHandles().then(() => {
        for (const mount of readCatalog().mounts) {
            const handle = handles.get(mount.id);
            if (!handle) continue;
            registerFsBackend(createMountBackend(mount));
            registerDirectoryRoot(mount.path, handle);
            observeHandle(handle);
        }
    });
};

const HANDLE_DB = "cw-explorer-fs";
const HANDLE_STORE = "handles";

const openHandleDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(HANDLE_DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

const persistMountHandle = async (id: string, handle: FileSystemDirectoryHandle): Promise<void> => {
    try {
        const db = await openHandleDb();
        db.transaction(HANDLE_STORE, "readwrite").objectStore(HANDLE_STORE).put(handle, id);
    } catch {
        /* IDB / FileSystemHandle persistence is optional */
    }
};

const forgetMountHandle = async (id: string): Promise<void> => {
    try {
        const db = await openHandleDb();
        db.transaction(HANDLE_STORE, "readwrite").objectStore(HANDLE_STORE).delete(id);
    } catch {
        /* ignore */
    }
};

const restorePersistedHandles = async (): Promise<void> => {
    if (typeof indexedDB === "undefined") return;
    try {
        const db = await openHandleDb();
        const stored = await new Promise<Array<[string, FileSystemDirectoryHandle]>>((resolve, reject) => {
            const req = db.transaction(HANDLE_STORE, "readonly").objectStore(HANDLE_STORE).openCursor();
            const rows: Array<[string, FileSystemDirectoryHandle]> = [];
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor) {
                    resolve(rows);
                    return;
                }
                rows.push([String(cursor.key), cursor.value as FileSystemDirectoryHandle]);
                cursor.continue();
            };
            req.onerror = () => reject(req.error);
        });
        for (const [id, handle] of stored) {
            if (!handle || handles.has(id)) continue;
            try {
                const perm = await (handle as FileSystemDirectoryHandle & {
                    queryPermission?: (o?: { mode?: string }) => Promise<string>;
                }).queryPermission?.({ mode: "read" });
                if (perm && perm !== "granted") continue;
                handles.set(id, handle);
            } catch {
                /* skip */
            }
        }
    } catch {
        /* ignore */
    }
};

/** Placeholder so /mounts/ appears at virtual root even before a pick. */
export const ensureMountsRootBackend = (): void => {
    registerFsBackend({
        root: MOUNTS_ROOT,
        writable: false,
        async list() {
            return listExplorerMounts().map((m) => ({
                name: m.label,
                kind: "directory" as const,
                path: m.path
            }));
        }
    });
    restoreDirectoryMounts();
};
