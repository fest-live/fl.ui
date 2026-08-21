/*
 * Filename: path-router.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/path-router.ts
 * Change date and time: 08.45.00_19.08.2026
 * Reason for changes: Register `/bookmarks/` when chrome.bookmarks exists (CRX dual-registry fix).
 */

import {
  normalizeVirtualPath,
  type FsBackend,
  type FileEntryLike
} from "./fs-backend.ts";
import { createChromeBookmarksBackend } from "./backends/chrome-bookmarks-backend.ts";
import { createNativeFsBackend } from "./backends/native-fs-backend.ts";
import { ensureMountsRootBackend } from "./mounts.ts";
import { isNativeStorageAvailable } from "./storage-bridge.ts";

// Re-export the shared helper so callers can import everything from path-router.
export { normalizeVirtualPath };
export type { FsBackend, FileEntryLike, EntryKind } from "./fs-backend.ts";

/**
 * INVARIANT: registry keys are normalized directory roots (trailing slash,
 * except `/` itself). Longest-prefix match wins so nested backends (e.g.
 * `/bookmarks/` under a future `/`-rooted fallback) resolve deterministically.
 */
const registry = new Map<string, FsBackend>();

const normalizeRoot = (root: string): string => normalizeVirtualPath(root, true);

/**
 * Backend registration subscribers. WHY: SpeedDial mirror mode wants to
 * re-fetch its listing when a backend registers after mount (e.g. CRX late
 * boot, or the standalone OPFS backend registering on first browser boot).
 * Keeping this in path-router (not link-store) avoids a circular import.
 */
type BackendListener = (root: string) => void;
const backendListeners = new Set<BackendListener>();

export function subscribeFsBackendRegister(listener: BackendListener): () => void {
  if (typeof listener !== "function") return () => {};
  backendListeners.add(listener);
  return () => { backendListeners.delete(listener); };
}

const notifyBackendRegistered = (root: string): void => {
  for (const listener of backendListeners) {
    try { listener(root); } catch { /* listener errors are non-fatal */ }
  }
};

export function registerFsBackend(backend: FsBackend): void {
  if (!backend?.root) return;
  const key = normalizeRoot(backend.root);
  registry.set(key, backend);
  notifyBackendRegistered(key);
}

export function unregisterFsBackend(root: string): void {
  registry.delete(normalizeRoot(root));
}

export function listRegisteredRoots(): string[] {
  return Array.from(registry.keys());
}

/**
 * Longest-prefix match. A backend rooted at `/user/` matches `/user/links/`
 * but not `/user-other/`. The root `/` matches anything when registered.
 */
export function resolveFsBackend(path: string): FsBackend | null {
  const target = normalizeVirtualPath(path, true);
  let best: FsBackend | null = null;
  let bestLen = -1;
  for (const [root, backend] of registry) {
    if (root === "/") {
      if (bestLen < 1) { best = backend; bestLen = 1; }
      continue;
    }
    if (target === root || target.startsWith(root)) {
      if (root.length > bestLen) {
        best = backend;
        bestLen = root.length;
      }
    }
  }
  return best;
}

/**
 * Returns one directory entry per registered root (skip the bare `/` root
 * since the Explorer renders it as the virtual root frame, not as a row).
 * Names are the leading path segment of each root, sorted for stable output.
 */
