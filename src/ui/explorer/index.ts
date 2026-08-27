/*
 * Filename: index.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/index.ts
 * Change date: 17.00.00_21.08.2026
 * Reason: Canonical Explorer barrel — hosts re-export from here instead of forking.
 */

export { FileManager, FileManagerContent } from "./FileManager";
export { default as FileManagerDefault } from "./FileManager";
export { default as FileManagerContentDefault } from "./FileManagerContent";
export { FileOperative } from "./Operative";
export { default as FileOperativeDefault } from "./Operative";
export { ExplorerSettings, openExplorerSettings, closeExplorerSettings } from "./ExplorerSettings";
export {
    registerFsBackend,
    unregisterFsBackend,
    resolveFsBackend,
    listRegisteredRoots,
    listVirtualRootEntriesFromRouter,
    ensureDefaultFsBackends,
    subscribeFsBackendRegister,
    normalizeVirtualPath
} from "./path-router";
export type { FsBackend, FileEntryLike, EntryKind } from "./fs-backend";
export { setExplorerStorageApi, isNativeStorageAvailable } from "./storage-bridge";
export type { ExplorerStorageApi, StorageEntry, AllFilesStatus } from "./storage-bridge";
export {
    createChromeDownloadsBackend,
    DOWNLOADS_ROOT
} from "./backends/chrome-downloads-backend";
export {
    createNeutralinoFsBackend,
    isNeutralinoFilesystemAvailable,
    resolveNeutralinoHome,
    DESKTOP_ROOT
} from "./backends/neutralino-fs-backend";
export {
    addDirectoryMount,
    removeDirectoryMount,
    listExplorerMounts,
    ensureMountsRootBackend,
    MOUNTS_ROOT
} from "./mounts";
