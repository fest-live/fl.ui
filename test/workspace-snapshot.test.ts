import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const FL_UI_URL = process.env.FL_UI_WORKSPACE_URL || "http://127.0.0.1:8441/?suite=overlays";
const CATALOG_KEY = "cw::workspace::pages";

test("removing a shortcut updates the active workspace snapshot", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.goto(FL_UI_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        const result = await page.evaluate(async (catalogKey) => {
            const launcher = await import("/src/ui/speed-dial/launcher-state.ts");
            await import("/src/ui/speed-dial/workspace-pages.ts");
            const item = {
                id: "shortcut-network",
                cell: [0, 0],
                icon: "wifi-high",
                label: "Network",
                action: "open-view",
                meta: { action: "open-view", view: "network" },
            };
            launcher.applySpeedDialSnapshot({ items: [item] });
            localStorage.setItem(catalogKey, JSON.stringify({
                activeId: "side-a",
                pages: [{ id: "side-a", label: "Side A", path: "/user/workspaces/side-a/" }],
                snapshots: { "side-a": { items: [item] } },
            }));

            const removed = launcher.removeSpeedDialItem("shortcut-network");
            await new Promise((resolve) => setTimeout(resolve, 0));
            const catalog = JSON.parse(localStorage.getItem(catalogKey) || "{}");
            const snapshotItems = catalog?.snapshots?.["side-a"]?.items ?? [];
            localStorage.removeItem(catalogKey);
            return {
                removed,
                snapshotIds: snapshotItems.map((entry: { id?: string }) => entry.id),
            };
        }, CATALOG_KEY);

        assert.equal(result.removed, true);
        assert.equal(result.snapshotIds.includes("shortcut-network"), false);
    } finally {
        await browser.close();
    }
});
