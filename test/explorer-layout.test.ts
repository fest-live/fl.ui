/*
 * Filename: explorer-layout.test.ts
 * FullPath: modules/projects/fl.ui/test/explorer-layout.test.ts
 * Change date and time: 01.30.00_29.07.2026
 * Reason for changes: Cover non-composed shadow drop path used by real Chromium DragEvents.
 */

import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const EXPLORER_URL =
    process.env.FL_UI_EXPLORER_URL || "http://127.0.0.1:8435/?suite=explorer";

test("file manager fills available height while rows own scrolling", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const metrics = await page.evaluate(() => {
            const manager = document.querySelector("ui-file-manager");
            const content = manager?.querySelector("ui-file-manager-content");
            const operative = (content as any)?.operativeInstance;
            if (content && operative) {
                operative.entries.value = Array.from({ length: 24 }, (_, index) =>
                    index % 2 === 0
                        ? { name: `folder-${index}`, kind: "directory" }
                        : { name: `file-${index}.txt`, kind: "file", size: index, lastModified: 1 }
                );
                content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));
            }
            const toolbar = manager?.shadowRoot?.querySelector(".fm-toolbar");
            const rows = content?.shadowRoot?.querySelector(".fm-grid-rows");
            const rect = (node: Element | null) => {
                if (!node) return null;
                const box = node.getBoundingClientRect();
                return { height: box.height, clientHeight: (node as HTMLElement).clientHeight };
            };

            return {
                manager: rect(manager),
                toolbar: rect(toolbar),
                rows: rect(rows),
                rowCount: rows?.querySelectorAll(".row").length ?? 0,
                rowsScrollHeight: rows?.scrollHeight ?? 0,
                rowsClientHeight: rows?.clientHeight ?? 0,
                rowsOverflow: rows ? getComputedStyle(rows).overflowY : null,
                contentOverflow: content ? getComputedStyle(content).overflowY : null,
                headerPresent: !!content?.shadowRoot?.querySelector(".fm-grid-header")
            };
        });

        assert.ok(metrics.manager, "file-manager should be mounted");
        assert.ok(metrics.toolbar, "file-manager toolbar should be mounted");
        assert.ok(metrics.rows, "file-manager rows should be mounted");
        assert.ok(
            metrics.manager.height - metrics.toolbar.height >= 40,
            `file-manager collapsed below its available height: ${JSON.stringify(metrics)}`
        );
        assert.ok(metrics.rows.height > 0, "rows should have a measurable height");
        assert.equal(metrics.rowCount, 24);
        assert.ok(metrics.rowsScrollHeight > metrics.rowsClientHeight, "rows should own overflow scrolling");
        assert.equal(metrics.rowsOverflow, "auto");
        assert.equal(metrics.contentOverflow, "hidden");
        assert.equal(metrics.headerPresent, true);
    } finally {
        await browser.close();
    }
});

test("refresh preserves the header and repopulates the single rows container", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            const entries = [
                { name: "shared", kind: "directory" },
                { name: "shared", kind: "file", size: 12, lastModified: 1 },
                { name: "notes.txt", kind: "file", size: 24, lastModified: 2 }
            ];

            operative.entries.value = entries;
            content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));

            operative.refreshList = async () => operative;
            await content.refreshList();
            await new Promise((resolve) => setTimeout(resolve, 25));

            const root = content.shadowRoot;
            const grid = root?.querySelector(".fm-grid");
            const rows = root?.querySelector(".fm-grid-rows");
            return {
                gridCount: root?.querySelectorAll(".fm-grid").length ?? 0,
                headerPresent: !!grid?.querySelector(".fm-grid-header"),
                rowCount: rows?.querySelectorAll(".row").length ?? 0
            };
        });

        assert.equal(result.gridCount, 1);
        assert.equal(result.headerPresent, true);
        assert.equal(result.rowCount, 3);
    } finally {
        await browser.close();
    }
});

