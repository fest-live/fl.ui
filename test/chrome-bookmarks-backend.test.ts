/*
 * Filename: chrome-bookmarks-backend.test.ts
 * FullPath: modules/projects/fl.ui/test/chrome-bookmarks-backend.test.ts
 * Change date and time: 07.50.00_19.08.2026
 * Reason for changes: Task 4 — failing tests for ChromeBookmarksBackend with a mocked chrome.bookmarks API.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createChromeBookmarksBackend } from "../src/ui/explorer/backends/chrome-bookmarks-backend.ts";

function mockBookmarks() {
    const barChildren: any[] = [{ id: "10", title: "Example", url: "https://example.com", parentId: "1" }];
    const rootChildren: any[] = [{ id: "1", title: "Bookmarks bar", parentId: "0", children: barChildren }];
    const nodes = new Map<string, any>([
        ["0", { id: "0", title: "", children: rootChildren }],
        ["1", rootChildren[0]],
        ["10", barChildren[0]]
    ]);
    const listeners: Record<string, Set<(id: string, node?: any) => void>> = {
        onCreated: new Set(),
        onChanged: new Set(),
        onRemoved: new Set(),
        onMoved: new Set()
    };
    // WHY (final review #3): track which API was invoked so tests can assert
    // that URL deletes call `remove` and folder deletes call `removeTree`.
    // The previous mock made both methods behave identically, so the
    // `isFolderPath`-forces-trailing-slash bug was invisible.
    const calls: Record<"remove" | "removeTree", string[]> = { remove: [], removeTree: [] };
    return {
        calls,
        async getTree() { return [nodes.get("0")]; },
        async getChildren(id: string) { return nodes.get(id)?.children ?? []; },
        async create(opts: any) {
            const id = String(100 + nodes.size);
            const node = {
                id,
                title: opts.title,
                url: opts.url,
                parentId: opts.parentId,
                children: opts.url ? undefined : []
            };
            nodes.set(id, node);
            const parent = nodes.get(opts.parentId);
            if (parent) parent.children.push(node);
            listeners.onCreated.forEach((cb) => cb(id, node));
            return node;
        },
        async update(id: string, changes: any) {
            Object.assign(nodes.get(id) ?? {}, changes);
            listeners.onChanged.forEach((cb) => cb(id, changes));
            return nodes.get(id);
        },
        async move(id: string, dest: any) {
            const node = nodes.get(id);
            if (node && dest?.parentId) {
                const oldParent = node.parentId ? nodes.get(node.parentId) : null;
                if (oldParent?.children) {
                    oldParent.children = oldParent.children.filter((c: any) => c.id !== id);
                }
                node.parentId = dest.parentId;
                const newParent = nodes.get(dest.parentId);
                if (newParent) newParent.children.push(node);
            }
            listeners.onMoved.forEach((cb) => cb(id, { parentId: dest?.parentId }));
            return node;
        },
        async remove(id: string) {
            calls.remove.push(id);
            const node = nodes.get(id);
            if (node?.parentId) {
                const parent = nodes.get(node.parentId);
                if (parent?.children) {
                    parent.children = parent.children.filter((c: any) => c.id !== id);
                }
            }
            nodes.delete(id);
            listeners.onRemoved.forEach((cb) => cb(id, node));
        },
        async removeTree(id: string) {
            calls.removeTree.push(id);
            const node = nodes.get(id);
            if (node?.parentId) {
                const parent = nodes.get(node.parentId);
                if (parent?.children) {
                    parent.children = parent.children.filter((c: any) => c.id !== id);
                }
            }
            nodes.delete(id);
            listeners.onRemoved.forEach((cb) => cb(id, node));
        },
        onCreated: { addListener: (cb: any) => { listeners.onCreated.add(cb); return () => listeners.onCreated.delete(cb); } },
        onChanged: { addListener: (cb: any) => { listeners.onChanged.add(cb); return () => listeners.onChanged.delete(cb); } },
        onRemoved: { addListener: (cb: any) => { listeners.onRemoved.add(cb); return () => listeners.onRemoved.delete(cb); } },
        onMoved: { addListener: (cb: any) => { listeners.onMoved.add(cb); return () => listeners.onMoved.delete(cb); } }
    };
}

test("root lists bookmark bar / other top-level folders", async () => {
    const backend = createChromeBookmarksBackend(mockBookmarks() as any);
    const entries = await backend.list("/bookmarks/");
    assert.equal(entries.some((e) => e.bookmarkId === "1" && e.kind === "directory"), true);
});

test("lists bookmark bar entries", async () => {
    const backend = createChromeBookmarksBackend(mockBookmarks() as any);
    const entries = await backend.list("/bookmarks/1/");
    assert.equal(entries.some((e) => e.bookmarkId === "10" && e.href === "https://example.com"), true);
});

test("createUrl writes through API", async () => {
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    await backend.createUrl!("/bookmarks/1/", "New", "https://n.example");
    const entries = await backend.list("/bookmarks/1/");
    assert.ok(entries.some((e) => e.href === "https://n.example"));
});

test("mkdir creates a folder under parent id", async () => {
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    await backend.mkdir!("/bookmarks/1/", "Sub");
    const entries = await backend.list("/bookmarks/1/");
    assert.ok(entries.some((e) => e.kind === "directory" && e.name === "Sub"));
});

test("rename updates node title", async () => {
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    await backend.rename!("/bookmarks/10", "Renamed");
    const entries = await backend.list("/bookmarks/1/");
    assert.ok(entries.some((e) => e.bookmarkId === "10" && e.name === "Renamed"));
});

test("remove deletes a URL entry", async () => {
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    await backend.remove!("/bookmarks/10");
    // WHY (final review #3): URL bookmark paths must call `remove`, not
    // `removeTree` (Chrome rejects removeTree on URL nodes). The previous
    // `isFolderPath` forced a trailing slash and always picked removeTree.
    assert.deepEqual(api.calls.remove, ["10"], "remove called for URL entry");
    assert.deepEqual(api.calls.removeTree, [], "removeTree NOT called for URL entry");
    const entries = await backend.list("/bookmarks/1/");
    assert.ok(!entries.some((e) => e.bookmarkId === "10"));
});

test("remove on folder path uses removeTree", async () => {
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    await backend.mkdir!("/bookmarks/1/", "Sub");
    const before = (await backend.list("/bookmarks/1/")).filter((e) => e.name === "Sub");
    assert.ok(before.length === 1);
    const folderPath = before[0].path!;
    await backend.remove!(folderPath);
    // WHY (final review #3): folder paths (trailing `/`) must call
    // `removeTree`; Chrome `remove` rejects folders that have children.
    assert.ok(api.calls.removeTree.length >= 1, "removeTree called for folder");
    assert.deepEqual(api.calls.remove, [], "remove NOT called for folder");
    const after = (await backend.list("/bookmarks/1/")).filter((e) => e.name === "Sub");
    assert.equal(after.length, 0);
});

test("move wires through to chrome.bookmarks.move", async () => {
    // WHY (final review #4): Operative `movePath` + paste routes to
    // `backend.move`; assert the adapter calls `chrome.bookmarks.move`
    // with the source id and destination parentId.
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    await backend.mkdir!("/bookmarks/1/", "Sub2");
    const sub = (await backend.list("/bookmarks/1/")).find((e) => e.name === "Sub2");
    assert.ok(sub, "Sub2 folder created");
    // Move the URL node into the Sub2 folder (use its id-path).
    await backend.move!("/bookmarks/10", sub!.path!);
    const subChildren = await backend.list(sub!.path!);
    assert.ok(subChildren.some((e) => e.bookmarkId === "10"), "URL node moved into Sub2");
    // And the URL node must no longer be a direct child of the bookmarks bar.
    const barChildren = await backend.list("/bookmarks/1/");
    assert.ok(!barChildren.some((e) => e.bookmarkId === "10"), "URL node removed from old parent");
});

test("writeFile rejects with clear error", async () => {
    const backend = createChromeBookmarksBackend(mockBookmarks() as any);
    await assert.rejects(
        () => backend.writeFile!("/bookmarks/1/", new File(["x"], "a.bin")),
        /bookmarks backend does not store file bytes/
    );
});

test("subscribeBookmarksInvalidation fires on create", async () => {
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    let calls = 0;
    const off = backend.subscribeBookmarksInvalidation!(() => { calls++; });
    await backend.createUrl!("/bookmarks/1/", "X", "https://x.example");
    assert.ok(calls > 0, "invalidation listener fired on create");
    off();
    calls = 0;
    await backend.createUrl!("/bookmarks/1/", "Y", "https://y.example");
    assert.equal(calls, 0, "listener removed after off()");
});

test("subscribeBookmarksInvalidation resubscribes after all listeners leave", async () => {
    // WHY: the previous teardown design detached the chrome event listeners
    // when the last subscriber left and never re-attached them, so a later
    // subscribe would silently never fire. The backend now keeps chrome
    // listeners for its lifetime; re-subscribe must work.
    const api = mockBookmarks();
    const backend = createChromeBookmarksBackend(api as any);
    let first = 0;
    const off1 = backend.subscribeBookmarksInvalidation!(() => { first++; });
    await backend.createUrl!("/bookmarks/1/", "A", "https://a.example");
    assert.ok(first > 0, "first subscriber fired");
    off1();
    first = 0;
    await backend.createUrl!("/bookmarks/1/", "B", "https://b.example");
    assert.equal(first, 0, "no fire after unsubscribe");
    let second = 0;
    const off2 = backend.subscribeBookmarksInvalidation!(() => { second++; });
    await backend.createUrl!("/bookmarks/1/", "C", "https://c.example");
    assert.ok(second > 0, "re-subscribe after full teardown fires");
    off2();
});
