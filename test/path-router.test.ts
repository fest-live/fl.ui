/*
 * Filename: path-router.test.ts
 * FullPath: modules/projects/fl.ui/test/path-router.test.ts
 * Change date and time: 07.25.00_19.08.2026
 * Reason for changes: Task 1 — failing PathRouter tests (registry + normalize + resolve).
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeVirtualPath,
  registerFsBackend,
  unregisterFsBackend,
  resolveFsBackend,
  listVirtualRootEntriesFromRouter,
  ensureDefaultFsBackends,
  subscribeFsBackendRegister,
  type FsBackend,
  type FileEntryLike
} from "../src/ui/explorer/path-router.ts";
import { faviconForHref, resolveEntryIcon, buildExplorerDragPayload } from "../src/ui/explorer/fs-backend.ts";

const makeBackend = (root: string, writable = true): FsBackend => ({
  root,
  writable,
  async list() {
    return [] as FileEntryLike[];
  }
});

test("normalizeVirtualPath forces trailing slash for directories", () => {
  assert.equal(normalizeVirtualPath("/user"), "/user/");
  assert.equal(normalizeVirtualPath("/user/"), "/user/");
  assert.equal(normalizeVirtualPath("/"), "/");
});

test("resolveFsBackend picks longest matching root", () => {
  registerFsBackend(makeBackend("/user/"));
  registerFsBackend(makeBackend("/bookmarks/"));
  assert.equal(resolveFsBackend("/user/links/")?.root, "/user/");
  assert.equal(resolveFsBackend("/bookmarks/1/2")?.root, "/bookmarks/");
  assert.equal(resolveFsBackend("/nope"), null);
  unregisterFsBackend("/user/");
  unregisterFsBackend("/bookmarks/");
});

test("listVirtualRootEntriesFromRouter only includes registered roots", () => {
  registerFsBackend(makeBackend("/user/"));
  registerFsBackend(makeBackend("/assets/", false));
  const names = listVirtualRootEntriesFromRouter().map((e) => e.name).sort();
  assert.deepEqual(names, ["assets", "user"]);
  assert.equal(resolveFsBackend("/bookmarks/"), null);
  unregisterFsBackend("/user/");
  unregisterFsBackend("/assets/");
});

test("ensureDefaultFsBackends registers /user/ and /assets/ at module boot", async () => {
  // WHY: Task 3 fix — default backends must exist without constructing
  // FileOperative. ensureDefaultFsBackends is idempotent and already ran at
  // module load; calling it again must not throw or duplicate.
  ensureDefaultFsBackends();
  ensureDefaultFsBackends();
  const user = resolveFsBackend("/user/links/");
  const assets = resolveFsBackend("/assets/icons/");
  assert.equal(user?.root, "/user/");
  assert.equal(assets?.root, "/assets/");
  // WHY: in node (no navigator.storage) the standalone /user/ list returns [].
  const listing = await user!.list("/user/");
  assert.deepEqual(listing, []);
  const assetListing = await assets!.list("/assets/");
  assert.deepEqual(assetListing, []);
});

// ---- Final review #2: OPFS /user/ list entries must carry absolute `path` ----

/** Minimal OPFS dir-handle mock: `entries()` yields name→handle pairs. */
const makeOpfsDirHandle = (entries: Array<[string, "file" | "directory"]>): any => {
  const list = entries.map(([name, kind]) => [name, { kind }]);
  return {
    kind: "directory",
    entries: async function* () { for (const e of list) yield e as any; },
    getDirectoryHandle: async (name: string) => {
      const hit = entries.find(([n]) => n === name && n !== undefined);
      if (!hit || hit[1] !== "directory") throw new Error("not found");
      return makeOpfsDirHandle([]);
    }
  };
};

/**
 * Install a fake OPFS root on the current `navigator.storage` for the test,
 * then restore it. WHY: Node 21+ exposes `globalThis.navigator` as a
 * getter-only property, so we cannot reassign `globalThis.navigator`; we
 * define `storage` on the existing navigator object instead.
 */
const withMockOpfsRoot = async <T>(root: any, fn: () => Promise<T>): Promise<T> => {
  const nav = (globalThis as any).navigator;
  const savedStorage = nav?.storage;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    try {
      if (savedStorage === undefined) {
        delete nav.storage;
      } else {
        Object.defineProperty(nav, "storage", { value: savedStorage, configurable: true, writable: true });
      }
    } catch { /* best-effort */ }
  };
  try {
    Object.defineProperty(nav, "storage", {
      value: { getDirectory: async () => root },
      configurable: true,
      writable: true
    });
    return await fn();
  } finally {
    restore();
  }
};

