import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const FL_UI_URL = process.env.FL_UI_FLYOUT_URL || "http://127.0.0.1:8439/?suite=overlays";

test("calendar flyout uses composed dismiss and transient back lifecycle", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.goto(FL_UI_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.evaluate(async () => {
            (window as any).__chromeFlyoutTest = {
                chrome: await import("/src/ui/navigation/flyout/ChromeFlyout.ts"),
                calendar: await import("/src/ui/navigation/calendar/CalendarFlyout.ts"),
                lifecycle: await import("/test/overlay-lifecycle-bridge.ts"),
            };
        });
        const result = await page.evaluate(() => {
            const { chrome, calendar, lifecycle } = (window as any).__chromeFlyoutTest;
            const { setChromeFlyoutShellHost } = chrome;
            const { toggleCalendarFlyout } = calendar;
            const { closeHighestPriority } = lifecycle;
            const shellHost = document.createElement("div");
            shellHost.className = "env-shell-root";
            const anchor = document.createElement("button");
            anchor.setAttribute("data-chrome-flyout-anchor", "calendar");
            shellHost.append(anchor);
            document.body.append(shellHost);
            setChromeFlyoutShellHost(shellHost);

            toggleCalendarFlyout(anchor);
            const flyout = document.querySelector<HTMLElement>("ui-calendar-flyout");
            const mountedInShell = flyout?.parentElement?.parentElement === shellHost;
            const opened = flyout?.hasAttribute("open") ?? false;

            anchor.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
            const anchorKeepsOpen = flyout?.hasAttribute("open") ?? false;
            document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
            const outsideClosed = !flyout?.hasAttribute("open");

            toggleCalendarFlyout(anchor);
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            const escapeClosed = !flyout?.hasAttribute("open");

            toggleCalendarFlyout(anchor);
            const backClosed = closeHighestPriority()?.id ?? null;
            const afterBackClosed = !flyout?.hasAttribute("open");
            shellHost.remove();
            setChromeFlyoutShellHost(null);
            return {
                mountedInShell,
                opened,
                anchorKeepsOpen,
                outsideClosed,
                escapeClosed,
                backClosed,
                afterBackClosed,
            };
        });

        assert.equal(result.mountedInShell, true);
        assert.equal(result.opened, true);
        assert.equal(result.anchorKeepsOpen, true);
        assert.equal(result.outsideClosed, true);
        assert.equal(result.escapeClosed, true);
        assert.match(result.backClosed || "", /chrome-flyout-calendar/);
        assert.equal(result.afterBackClosed, true);
    } finally {
        await browser.close();
    }
});
