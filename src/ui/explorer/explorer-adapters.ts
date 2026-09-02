/*
 * Filename: explorer-adapters.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/explorer-adapters.ts
 * FIND:explorer-adapters
 * TAG:explorer,settings-host
 * Change date and time: 01.35.00_30.08.2026
 * Reason for changes: Name the FS adapter libs. One Explorer; hosts register backends, they do not fork the view.
 */

import { ensureDefaultFsBackends } from "./path-router.js";

/**
 * Virtual roots. Implementation lives in `path-router` + `backends/*`.
 * OPFS is `/user/` while supported. IndexedDB is `/idb/` beside OPFS, or `/user/`
 * when OPFS is missing or turned off. `provide()` reads files and directories
 * on these roots plus Capacitor `/sdcard/` `/saf/`.
 * HTTP bundled files are `/assets/` — listed from a backend mount via
 * WS / Socket.IO / HTTPS when `/ssre/fs` is up, else seed + cache + fetch.
 * CRX favorites are `/bookmarks/`. Android storage is `/sdcard/` `/saf/`.
 */
export const EXPLORER_ADAPTER_LIBS = [
    { id: "opfs", root: "/user/", kind: "opfs" },
    { id: "idb", root: "/idb/", kind: "idb" },
    { id: "http-assets", root: "/assets/", kind: "http" },
    { id: "crx-favorites", root: "/bookmarks/", kind: "crx" },
    { id: "crx-downloads", root: "/downloads/", kind: "crx" },
    { id: "android-fs", root: "/sdcard/", kind: "capacitor" },
    { id: "android-saf", root: "/saf/", kind: "capacitor" },
    { id: "directory-picker", root: "/mounts/", kind: "picker" },
    { id: "desktop-fs", root: "/desktop/", kind: "neutralino" }
] as const;

export type ExplorerAdapterId = (typeof EXPLORER_ADAPTER_LIBS)[number]["id"];

/** Register every adapter this host can actually talk to. */
export const ensureExplorerAdapters = (): void => {
    ensureDefaultFsBackends();
};
