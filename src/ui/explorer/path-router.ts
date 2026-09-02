/*
 * Filename: path-router.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/path-router.ts
 * FIND:idb-fs
 * TAG:explorer-adapters,opfs
 * Change date and time: 08.45.00_19.08.2026
 * Reason for changes: Register `/bookmarks/` + `/downloads/` on CRX; `/desktop/` on Neutralino.
 */

import {
  normalizeVirtualPath,
  toExplorerStoragePath,
  type FsBackend,
  type FileEntryLike
} from "./fs-backend.js";
import { createChromeBookmarksBackend } from "./backends/chrome-bookmarks-backend.js";
import { createChromeDownloadsBackend } from "./backends/chrome-downloads-backend.js";
import { createNativeFsBackend } from "./backends/native-fs-backend.js";
import {
    createNeutralinoFsBackend,
    isNeutralinoFilesystemAvailable,
    resolveNeutralinoHome
} from "./backends/neutralino-fs-backend.js";
import { ensureMountsRootBackend } from "./mounts.js";
import { isNativeStorageAvailable } from "./storage-bridge.js";

// Re-export the shared helper so callers can import everything from path-router.
export { normalizeVirtualPath, toExplorerStoragePath };
export type { FsBackend, FileEntryLike, EntryKind } from "./fs-backend.js";

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
  bindFsBackendToProvide(backend);
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
 * `/user/` maps to OPFS while that backend is active, otherwise IndexedDB.
 * `/idb/` is registered only while OPFS is still the `/user/` backend.
 * In node/tests `navigator.storage` and IndexedDB are absent → list returns [].
 *
 * `/assets/` lists a backend-mounted directory over WS / Socket.IO / HTTPS
 * when the host exposes `/ssre/fs`. Otherwise Explorer falls back to seed +
 * Cache API + same-origin `fetch`.
 *
 * INVARIANT: `ensureDefaultFsBackends` is self-healing — it re-registers any
 * missing default backend rather than no-op behind a one-shot flag, so it
 * recovers after a test or caller unregisters a default root.
 */
const OPFS_SUPPORT_KEY = "cwsp.opfs.enabled";

const isOpfsSupportEnabledSync = (): boolean => {
  try {
    if (typeof localStorage === "undefined") return true;
    const value = localStorage.getItem(OPFS_SUPPORT_KEY);
    return value !== "0" && value !== "false";
  } catch {
    return true;
  }
};

const isOpfsCapabilityAvailableSync = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";

const isOpfsBackendActiveSync = (): boolean =>
  isOpfsCapabilityAvailableSync() && isOpfsSupportEnabledSync();

const stripStoragePrefix = (path: string, scope: "user" | "idb"): string => {
  const vpath = String(path || "").replace(/^\/+/, "");
  const prefix = `${scope}/`;
  if (vpath.startsWith(prefix)) return `/${vpath.slice(prefix.length)}`;
  if (vpath === scope) return "/";
  return `/${vpath}`;
};