test("rows keep distinct file and directory identities across refreshes", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            operative.entries.value = [
                { name: "shared", kind: "file", size: 12, lastModified: 1 },
                { name: "shared", kind: "directory" },
                { name: "shared", kind: "file", size: 12, lastModified: 1 },
                { name: "notes.txt", kind: "file", size: 24, lastModified: 2 }
            ];
            content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));

            const readKeys = () => Array.from(
                content.shadowRoot?.querySelectorAll(".fm-grid-rows .row") ?? []
            ).map((row: Element) => row.getAttribute("data-entry-key"));
            const before = readKeys();
            content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));

            return { before, after: readKeys() };
        });

        assert.deepEqual(result.before, [
            "directory:shared",
            "file:notes.txt",
            "file:shared"
        ]);
        assert.deepEqual(result.after, result.before);
    } finally {
        await browser.close();
    }
});

test("context menu uses the bounded unified panel instead of legacy list styling", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        await page.evaluate(() => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            if (!content || !operative) return;
            operative.entries.value = [
                { name: "folder", kind: "directory" },
                { name: "document.txt", kind: "file", size: 7, lastModified: 1 }
            ];
            content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));
        });
        await page.waitForFunction(() =>
            Boolean(document.querySelector("ui-file-manager-content")
                ?.shadowRoot?.querySelector('.fm-grid-rows .row[data-kind="file"]'))
        );
        const menuHostPointerEventsBefore = await page.evaluate(() => {
            const host = document.querySelector('[data-app-layer="overlay"]') || document.body;
            return (host as HTMLElement).style.pointerEvents;
        });

        const point = await page.evaluate(() => {
            const row = document.querySelector("ui-file-manager-content")
                ?.shadowRoot?.querySelector('.fm-grid-rows .row[data-kind="file"]');
            const rect = row?.getBoundingClientRect();
            return rect ? { x: rect.x + 20, y: rect.y + 20 } : null;
        });
        assert.ok(point, "an explorer row should be available for context-menu testing");
        await page.mouse.click(point.x, point.y, { button: "right" });
        await page.waitForSelector(".cw-context-menu");

        const metrics = await page.evaluate(() => {
            const menu = document.querySelector(".cw-context-menu");
            const item = menu?.querySelector(".cw-context-menu__item");
            const rect = menu?.getBoundingClientRect();
            return {
                legacyMenu: Boolean(document.querySelector("ul.ctx-menu")),
                itemCount: menu?.querySelectorAll(".cw-context-menu__item").length ?? 0,
                panel: menu ? {
                    display: getComputedStyle(menu).display,
                    position: getComputedStyle(menu).position,
                    background: getComputedStyle(menu).backgroundColor,
                    rect: rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } : null
                } : null,
                rowDisplay: item ? getComputedStyle(item).display : null,
                menuHostPointerEvents: (
                    (document.querySelector('[data-app-layer="overlay"]') || document.body) as HTMLElement
                ).style.pointerEvents
            };
        });

        assert.equal(metrics.legacyMenu, false);
        assert.equal(metrics.menuHostPointerEvents, menuHostPointerEventsBefore);
        assert.equal(metrics.itemCount, 12);
        assert.equal(metrics.panel?.position, "fixed");
        assert.notEqual(metrics.panel?.background, "rgba(0, 0, 0, 0)");
        assert.equal(metrics.rowDisplay, "grid");
        assert.ok(
            metrics.panel?.rect &&
            metrics.panel.rect.left >= 0 &&
            metrics.panel.rect.top >= 0 &&
            metrics.panel.rect.right <= 1280 &&
            metrics.panel.rect.bottom <= 800
        );

        const action = await page.evaluate(() => new Promise<{ action: string; name: string } | null>((resolve) => {
            const content = document.querySelector("ui-file-manager-content");
            const button = Array.from(document.querySelectorAll(".cw-context-menu__item"))
                .find((item) => item.textContent?.trim() === "View") as HTMLButtonElement | undefined;
            const timer = setTimeout(() => resolve(null), 500);
            content?.addEventListener("context-action", (event: Event) => {
                clearTimeout(timer);
                const detail = (event as CustomEvent).detail;
                resolve({ action: detail?.action, name: detail?.item?.name });
            }, { once: true });
            button?.click();
        }));
        assert.deepEqual(action, { action: "view", name: "document.txt" });
        await page.waitForFunction(() => !document.querySelector(".cw-context-menu"));
        const menuHostPointerEventsAfterClose = await page.evaluate(() => {
            const host = document.querySelector('[data-app-layer="overlay"]') || document.body;
            return (host as HTMLElement).style.pointerEvents;
        });
        assert.equal(menuHostPointerEventsAfterClose, menuHostPointerEventsBefore);

        const directoryPoint = await page.evaluate(() => {
            const row = document.querySelector("ui-file-manager-content")
                ?.shadowRoot?.querySelector('.fm-grid-rows .row[data-kind="directory"]');
            const rect = row?.getBoundingClientRect();
            return rect ? { x: rect.x + 20, y: rect.y + 20 } : null;
        });
        assert.ok(directoryPoint, "a directory row should be available for context-menu testing");
        await page.mouse.click(directoryPoint.x, directoryPoint.y, { button: "right" });
        await page.waitForSelector(".cw-context-menu");
        const directoryMenu = await page.evaluate(() => {
            const menu = document.querySelector(".cw-context-menu");
            const labels = Array.from(menu?.querySelectorAll(".cw-context-menu__label") ?? [])
                .map((label) => label.textContent?.trim());
            return { labels, hasView: labels.includes("View"), hasPaste: labels.includes("Paste") };
        });
        assert.equal(directoryMenu.hasView, false);
        assert.equal(directoryMenu.hasPaste, false);
        assert.deepEqual(directoryMenu.labels, ["Open", "Download", "Delete", "Rename", "Copy Path", "Move Path"]);

        await page.mouse.click(8, 8);
        const emptyPoint = await page.evaluate(() => {
            const rows = document.querySelector("ui-file-manager-content")
                ?.shadowRoot?.querySelector(".fm-grid-rows");
            const rect = rows?.getBoundingClientRect();
            return rect ? { x: rect.left + 12, y: rect.bottom - 8 } : null;
        });
        assert.ok(emptyPoint, "the rows surface should be available for empty-space context-menu testing");
        await page.mouse.click(emptyPoint.x, emptyPoint.y, { button: "right" });
        await page.waitForSelector(".cw-context-menu");
        const emptyMenu = await page.evaluate(() =>
            Array.from(document.querySelectorAll(".cw-context-menu__label"))
                .map((label) => label.textContent?.trim())
        );
        assert.deepEqual(emptyMenu, ["Paste"]);
    } finally {
        await browser.close();
    }
});

