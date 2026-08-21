/*
 * Filename: native-fs-backend.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/backends/native-fs-backend.ts
 * Change date: 16.42.00_21.08.2026
 * Reason: /sdcard/ and /saf/ FsBackends via Capacitor storage IPC.
 */

import { normalizeVirtualPath, type FileEntryLike, type FsBackend } from "../fs-backend.ts";
import { listNativeStorage, type StorageEntry } from "../storage-bridge.ts";

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
    writable: root === "/sdcard/",
    async list(path: string) {
        const rel = normalizeVirtualPath(path, true).slice(root.length - 1) || "/";
        const rows = await listNativeStorage(root === "/saf/" ? "saf" : "sdcard", rel);
        return toEntries(path, rows);
    }
});
