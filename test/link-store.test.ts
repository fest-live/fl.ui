/*
 * Filename: link-store.test.ts
 * FullPath: modules/projects/fl.ui/test/link-store.test.ts
 * Change date and time: 07.35.00_19.08.2026
 * Reason for changes: Task 2 — failing LinkStore unit tests (pure + mock IO) for OPFS migration.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
    migrateLocalStorageToOpfsIfNeeded,
    readLinkStore,
    writeLinkStore,
    packLinksFromSpeedDial,
    mergeMetaFile,
    buildMirrorSpeedDialItems,
    type LinkStoreIo,
    type LinkStoreItem,
    type LinkStoreMetaFile,
    LS_ITEMS_KEY,
    LS_META_KEY,
    LS_MIGRATED_KEY,
    LINKS_JSON,
    META_JSON,
    itemJsonPath
} from "../src/ui/speed-dial/link-store.ts";

function memoryIo(initial: Record<string, string> = {}): LinkStoreIo & { files: Record<string, string> } {
    const files = { ...initial };
    const prefixOf = (dir: string) => (String(dir || "").endsWith("/") ? dir : `${dir}/`);
    return {
        files,
        async readText(path) { return files[path] ?? null; },
        async writeText(path, text) { files[path] = text; },
        async exists(path) { return path in files; },
        async list(dir) {
            const prefix = prefixOf(dir);
            return Object.keys(files).filter((path) => {
                if (!path.startsWith(prefix)) return false;
                return !path.slice(prefix.length).includes("/");
            });
        },
        async remove(path) { delete files[path]; }
    };
}

test("migrate copies LS into OPFS once", async () => {
    const io = memoryIo();
    const ls = new Map<string, string>([
        [LS_ITEMS_KEY, JSON.stringify([{ id: "a", label: "A", action: "open-link", icon: "link", cell: [0, 0] }])],
        [LS_META_KEY, JSON.stringify({ a: { href: "https://example.com" } })]
    ]);
    const result = await migrateLocalStorageToOpfsIfNeeded(io, ls);
    assert.equal(result, "migrated");
    assert.ok(await io.exists(itemJsonPath("a")));
    assert.equal(await io.exists(LINKS_JSON), false);
    assert.equal(ls.get(LS_MIGRATED_KEY), "1");
    const again = await migrateLocalStorageToOpfsIfNeeded(io, ls);
    assert.equal(again, "already");
});

test("migrate preserves cell + href from real LS shapes into OPFS files", async () => {
    // WHY: this is the critical regression — legacy `packState` puts `cell` on the
    // item and `packMetaRegistry` writes a flat `{ [id]: meta }` map (no `items`
    // wrapper). Migrate must lift `cell` into `meta.items[id].cell` and keep `href`.
    const io = memoryIo();
    const realItems = [
        { id: "shortcut-explorer", cell: [2, 0], label: "Explorer", action: "open-view", icon: "books" },
        { id: "link-1", cell: [0, 1], label: "Example", action: "open-link", icon: "link" }
    ];
    const realMeta = {
        "shortcut-explorer": { view: "explorer", shape: "squircle" },
        "link-1": { href: "https://example.com", openLinkTarget: "new-tab" }
    };
    const ls = new Map<string, string>([
        [LS_ITEMS_KEY, JSON.stringify(realItems)],
        [LS_META_KEY, JSON.stringify(realMeta)]
    ]);

    const result = await migrateLocalStorageToOpfsIfNeeded(io, ls);
    assert.equal(result, "migrated");

    // WHY: read the actual OPFS file contents (not via readLinkStore) so we
    // assert what landed on disk — cells and hrefs must survive the migrate.
    const explorerPath = itemJsonPath("shortcut-explorer");
    const link1Path = itemJsonPath("link-1");
    const explorerRaw = io.files[explorerPath];
    const link1Raw = io.files[link1Path];
    const metaRaw = io.files[META_JSON];
    assert.ok(explorerRaw, "shortcut-explorer.json written");
    assert.ok(link1Raw, "link-1.json written");
    assert.ok(metaRaw, "meta.json written");
    assert.equal(io.files[LINKS_JSON], undefined, "legacy links.json not written");

    const explorer = JSON.parse(explorerRaw);
    const link1 = JSON.parse(link1Raw);
    const metaOnDisk = JSON.parse(metaRaw);

    assert.deepEqual(explorer.cell, [2, 0], "explorer cell preserved in item json");
    assert.deepEqual(link1.cell, [0, 1], "link-1 cell preserved in item json");

    // meta.json: flat per-id map lifted into `items`, cell copied from items.
    assert.equal(metaOnDisk.version, 1);
    assert.deepEqual(
        metaOnDisk.items["shortcut-explorer"].cell,
        [2, 0],
        "explorer cell lifted into meta.items.cell"
    );
    assert.deepEqual(
        metaOnDisk.items["link-1"].cell,
        [0, 1],
        "link-1 cell lifted into meta.items.cell"
    );
    assert.equal(
        metaOnDisk.items["link-1"].href,
        "https://example.com",
        "link-1 href preserved in meta"
    );
    assert.equal(metaOnDisk.items["shortcut-explorer"].view, "explorer");

    // WHY: round-trip via readLinkStore must agree with the on-disk shape.
    const got = await readLinkStore(io);
    assert.equal(got?.items.length, 2);
    assert.deepEqual(got?.meta.items["shortcut-explorer"].cell, [2, 0]);
    assert.deepEqual(got?.meta.items["link-1"].cell, [0, 1]);
    assert.equal(got?.meta.items["link-1"].href, "https://example.com");
});

test("migrate handles flat meta with top-level metadata keys", async () => {
    // WHY: a meta blob may carry `mirrorPath`/`grid` alongside the flat per-id
    // map. The flat-map branch must skip those top-level keys, not treat them
    // as peer ids.
    const io = memoryIo();
    const ls = new Map<string, string>([
        [LS_ITEMS_KEY, JSON.stringify([{ id: "a", cell: [1, 1], label: "A", action: "open-view", icon: "books" }])],
        [LS_META_KEY, JSON.stringify({
            mirrorPath: "/mirror",
            grid: { columns: 4, rows: 8 },
            a: { href: "https://e.com", shape: "circle" }
        })]
    ]);
    const result = await migrateLocalStorageToOpfsIfNeeded(io, ls);
    assert.equal(result, "migrated");
    const meta = JSON.parse(io.files[META_JSON]);
    assert.equal(meta.mirrorPath, "/mirror");
    assert.deepEqual(meta.grid, { columns: 4, rows: 8 });
    assert.deepEqual(meta.items.a.cell, [1, 1], "cell lifted from item");
    assert.equal(meta.items.a.href, "https://e.com");
    assert.equal(meta.items.a.shape, "circle");
    // top-level keys must NOT appear as fake peer ids
    assert.equal(meta.items.mirrorPath, undefined);
    assert.equal(meta.items.grid, undefined);
});

test("migrate is skipped when LS empty and OPFS already has links", async () => {
    const io = memoryIo({
        [itemJsonPath("x")]: JSON.stringify({ id: "x", label: "X", action: "open-view", icon: "books" })
    });
    const ls = new Map<string, string>();
    const result = await migrateLocalStorageToOpfsIfNeeded(io, ls);
    assert.equal(result, "skipped");
    assert.equal(ls.get(LS_MIGRATED_KEY), "1");
});

test("write/read roundtrip", async () => {
    const io = memoryIo();
    const items: LinkStoreItem[] = [{ id: "x", label: "X", action: "open-view", icon: "books" }];
    const meta: LinkStoreMetaFile = { version: 1, mirrorPath: null, items: { x: { cell: [1, 2] } } };
    await writeLinkStore(io, items, meta);
    assert.ok(io.files[itemJsonPath("x")]);
    assert.equal(io.files[LINKS_JSON], undefined);
    const got = await readLinkStore(io);
    assert.equal(got?.items[0]?.id, "x");
    assert.deepEqual(got?.meta.items.x.cell, [1, 2]);
});

test("writeLinkStore removes stale item files and legacy links.json", async () => {
    const io = memoryIo({
        [LINKS_JSON]: JSON.stringify([{ id: "old", label: "Old", action: "open-view", icon: "books" }]),
        [itemJsonPath("gone")]: JSON.stringify({ id: "gone", label: "Gone", action: "open-view", icon: "books" })
    });
    await writeLinkStore(io, [{ id: "keep", label: "Keep", action: "open-view", icon: "books" }], {
        version: 1,
        mirrorPath: null,
        items: {}
    });
    assert.ok(io.files[itemJsonPath("keep")]);
    assert.equal(io.files[itemJsonPath("gone")], undefined);
    assert.equal(io.files[LINKS_JSON], undefined);
});

test("readLinkStore returns null when no item files and no links.json", async () => {
    const io = memoryIo();
    const got = await readLinkStore(io);
    assert.equal(got, null);
});

test("readLinkStore still reads legacy links.json", async () => {
    const io = memoryIo({
        [LINKS_JSON]: JSON.stringify([{ id: "x", label: "X", action: "open-view", icon: "books" }])
    });
    const got = await readLinkStore(io);
    assert.equal(got?.items.length, 1);
    assert.equal(got?.items[0]?.id, "x");
    assert.equal(got?.meta.version, 1);
});

test("readLinkStore falls back to links.json when item files do not parse", async () => {
    const io = memoryIo({
        [itemJsonPath("broken")]: "{not-json",
        [LINKS_JSON]: JSON.stringify([{ id: "saved", label: "Saved", action: "open-link", icon: "link", href: "https://e.com" }])
    });
    const got = await readLinkStore(io);
    assert.equal(got?.items.length, 1);
    assert.equal(got?.items[0]?.id, "saved");
});

test("readLinkStore recovers items from meta.json when links.json is gone", async () => {
    const io = memoryIo({
        [META_JSON]: JSON.stringify({
            version: 1,
            items: {
                "link-1": { href: "https://e.com", action: "open-link", label: "Example", cell: [1, 2] }
            }
        })
    });
    const got = await readLinkStore(io);
    assert.equal(got?.items[0]?.id, "link-1");
    assert.equal(got?.items[0]?.href, "https://e.com");
    assert.deepEqual(got?.meta.items["link-1"].cell, [1, 2]);
});

test("writeLinkStore refuses to wipe existing curated files with an empty list", async () => {
    const io = memoryIo({
        [LINKS_JSON]: JSON.stringify([{ id: "x", label: "X", action: "open-view", icon: "books" }])
    });
    await writeLinkStore(io, [], { version: 1, mirrorPath: null, items: {} });
    assert.ok(io.files[LINKS_JSON], "legacy links.json kept");
});

test("readLinkStore prefers per-item files over legacy links.json", async () => {
    const io = memoryIo({
        [LINKS_JSON]: JSON.stringify([{ id: "old", label: "Old", action: "open-view", icon: "books" }]),
        [itemJsonPath("new")]: JSON.stringify({ id: "new", label: "New", action: "open-link", icon: "link" })
    });
    const got = await readLinkStore(io);
    assert.equal(got?.items.length, 1);
    assert.equal(got?.items[0]?.id, "new");
});

test("readLinkStore tolerates missing meta.json", async () => {
    const io = memoryIo({
        [itemJsonPath("x")]: JSON.stringify({ id: "x", label: "X", action: "open-view", icon: "books" })
    });
    const got = await readLinkStore(io);
    assert.equal(got?.items.length, 1);
    assert.equal(got?.meta.version, 1);
    assert.equal(got?.meta.mirrorPath, null);
});

test("packLinksFromSpeedDial strips runtime proxies and keeps cell tuple", () => {
    const items = packLinksFromSpeedDial([
        { id: "a", label: "A", action: "open-link", icon: "link", cell: [3, 4], href: "https://e.com" } as any
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "a");
    assert.deepEqual((items[0] as any).cell, [3, 4]);
    assert.equal((items[0] as any).href, "https://e.com");
});

test("mergeMetaFile merges per-id meta and preserves version", () => {
    const merged = mergeMetaFile(
        { version: 1, mirrorPath: null, items: { a: { cell: [0, 0] } } },
        { a: { href: "https://e.com", shape: "squircle" } }
    );
    assert.equal(merged.version, 1);
    assert.deepEqual(merged.items.a.cell, [0, 0]);
    assert.equal((merged.items.a as any).href, "https://e.com");
    assert.equal((merged.items.a as any).shape, "squircle");
});

// ---- Task 3: mirror mode merge -----------------------------------------------

test("mirror merge applies hidden and cell overrides", () => {
    const items = buildMirrorSpeedDialItems(
        [
            { name: "docs", kind: "directory", path: "/user/docs/" },
            { name: "a.md", kind: "file", path: "/user/a.md" }
        ],
        {
            version: 1,
            mirrorPath: "/user/",
            items: {
                "mirror:/user/docs/": { cell: [2, 3] },
                "mirror:/user/a.md": { hidden: true }
            }
        },
        "/user/"
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "mirror:/user/docs/");
    assert.deepEqual(items[0].cell, [2, 3]);
    assert.equal(items[0].action, "open-path");
});

test("mirror merge maps directories, markdown, images and url hrefs to actions", () => {
    const items = buildMirrorSpeedDialItems(
        [
            { name: "folder", kind: "directory", path: "/user/folder/" },
            { name: "note.md", kind: "file", path: "/user/note.md" },
            { name: "pic.png", kind: "file", path: "/user/pic.png" },
            { name: "data.bin", kind: "file", path: "/user/data.bin" },
            { name: "site", kind: "file", path: "/bookmarks/site", href: "https://e.com" }
        ],
        { version: 1, mirrorPath: "/", items: {} },
        "/"
    );
    assert.equal(items.length, 5);
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    assert.equal(byId["mirror:/user/folder/"].action, "open-path");
    assert.equal(byId["mirror:/user/note.md"].action, "open-path");
    assert.equal(byId["mirror:/user/pic.png"].action, "open-path");
    assert.equal(byId["mirror:/user/data.bin"].action, "open-path");
    assert.equal(byId["mirror:/bookmarks/site"].action, "open-link");
    assert.equal(byId["mirror:/bookmarks/site"].href, "https://e.com");
    assert.equal(byId["mirror:/user/folder/"].path, "/user/folder/");
    assert.equal(byId["mirror:/user/note.md"].path, "/user/note.md");
});

test("mirror merge defaults cell to [0,0] when meta has no override and no curated items", () => {
    const items = buildMirrorSpeedDialItems(
        [{ name: "x", kind: "directory", path: "/user/x/" }],
        { version: 1, mirrorPath: "/user/", items: {} },
        "/user/"
    );
    assert.deepEqual(items[0].cell, [0, 0]);
});

test("mirror merge auto-places below curated max Y when no cell override", () => {
    // WHY: curated items occupy row 0 (cells [0,0],[1,0],[2,0],[3,0]) and
    // [0,1]. max curated Y = 1, so mirror items auto-place starting at row 2.
    const curated = [
        { cell: [0, 0] }, { cell: [1, 0] }, { cell: [2, 0] }, { cell: [3, 0] },
        { cell: [0, 1] }
    ];
    const items = buildMirrorSpeedDialItems(
        [
            { name: "a", kind: "directory", path: "/user/a/" },
            { name: "b", kind: "file", path: "/user/b.md" },
            { name: "c", kind: "file", path: "/user/c.png" },
            { name: "d", kind: "file", path: "/user/d.bin" },
            { name: "e", kind: "file", path: "/user/e.txt" }
        ],
        { version: 1, mirrorPath: "/user/", items: {} },
        "/user/",
        curated
    );
    assert.equal(items.length, 5);
    // WHY: first four fill row 2 (cols 0..3), fifth wraps to row 3 col 0.
    assert.deepEqual(items[0].cell, [0, 2]);
    assert.deepEqual(items[1].cell, [1, 2]);
    assert.deepEqual(items[2].cell, [2, 2]);
    assert.deepEqual(items[3].cell, [3, 2]);
    assert.deepEqual(items[4].cell, [0, 3]);
});

test("mirror merge honors meta cell override over auto-placement", () => {
    const curated = [{ cell: [0, 0] }, { cell: [1, 0] }];
    const items = buildMirrorSpeedDialItems(
        [
            { name: "pinned", kind: "directory", path: "/user/pinned/" },
            { name: "auto", kind: "file", path: "/user/auto.md" }
        ],
        {
            version: 1,
            mirrorPath: "/user/",
            items: { "mirror:/user/pinned/": { cell: [5, 7] } }
        },
        "/user/",
        curated
    );
    assert.deepEqual(items[0].cell, [5, 7], "override wins");
    // WHY: auto item starts at startY = 1 (max curated Y = 0), col 0.
    assert.deepEqual(items[1].cell, [0, 1], "auto places below curated, not on pinned");
});

test("mirror merge auto-placement skips cells held by overrides", () => {
    // WHY: override pins the first mirror item at [0,1]; the second mirror
    // item (no override) must not land on [0,1] — it goes to [1,1].
    const curated = [{ cell: [0, 0] }];
    const items = buildMirrorSpeedDialItems(
        [
            { name: "pinned", kind: "directory", path: "/user/pinned/" },
            { name: "auto", kind: "file", path: "/user/auto.md" }
        ],
        {
            version: 1,
            mirrorPath: "/user/",
            items: { "mirror:/user/pinned/": { cell: [0, 1] } }
        },
        "/user/",
        curated
    );
    assert.deepEqual(items[0].cell, [0, 1]);
    assert.deepEqual(items[1].cell, [1, 1], "auto skips the occupied override cell");
});