const listHandleDirectory = async (root: any, path: string): Promise<FileEntryLike[]> => {
  if (!root) return [];
  const scope = normalizeVirtualPath(path, true).startsWith("/idb/") ? "idb" : "user";
  const relative = stripStoragePrefix(path, scope);
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

const readHandleFile = async (root: any, path: string, scope: "user" | "idb"): Promise<File | null> => {
  if (!root) return null;
  const relative = stripStoragePrefix(path, scope);
  const segments = relative.split("/").filter(Boolean);
  if (!segments.length) return null;
  let dir: any = root;
  for (const seg of segments.slice(0, -1)) {
    try {
      dir = await dir.getDirectoryHandle(seg, { create: false });
    } catch {
      return null;
    }
  }
  try {
    const handle = await dir.getFileHandle(segments[segments.length - 1], { create: false });
    return await handle.getFile();
  } catch {
    return null;
  }
};

const bindFsBackendToProvide = (backend: FsBackend): void => {
  if (backend.root === "/bookmarks/" || backend.root === "/downloads/") return;
  void import("@fest-lib/lure").then(({ registerProvideBackend }) => {
    registerProvideBackend({
      root: backend.root,
      list: async (path) => {
        const rows = await backend.list(path);
        const base = normalizeVirtualPath(path, true);
        return rows.map((row) => ({
          name: row.name,
          kind: row.kind,
          path: row.path || `${base}${row.name}${row.kind === "directory" ? "/" : ""}`
        }));
      },
      readFile: backend.readFile,
      writeFile: backend.writeFile
        ? async (path, file) => {
            const slash = String(path || "").lastIndexOf("/");
            const parent = slash >= 0 ? path.slice(0, slash + 1) : backend.root;
            await backend.writeFile?.(parent, file);
            return true;
          }
        : undefined
    });
  }).catch(() => { /* node tests / missing lure export */ });
};

const loadIdbRoot = async (): Promise<any> => {
  if (typeof indexedDB === "undefined") return null;
  try {
    const { getIdbRoot } = await import("@fest-lib/lure");
    return await getIdbRoot();
  } catch {
    return null;
  }
};

const resolveUserHandleRoot = async (): Promise<any> => {
  if (isOpfsBackendActiveSync()) {
    try {
      return await navigator.storage.getDirectory();
    } catch {
      return null;
    }
  }
  return loadIdbRoot();
};

const createStorageFsBackend = (root: "/user/" | "/idb/", getRoot: () => Promise<any>): FsBackend => {
  const scope = root === "/idb/" ? "idb" : "user";
  return {
    root,
    writable: true,
    async list(path: string) {
      return listHandleDirectory(await getRoot().catch(() => null), path);
    },
    async readFile(path: string) {
      return readHandleFile(await getRoot().catch(() => null), path, scope);
    },
    async mkdir(parentPath: string, name: string) {
      const handleRoot = await getRoot();
      if (!handleRoot) return;
      const relative = stripStoragePrefix(parentPath, scope);
      const segments = [...relative.split("/").filter(Boolean), String(name || "").trim()].filter(Boolean);
      let dir: any = handleRoot;
      for (const seg of segments) {
        dir = await dir.getDirectoryHandle(seg, { create: true });
      }
    },
    async writeFile(parentPath: string, file: File) {
      const handleRoot = await getRoot();
      if (!handleRoot || !file) return;
      const relative = stripStoragePrefix(parentPath, scope);
      const segments = relative.split("/").filter(Boolean);
      let dir: any = handleRoot;
      for (const seg of segments) {
        dir = await dir.getDirectoryHandle(seg, { create: true });
      }
      const fileHandle = await dir.getFileHandle(file.name || `file-${Date.now()}`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    },
    async remove(path: string, recursive = true) {
      const handleRoot = await getRoot();
      if (!handleRoot) return;
      const relative = stripStoragePrefix(path, scope).replace(/\/+$/g, "");
      const segments = relative.split("/").filter(Boolean);
      if (!segments.length) return;
      const name = segments.pop() as string;
      let dir: any = handleRoot;
      for (const seg of segments) {
        dir = await dir.getDirectoryHandle(seg, { create: false });
      }
      await dir.removeEntry(name, { recursive });
    }
  };
};

export function ensureDefaultFsBackends(): void {
  // WHY: self-heal — tests and callers may `unregisterFsBackend("/user/")`
  // (e.g. the path-router test cleans up its own registrations). Re-running
  // this function must restore the defaults rather than no-op behind a flag.
  if (!resolveFsBackend("/user/")) {
    registerFsBackend(createStorageFsBackend("/user/", resolveUserHandleRoot));
  }
  if (isOpfsBackendActiveSync() && typeof indexedDB !== "undefined") {
    if (!resolveFsBackend("/idb/")) {
      registerFsBackend(createStorageFsBackend("/idb/", loadIdbRoot));
    }
  } else {
    unregisterFsBackend("/idb/");
    void import("@fest-lib/lure").then(({ unregisterProvideBackend }) => {
      unregisterProvideBackend("/idb/");
    }).catch(() => {});
  }
  if (!resolveFsBackend("/assets/")) {
    registerFsBackend({
      root: "/assets/",
      writable: false,
      async list(path: string) {
        try {
          const { tryRemoteMountedList } = await import("@fest-lib/lure");
          return (await tryRemoteMountedList(path)) ?? [];
        } catch {
          return [];
        }
      },
      async readFile(path: string) {
        const p = String(path || "").trim();
        if (!p || p.endsWith("/")) return null;
        try {
          const { tryRemoteMountedRead } = await import("@fest-lib/lure");
          const remote = await tryRemoteMountedRead(p);
          if (remote) return remote;
        } catch { /* HTTPS / WS host missing */ }
        try {
          const r = await fetch(p);
          if (!r?.ok) return null;
          const blob = await r.blob();
          const name = p.slice(p.lastIndexOf("/") + 1) || "asset";
          return new File([blob], name, { type: blob.type || "" });
        } catch {
          return null;
        }
      }
    });
  }
  void import("@fest-lib/lure").then(({ ensureRemoteMountedFs }) => {
    void ensureRemoteMountedFs();
  }).catch(() => {});
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
  if (!resolveFsBackend("/downloads/")) {
    const chromeAny: any = (globalThis as any)?.chrome;
    if (chromeAny?.downloads) {
      const backend = createChromeDownloadsBackend(chromeAny.downloads);
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
  /*
   * WHY: Neutralino desktop has no OPFS / SAF. `/desktop/` is the user home tree.
   * Register async after `os.getPath("home")` so the virtual root appears once ready.
   */
  if (isNeutralinoFilesystemAvailable() && !resolveFsBackend("/desktop/")) {
    void resolveNeutralinoHome().then((home) => {
      if (!home || resolveFsBackend("/desktop/")) return;
      const backend = createNeutralinoFsBackend(home);
      if (backend) registerFsBackend(backend);
    });
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