test("root drop and paste write files into /user and leave read-only assets blocked", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const operative = (document.querySelector("ui-file-manager-content") as any)?.operativeInstance;
            if (!operative || !navigator.storage?.getDirectory) {
                throw new Error("OPFS is required for file-ingress verification");
            }

            const root = await navigator.storage.getDirectory();
            const dropName = `explorer-drop-${Date.now()}.txt`;
            const pasteName = `explorer-paste-${Date.now()}.txt`;
            const makeTransfer = (name: string) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File(["payload"], name, { type: "text/plain" }));
                return transfer;
            };
            const waitForFile = async (name: string) => {
                for (let attempt = 0; attempt < 30; attempt += 1) {
                    const handle = await root.getFileHandle(name, { create: false }).catch(() => null);
                    const file = await handle?.getFile?.();
                    if (file) return file;
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
                return null;
            };

            operative.refreshList = async () => operative;
            try {
                operative.path = "/";
                let dropPrevented = false;
                await operative.onDrop({
                    dataTransfer: makeTransfer(dropName),
                    preventDefault: () => { dropPrevented = true; }
                });
                const dropped = await waitForFile(dropName);
                const pathAfterDrop = operative.path;

                operative.path = "/";
                let pastePrevented = false;
                operative.onPaste({
                    clipboardData: makeTransfer(pasteName),
                    preventDefault: () => { pastePrevented = true; }
                });
                const pasted = await waitForFile(pasteName);
                const pathAfterPaste = operative.path;

                operative.path = "/assets/";
                let readonlyPrevented = false;
                await operative.onDrop({
                    dataTransfer: makeTransfer(`explorer-blocked-${Date.now()}.txt`),
                    preventDefault: () => { readonlyPrevented = true; }
                });

                return {
                    pathAfterDrop,
                    pathAfterPaste,
                    pathAfterReadonly: operative.path,
                    dropped: Boolean(dropped && dropped.size === 7),
                    pasted: Boolean(pasted && pasted.size === 7),
                    dropPrevented,
                    pastePrevented,
                    readonlyPrevented
                };
            } finally {
                await root.removeEntry(dropName).catch(() => null);
                await root.removeEntry(pasteName).catch(() => null);
            }
        });

        assert.equal(result.pathAfterDrop, "/user/");
        assert.equal(result.pathAfterPaste, "/user/");
        assert.equal(result.pathAfterReadonly, "/assets/");
        assert.equal(result.dropped, true);
        assert.equal(result.pasted, true);
        assert.equal(result.dropPrevented, true);
        assert.equal(result.pastePrevented, true);
        assert.equal(result.readonlyPrevented, false);
    } finally {
        await browser.close();
    }
});