test("/user/ backend list entries include absolute virtual path for files and folders", async () => {
  // WHY (final review #2): without `path`, SpeedDial mirror merge drops
  // entries because `buildMirrorSpeedDialItems` keys ids on `entry.path`
  // (e.g. `mirror:/user/foo/`). Verify the standalone OPFS backend stamps
  // absolute virtual paths with the correct trailing-slash semantics.
  const dir = makeOpfsDirHandle([
    ["foo", "directory"],
    ["note.md", "file"],
    ["pic.png", "file"]
  ]);
  await withMockOpfsRoot(dir, async () => {
    // Force re-register the /user/ backend so it captures the mock navigator.
    unregisterFsBackend("/user/");
    ensureDefaultFsBackends();
    const user = resolveFsBackend("/user/");
    assert.ok(user, "/user/ backend registered");
    const entries = await user!.list("/user/");
    const byName = new Map(entries.map((e) => [e.name, e]));
    assert.equal(byName.get("foo")?.kind, "directory");
    assert.equal(byName.get("foo")?.path, "/user/foo/", "folder path ends with /");
    assert.equal(byName.get("note.md")?.kind, "file");
    assert.equal(byName.get("note.md")?.path, "/user/note.md", "file path has no trailing /");
    assert.equal(byName.get("pic.png")?.path, "/user/pic.png");
  });
  // Restore the real (node: no storage) /user/ backend for subsequent tests.
  unregisterFsBackend("/user/");
  ensureDefaultFsBackends();
});

test("subscribeFsBackendRegister fires when a backend registers", () => {
  let calls: string[] = [];
  const off = subscribeFsBackendRegister((root) => { calls.push(root); });
  registerFsBackend(makeBackend("/tmp-test/"));
  assert.ok(calls.includes("/tmp-test/"), "listener fired on register");
  off();
  registerFsBackend(makeBackend("/tmp-test-2/"));
  assert.ok(!calls.includes("/tmp-test-2/"), "listener removed after off()");
  unregisterFsBackend("/tmp-test/");
  unregisterFsBackend("/tmp-test-2/");
});

// ---- Task 5: favicon helpers ------------------------------------------------

test("faviconForHref resolves http(s) URLs to S2 endpoint", () => {
  assert.equal(
    faviconForHref("https://example.com/path?q=1"),
    "https://www.google.com/s2/favicons?domain=example.com&sz=64"
  );
  assert.equal(
    faviconForHref("http://sub.example.org"),
    "https://www.google.com/s2/favicons?domain=sub.example.org&sz=64"
  );
});

test("faviconForHref returns empty for non-http(s) or invalid hrefs", () => {
  assert.equal(faviconForHref(""), "");
  assert.equal(faviconForHref("/user/links/links.json"), "");
  assert.equal(faviconForHref("not a url"), "");
  assert.equal(faviconForHref("ftp://host/file"), "");
});

test("resolveEntryIcon returns favicon URL only when entry has http(s) href", () => {
  assert.equal(
    resolveEntryIcon({ name: "x", kind: "file", href: "https://e.com" }),
    "https://www.google.com/s2/favicons?domain=e.com&sz=64"
  );
  assert.equal(resolveEntryIcon({ name: "x", kind: "file" }), "");
  assert.equal(resolveEntryIcon({ name: "x", kind: "directory", href: "/user/" }), "");
  assert.equal(resolveEntryIcon(null), "");
});

test("buildExplorerDragPayload sends http(s) for bookmark URLs, JSON for folders", () => {
  const url = buildExplorerDragPayload(
    { name: "Example", kind: "file", href: "https://example.com", path: "/bookmarks/10" },
    "/bookmarks/1/"
  );
  assert.equal(url.plain, "https://example.com");
  assert.equal(url.uriList, "https://example.com");
  const urlEnv = JSON.parse(url.json);
  assert.equal(urlEnv.desc.action, "open-link");
  assert.equal(urlEnv.desc.href, "https://example.com");
  assert.equal(urlEnv.desc.path, "/bookmarks/10");

  const folder = buildExplorerDragPayload(
    { name: "Bookmarks bar", kind: "directory", path: "/bookmarks/1/" },
    "/"
  );
  assert.notEqual(folder.plain[0], "/");
  const folderEnv = JSON.parse(folder.plain);
  assert.equal(folderEnv.desc.action, "open-path");
  assert.equal(folderEnv.desc.path, "/bookmarks/1/");
  assert.equal(folderEnv.state.label, "Bookmarks bar");
});
