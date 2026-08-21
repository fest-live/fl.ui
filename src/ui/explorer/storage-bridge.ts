/*
 * Filename: storage-bridge.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/storage-bridge.ts
 * Change date: 16.40.00_21.08.2026
 * Reason: Explorer IPC for Android all-files / SAF + PWA directory picker.
 */

export type StorageEntry = {
    name: string;
    kind: "file" | "directory";
    path?: string;
    size?: number;
    lastModified?: number;
};

export type AllFilesStatus = {
    allFilesAccess: boolean;
    runtimeGranted?: boolean;
    note?: string;
};

export type ExplorerStorageApi = {
    list?: (root: "sdcard" | "saf", path?: string) => Promise<StorageEntry[]>;
    pickSaf?: () => Promise<string>;
    allFilesStatus?: () => Promise<AllFilesStatus>;
    requestAllFiles?: () => Promise<boolean>;
};

let api: ExplorerStorageApi | null = null;

export const setExplorerStorageApi = (next: ExplorerStorageApi | null): void => {
    api = next;
};

const capacitorInvoke = async (
    channel: string,
    payload: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
    const plugin = (globalThis as { Capacitor?: { Plugins?: { CwsBridge?: { invoke?: Function } } } })
        .Capacitor?.Plugins?.CwsBridge;
    if (typeof plugin?.invoke !== "function") return { ok: false };
    const r = await plugin.invoke({ channel, payload });
    return (r?.echo || r || {}) as Record<string, unknown>;
};

export const isNativeStorageAvailable = (): boolean => {
    if (api?.list) return true;
    try {
        const c = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        return typeof c?.isNativePlatform === "function" && c.isNativePlatform();
    } catch {
        return false;
    }
};

export const listNativeStorage = async (
    root: "sdcard" | "saf",
    path = "/"
): Promise<StorageEntry[]> => {
    if (api?.list) return api.list(root, path);
    const echo = await capacitorInvoke("storage:list", { root, path });
    const rows = (echo.entries || echo.files) as StorageEntry[] | undefined;
    return Array.isArray(rows) ? rows : [];
};

export const pickSafTree = async (): Promise<string> => {
    if (api?.pickSaf) return api.pickSaf();
    const echo = await capacitorInvoke("storage:pick-saf", {});
    return String(echo.uri || echo.treeUri || "");
};

export const getAllFilesStatus = async (): Promise<AllFilesStatus> => {
    if (api?.allFilesStatus) return api.allFilesStatus();
    const echo = await capacitorInvoke("storage:all-files-status", {});
    return {
        allFilesAccess: echo.allFilesAccess === true,
        runtimeGranted: echo.runtimeGranted === true,
        note: echo.note ? String(echo.note) : undefined
    };
};

export const requestAllFilesAccess = async (): Promise<boolean> => {
    if (api?.requestAllFiles) return api.requestAllFiles();
    const echo = await capacitorInvoke("storage:all-files-request", {});
    return echo.ok === true || echo.opened === true;
};

export const canShowDirectoryPicker = (): boolean =>
    typeof (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";

export const pickBrowserDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
    const pick = (globalThis as { showDirectoryPicker?: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker;
    if (typeof pick !== "function") return null;
    try {
        return await pick({ mode: "readwrite" });
    } catch {
        return null;
    }
};