test("empty explorer surface accepts component drop and paste", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            const rows = content?.shadowRoot?.querySelector(".fm-grid-rows") as HTMLElement | null;
            if (!content || !operative || !rows || !navigator.storage?.getDirectory) {
                throw new Error("empty explorer surface and OPFS are required");
            }

            const root = await navigator.storage.getDirectory();
            const dropName = `explorer-empty-drop-${Date.now()}.txt`;
            const pasteName = `explorer-empty-paste-${Date.now()}.txt`;
            const makeTransfer = (name: string) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File(["payload"], name, { type: "text/plain" }));
                return transfer;
            };
            const waitForFile = async (name: string) => {
                for (let attempt = 0; attempt < 30; attempt += 1) {
                    const handle = await root.getFileHandle(name, { create: false }).catch(() => null);
                    const file = await handle?.getFile?.();
                    if (file) return file;
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
                return null;
            };

            operative.refreshList = async () => operative;
            operative.path = "/";
            operative.entries.value = [];
            content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));

            try {
                const dragover = new DragEvent("dragover", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    dataTransfer: makeTransfer(dropName)
                });
                rows.dispatchEvent(dragover);

                const drop = new DragEvent("drop", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    dataTransfer: makeTransfer(dropName)
                });
                rows.dispatchEvent(drop);
                const dropped = await waitForFile(dropName);

                operative.path = "/";
                const focusProbe = new PointerEvent("pointerdown", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    button: 0
                });
                rows.dispatchEvent(focusProbe);

                const paste = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    clipboardData: makeTransfer(pasteName)
                });
                rows.dispatchEvent(paste);
                const pasted = await waitForFile(pasteName);

                return {
                    dragoverPrevented: dragover.defaultPrevented,
                    dropPrevented: drop.defaultPrevented,
                    pastePrevented: paste.defaultPrevented,
                    dropped: Boolean(dropped && dropped.size === 7),
                    pasted: Boolean(pasted && pasted.size === 7),
                    explorerFocused: document.activeElement === content
                };
            } finally {
                await root.removeEntry(dropName).catch(() => null);
                await root.removeEntry(pasteName).catch(() => null);
            }
        });

        assert.equal(result.dragoverPrevented, true);
        assert.equal(result.dropPrevented, true);
        assert.equal(result.pastePrevented, true);
        assert.equal(result.dropped, true);
        assert.equal(result.pasted, true);
        assert.equal(result.explorerFocused, true);
    } finally {
        await browser.close();
    }
});