export function listVirtualRootEntriesFromRouter(): FileEntryLike[] {
  const entries: FileEntryLike[] = [];
  for (const root of registry.keys()) {
    if (root === "/") continue;
    const name = root.split("/").filter(Boolean)[0];
    if (!name) continue;
    // WHY: include absolute `path` so Explorer `itemAction` navigates to
    // `/bookmarks/` (etc.) without relying on name-append from `/`.
    entries.push({ name, kind: "directory", path: root });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

/*
 * Task 3 fix — Standalone default backends.
 *
 * WHY: previously `registerFsBackend("/user/")` only ran inside the
 * `FileOperative` constructor. SpeedDial home never constructs Explorer, so
 * `resolveFsBackend("/user/")` returned null and mirror listings were empty.
 * These standalone backends are registered at module boot so any caller
 * (SpeedDial, Explorer, CRX) can list `/user/` without an Operative instance.
 *
 * `/user/` maps to OPFS root via `navigator.storage.getDirectory()`. The
 * virtual `/user/` prefix is stripped, mirroring `createOpfsLinkStoreIo` in
 * link-store. In node/tests `navigator.storage` is absent → list returns [].
 *
 * `/assets/` is a lightweight read-only lister. In node/tests it returns []
 * (no Cache API). Explorer lists assets via its own `listAssetEntries`
 * branch, so an empty lister here is safe and keeps the root visible in
 * `listVirtualRootEntriesFromRouter`.
 *
 * INVARIANT: `ensureDefaultFsBackends` is self-healing — it re-registers any
 * missing default backend rather than no-op behind a one-shot flag, so it
 * recovers after a test or caller unregisters a default root.
 */
const stripUserPrefix = (path: string): string => {
  const vpath = String(path || "").replace(/^\/+/, "");
  if (vpath.startsWith("user/")) return "/" + vpath.slice("user/".length);
  return "/" + vpath;
};

const listOpfsUserDirectory = async (path: string): Promise<FileEntryLike[]> => {
  const nav: any = (typeof navigator !== "undefined") ? (navigator as any) : null;
  const getDir = nav?.storage?.getDirectory;
  if (typeof getDir !== "function") return [];
  let root: any;
  try {
    root = await getDir.call(nav.storage);
  } catch {
    return [];
  }
  if (!root) return [];
  const relative = stripUserPrefix(path);
  const segments = relative.split("/").filter(Boolean);
  let dir: any = root;
  for (const seg of segments) {
    try {
      dir = await dir.getDirectoryHandle(seg, { create: false });
    } catch {
      return [];
    }
  }
  const entries: FileEntryLike[] = [];
  try {
    for await (const [name, handle] of dir.entries()) {
      const kind = handle?.kind === "directory" ? "directory" : "file";
      // WHY (final review #2): include absolute virtual `path` so SpeedDial
      // mirror ids become `mirror:/user/foo/` (folders) / `mirror:/user/bar.md`
      // (files) and folder tiles open via `open-path`. Without `path` the
      // mirror merge drops entries because `buildMirrorSpeedDialItems` keys
      // on `entry.path`.
      const base = normalizeVirtualPath(path, true);
      const childPath = `${base}${name}${kind === "directory" ? "/" : ""}`;
      entries.push({ name, kind, path: childPath });
    }
  } catch {
    return [];
  }
  return entries;
};

export function ensureDefaultFsBackends(): void {
  // WHY: self-heal — tests and callers may `unregisterFsBackend("/user/")`
  // (e.g. the path-router test cleans up its own registrations). Re-running
  // this function must restore the defaults rather than no-op behind a flag.
  if (!resolveFsBackend("/user/")) {
    registerFsBackend({
      root: "/user/",
      writable: true,
      async list(path: string) {
        return listOpfsUserDirectory(path);
      }
    });
  }
  if (!resolveFsBackend("/assets/")) {
    registerFsBackend({
      root: "/assets/",
      writable: false,
      async list() {
        // Lightweight read-only lister. Explorer lists assets via its own
        // `listAssetEntries` branch; this backend only keeps the root visible
        // in `listVirtualRootEntriesFromRouter` for SpeedDial/CRX callers.
        return [];
      }
    });
  }
  /*
   * WHY (CRX dual-registry): NTP boot registers `/bookmarks/` via
   * `fl-ui/explorer/path-router` (lands in `com/app.js`), but Explorer's
   * Operative imports `./path-router` and gets a *second* Map. Self-register
   * here whenever `chrome.bookmarks` exists so every path-router instance
   * surfaces `/bookmarks/` in the virtual root. Non-CRX hosts skip this.
   */
  if (!resolveFsBackend("/bookmarks/")) {
    const chromeAny: any = (globalThis as any)?.chrome;
    if (chromeAny?.bookmarks) {
      const backend = createChromeBookmarksBackend(chromeAny.bookmarks);
      if (backend) registerFsBackend(backend);
    }
  }
  /*
   * WHY: /sdcard/ and /saf/ are native-only. PWA mounts live under /mounts/
   * from showDirectoryPicker. Registering here (not only in Operative) keeps
   * the virtual-root listing consistent for Speed Dial / CRX callers too.
   */
  if (isNativeStorageAvailable()) {
    if (!resolveFsBackend("/sdcard/")) registerFsBackend(createNativeFsBackend("/sdcard/"));
    if (!resolveFsBackend("/saf/")) registerFsBackend(createNativeFsBackend("/saf/"));
  }
  if (!resolveFsBackend("/mounts/")) ensureMountsRootBackend();
  observeUserFileSystem();
}

/**
 * WHY: FileSystemObserver is Chromium-experimental. When present, OPFS
 * mutations refresh Explorer without polling. Cap / SAF fall back to the
 * toolbar refresh and `cwsp:explorer-mount-change`.
 */
const observeUserFileSystem = (): void => {
  if (typeof window === "undefined") return;
  const g = globalThis as {
    FileSystemObserver?: new (cb: () => void) => { observe: (h: unknown) => Promise<void> };
    navigator?: { storage?: { getDirectory?: () => Promise<unknown> } };
  };
  const Ctor = g.FileSystemObserver;
  const getDir = g.navigator?.storage?.getDirectory;
  if (typeof Ctor !== "function" || typeof getDir !== "function") return;
  if ((globalThis as { __CWSP_USER_FS_OBS__?: boolean }).__CWSP_USER_FS_OBS__) return;
  (globalThis as { __CWSP_USER_FS_OBS__?: boolean }).__CWSP_USER_FS_OBS__ = true;
  void getDir.call(g.navigator?.storage).then((root) => {
    const observer = new Ctor(() => {
      window.dispatchEvent(new CustomEvent("cwsp:explorer-mount-change"));
    });
    return observer.observe(root);
  }).catch(() => {
    (globalThis as { __CWSP_USER_FS_OBS__?: boolean }).__CWSP_USER_FS_OBS__ = false;
  });
};

// Register at module boot so callers don't need to call ensureDefaultFsBackends.
ensureDefaultFsBackends();
