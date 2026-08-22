import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const FL_UI_URL = process.env.FL_UI_LEGACY_URL || "http://127.0.0.1:8441/";
const SPEED_DIAL_KEY = "cw::workspace::speed-dial";
const LEGACY_DESKTOP_KEY = "cw-oriented-desktop-layout-v1";

test("an explicitly empty speed dial does not re-import legacy Network", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.goto(FL_UI_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        const ids = await page.evaluate(async ({ speedDialKey, legacyDesktopKey }) => {
            localStorage.setItem(speedDialKey, "[]");
            localStorage.setItem(legacyDesktopKey, JSON.stringify({
                v: 2,
                updatedAt: new Date().toISOString(),
                columns: 4,
                rows: 8,
                items: [{
                    id: "shortcut-network",
                    cell: [0, 0],
                    icon: "wifi-high",
                    label: "Network",
                    viewId: "network",
                }],
            }));
            const launcher = await import("/src/ui/speed-dial/launcher-state.ts");
            return Array.from(launcher.speedDialItems as ArrayLike<{ id: string }>).map((item) => item.id);
        }, { speedDialKey: SPEED_DIAL_KEY, legacyDesktopKey: LEGACY_DESKTOP_KEY });

        assert.equal(ids.includes("shortcut-network"), false);
    } finally {
        await browser.close();
    }
});