test("non-composed shadow drop reaches the explorer and refreshes /user listing", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            const rows = content?.shadowRoot?.querySelector(".fm-grid-rows") as HTMLElement | null;
            if (!content || !operative || !rows || !navigator.storage?.getDirectory) {
                throw new Error("explorer surface and OPFS are required");
            }

            const root = await navigator.storage.getDirectory();
            const dropName = `explorer-shadow-drop-${Date.now()}.txt`;
            const transfer = new DataTransfer();
            transfer.items.add(new File(["payload"], dropName, { type: "text/plain" }));

            try {
                operative.path = "/user/";
                await operative.refreshList("/user/");

                // Real Chromium DragEvents are not composed — this is the path that
                // previously never reached a host-only listener.
                const dragover = new DragEvent("dragover", {
                    bubbles: true,
                    cancelable: true,
                    composed: false,
                    dataTransfer: transfer
                });
                const drop = new DragEvent("drop", {
                    bubbles: true,
                    cancelable: true,
                    composed: false,
                    dataTransfer: transfer
                });
                rows.dispatchEvent(dragover);
                rows.dispatchEvent(drop);

                let listed = false;
                let rendered = false;
                for (let attempt = 0; attempt < 40; attempt += 1) {
                    const handle = await root.getFileHandle(dropName, { create: false }).catch(() => null);
                    const file = await handle?.getFile?.();
                    const entries = Array.isArray(operative.entries?.value) ? operative.entries.value : [];
                    listed = entries.some((entry: any) => entry?.name === dropName);
                    rendered = Boolean(content.shadowRoot?.querySelector(`.row[data-entry-key="file:${dropName}"]`));
                    if (file && listed && rendered) {
                        return {
                            dropped: file.size === 7,
                            dragoverPrevented: dragover.defaultPrevented,
                            dropPrevented: drop.defaultPrevented,
                            listed,
                            rendered,
                            path: operative.path
                        };
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }

                return {
                    dropped: false,
                    dragoverPrevented: dragover.defaultPrevented,
                    dropPrevented: drop.defaultPrevented,
                    listed,
                    rendered,
                    path: operative.path
                };
            } finally {
                await root.removeEntry(dropName).catch(() => null);
            }
        });

        assert.equal(result.dragoverPrevented, true);
        assert.equal(result.dropPrevented, true);
        assert.equal(result.dropped, true);
        assert.equal(result.listed, true);
        assert.equal(result.rendered, true);
    } finally {
        await browser.close();
    }
});

