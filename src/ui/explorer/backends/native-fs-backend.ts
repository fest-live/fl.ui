/*
 * Filename: native-fs-backend.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/backends/native-fs-backend.ts
 * Change date: 12.42.00_30.08.2026
 * Reason: remove() → storage:delete for Capacitor /sdcard/ /saf/.
 */

import { normalizeVirtualPath, type FileEntryLike, type FsBackend } from "../fs-backend.ts";
import { listNativeStorage, readNativeStorageFile, removeNativeStorage, type StorageEntry } from "../storage-bridge.ts";

const toEntries = (path: string, rows: StorageEntry[]): FileEntryLike[] => {
    const base = normalizeVirtualPath(path, true);
    return rows
        .filter((row) => row?.name)
        .map((row) => {
            const kind = row.kind === "directory" ? "directory" : "file";
            return {
                name: String(row.name),
                kind,
                path: row.path || `${base}${row.name}${kind === "directory" ? "/" : ""}`,
                type: kind === "file" ? undefined : undefined
            };
        });
};

export const createNativeFsBackend = (root: "/sdcard/" | "/saf/"): FsBackend => ({
    root,
    writable: true,
    async list(path: string) {
        const rel = normalizeVirtualPath(path, true).slice(root.length - 1) || "/";
        const rows = await listNativeStorage(root === "/saf/" ? "saf" : "sdcard", rel);
        return toEntries(path, rows);
    },
    async readFile(path: string) {
        return readNativeStorageFile(path);
    },
    async remove(path: string, _recursive?: boolean) {
        await removeNativeStorage(path);
    }
});
