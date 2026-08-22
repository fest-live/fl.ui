import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const FL_UI_URL = process.env.FL_UI_FORMS_URL || "http://127.0.0.1:8440/?suite=forms";

test("form bindings synchronize controls and survive remount", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.goto(FL_UI_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForFunction(() => document.querySelector("#fl-ui-suite-status")?.dataset.state === "ready");
        await page.waitForFunction(() => document.querySelector<HTMLInputElement>("#fl-ui-playground input[type=text]")?.value === "hello");
        const result = await page.evaluate(async () => {
            const text = document.querySelector<HTMLInputElement>("#fl-ui-playground input[type=text]");
            const select = document.querySelector<HTMLSelectElement>("#fl-ui-playground select");
            const checkbox = document.querySelector<HTMLInputElement>("#fl-ui-playground input[type=checkbox]");
            if (!text || !select || !checkbox) return null;
            text.value = "updated";
            text.dispatchEvent(new Event("input", { bubbles: true }));
            select.value = "gamma";
            select.dispatchEvent(new Event("change", { bubbles: true }));
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));
            const before = document.querySelector<HTMLOutputElement>("#fl-ui-playground output")?.value ?? "";
            const remount = Array.from(document.querySelectorAll<HTMLButtonElement>("#fl-ui-playground button"))
                .find((button) => button.textContent === "Unmount and remount form");
            remount?.click();
            await new Promise((resolve) => setTimeout(resolve, 0));
            return {
                before,
                after: document.querySelector<HTMLOutputElement>("#fl-ui-playground output")?.value ?? "",
                select: document.querySelector<HTMLSelectElement>("#fl-ui-playground select")?.value ?? "",
            };
        });

        assert.ok(result);
        assert.match(result.before, /text=updated/);
        assert.match(result.before, /select=gamma/);
        assert.match(result.before, /checked=false/);
        assert.match(result.after, /text=updated/);
        assert.equal(result.select, "gamma");
    } finally {
        await browser.close();
    }
});