test("user scope accepts empty-surface drop, paste, and input upload fallback", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            const rows = content?.shadowRoot?.querySelector(".fm-grid-rows") as HTMLElement | null;
            if (!content || !operative || !rows || !navigator.storage?.getDirectory) {
                throw new Error("user-scope explorer and OPFS are required");
            }

            const root = await navigator.storage.getDirectory();
            const dropName = `explorer-user-drop-${Date.now()}.txt`;
            const pasteName = `explorer-user-paste-${Date.now()}.txt`;
            const uploadName = `explorer-user-upload-${Date.now()}.txt`;
            const makeTransfer = (name: string) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File(["payload"], name, { type: "text/plain" }));
                return transfer;
            };
            const waitForFile = async (name: string) => {
                for (let attempt = 0; attempt < 30; attempt += 1) {
                    const handle = await root.getFileHandle(name, { create: false }).catch(() => null);
                    const file = await handle?.getFile?.();
                    if (file) return file;
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
                return null;
            };

            operative.refreshList = async () => operative;
            operative.path = "/user/";
            operative.entries.value = [];
            content.dispatchEvent(new CustomEvent("entries-updated", { bubbles: true, composed: true }));

            const drop = new DragEvent("drop", {
                bubbles: true,
                cancelable: true,
                composed: true,
                dataTransfer: makeTransfer(dropName)
            });
            rows.dispatchEvent(drop);
            const dropped = await waitForFile(dropName);

            operative.path = "/user/";
            rows.dispatchEvent(new PointerEvent("pointerdown", {
                bubbles: true,
                cancelable: true,
                composed: true,
                button: 0
            }));
            const paste = new ClipboardEvent("paste", {
                bubbles: true,
                cancelable: true,
                composed: true,
                clipboardData: makeTransfer(pasteName)
            });
            rows.dispatchEvent(paste);
            const pasted = await waitForFile(pasteName);

            const pickerDescriptor = Object.getOwnPropertyDescriptor(window, "showOpenFilePicker");
            const handleDescriptor = Object.getOwnPropertyDescriptor(window, "FileSystemHandle");
            const inputClickDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "click");
            let pickerCalls = 0;
            try {
                Object.defineProperty(window, "showOpenFilePicker", {
                    configurable: true,
                    writable: true,
                    value: () => {
                        pickerCalls += 1;
                        throw new Error("polyfill picker must not be called");
                    }
                });
                Object.defineProperty(window, "FileSystemHandle", {
                    configurable: true,
                    writable: true,
                    value: undefined
                });
                Object.defineProperty(HTMLInputElement.prototype, "click", {
                    configurable: true,
                    writable: true,
                    value: function () {
                        const transfer = new DataTransfer();
                        transfer.items.add(new File(["payload"], uploadName, { type: "text/plain" }));
                        Object.defineProperty(this, "files", {
                            configurable: true,
                            value: transfer.files
                        });
                        this.dispatchEvent(new Event("change"));
                    }
                });

                operative.path = "/user/";
                await operative.requestUpload();
            } finally {
                if (pickerDescriptor) Object.defineProperty(window, "showOpenFilePicker", pickerDescriptor);
                else delete (window as any).showOpenFilePicker;
                if (handleDescriptor) Object.defineProperty(window, "FileSystemHandle", handleDescriptor);
                else delete (window as any).FileSystemHandle;
                if (inputClickDescriptor) {
                    Object.defineProperty(HTMLInputElement.prototype, "click", inputClickDescriptor);
                }
            }
            const uploaded = await waitForFile(uploadName);

            try {
                return {
                    path: operative.path,
                    dropPrevented: drop.defaultPrevented,
                    pastePrevented: paste.defaultPrevented,
                    dropped: Boolean(dropped && dropped.size === 7),
                    pasted: Boolean(pasted && pasted.size === 7),
                    uploaded: Boolean(uploaded && uploaded.size === 7),
                    pickerCalls
                };
            } finally {
                await root.removeEntry(dropName).catch(() => null);
                await root.removeEntry(pasteName).catch(() => null);
                await root.removeEntry(uploadName).catch(() => null);
            }
        });

        assert.equal(result.path, "/user/");
        assert.equal(result.dropPrevented, true);
        assert.equal(result.pastePrevented, true);
        assert.equal(result.dropped, true);
        assert.equal(result.pasted, true);
        assert.equal(result.uploaded, true);
        assert.equal(result.pickerCalls, 0);
    } finally {
        await browser.close();
    }
});

test("user listing includes a file uploaded immediately after entering /user", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            if (!content || !operative || !navigator.storage?.getDirectory) {
                throw new Error("user-scope explorer and OPFS are required");
            }

            const root = await navigator.storage.getDirectory();
            const name = `explorer-user-list-${Date.now()}.txt`;
            const pickerDescriptor = Object.getOwnPropertyDescriptor(window, "showOpenFilePicker");
            const handleDescriptor = Object.getOwnPropertyDescriptor(window, "FileSystemHandle");

            try {
                // Set the path and request upload in the same turn. This catches a
                // stale read-only flag left over from the virtual root.
                operative.path = "/user/";
                Object.defineProperty(window, "FileSystemHandle", {
                    configurable: true,
                    writable: true,
                    value: function FileSystemHandle() {}
                });
                Object.defineProperty(window, "showOpenFilePicker", {
                    configurable: true,
                    writable: true,
                    value: async () => [{
                        getFile: async () => new File(["payload"], name, { type: "text/plain" })
                    }]
                });

                await operative.requestUpload();
                const handle = await root.getFileHandle(name, { create: false }).catch(() => null);
                const file = await handle?.getFile?.();
                const entries = Array.isArray(operative.entries?.value) ? operative.entries.value : [];

                return {
                    uploaded: Boolean(file && file.size === 7),
                    listed: entries.some((entry: any) => entry?.name === name),
                    rendered: Boolean(content.shadowRoot?.querySelector(`.row[data-entry-key="file:${name}"]`))
                };
            } finally {
                await root.removeEntry(name).catch(() => null);
                if (pickerDescriptor) Object.defineProperty(window, "showOpenFilePicker", pickerDescriptor);
                else delete (window as any).showOpenFilePicker;
                if (handleDescriptor) Object.defineProperty(window, "FileSystemHandle", handleDescriptor);
                else delete (window as any).FileSystemHandle;
            }
        });

        assert.equal(result.uploaded, true);
        assert.equal(result.listed, true);
        assert.equal(result.rendered, true);
    } finally {
        await browser.close();
    }
});

test("drop guards Chromium directory handles by secure context and event timing", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(EXPLORER_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForSelector("ui-file-manager");

        const result = await page.evaluate(async () => {
            const content = document.querySelector("ui-file-manager-content") as any;
            const operative = content?.operativeInstance;
            if (!operative) throw new Error("file operative is required");
            operative.refreshList = async () => operative;

            const descriptor = Object.getOwnPropertyDescriptor(window, "isSecureContext");
            const restoreSecureContext = () => {
                if (descriptor) {
                    Object.defineProperty(window, "isSecureContext", descriptor);
                } else {
                    delete (window as any).isSecureContext;
                }
            };

            const file = new File(["payload"], `explorer-safe-${Date.now()}.txt`, { type: "text/plain" });
            let insecureCalls = 0;
            Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });
            operative.path = "/";
            await operative.onDrop({
                dataTransfer: {
                    files: [file],
                    items: [{
                        kind: "file",
                        getAsFile: () => file,
                        getAsFileSystemHandle: () => {
                            insecureCalls += 1;
                            return Promise.resolve(null);
                        }
                    }],
                    getData: () => ""
                },
                preventDefault: () => {}
            });

            let secureCalls = 0;
            let calledAfterAwait = false;
            let afterEventTurn = false;
            Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
            operative.path = "/";
            const directoryItem = {
                kind: "file",
                getAsFile: () => null,
                webkitGetAsEntry: () => ({ isDirectory: true }),
                getAsFileSystemHandle: () => {
                    secureCalls += 1;
                    if (afterEventTurn) calledAfterAwait = true;
                    return Promise.resolve(null);
                }
            };
            const pendingDrop = operative.onDrop({
                dataTransfer: { files: [], items: [directoryItem], getData: () => "" },
                preventDefault: () => {}
            });
            afterEventTurn = true;
            await pendingDrop;
            restoreSecureContext();

            return { insecureCalls, secureCalls, calledAfterAwait };
        });

        assert.equal(result.insecureCalls, 0);
        assert.equal(result.secureCalls, 1);
        assert.equal(result.calledAfterAwait, false);
    } finally {
        await browser.close();
    }
});
