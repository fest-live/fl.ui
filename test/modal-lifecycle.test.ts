import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const FL_UI_URL = process.env.FL_UI_MODAL_URL || "http://127.0.0.1:8438/?suite=overlays";

test("openModal supports native and fallback lifecycle contracts", async () => {
    const browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.goto(FL_UI_URL, { waitUntil: "networkidle0", timeout: 30_000 });
        const result = await page.evaluate(async () => {
            const styles = await import("/src/styles/index.scss?inline");
            const injectedStyles = document.createElement("style");
            injectedStyles.textContent = styles.default;
            document.head.append(injectedStyles);
            const { openModal } = await import("/src/ui/containers/modal/Modal.ts");
            const { closeHighestPriority } = await import("/test/overlay-lifecycle-bridge.ts");
            const trigger = document.createElement("button");
            document.body.append(trigger);
            trigger.focus();

            const nativeInput = document.createElement("input");
            const native = openModal({
                id: "native-modal-test",
                content: nativeInput,
                initialFocus: nativeInput,
            });
            await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
            const nativeElement = native.element;
            const nativeOpen = nativeElement instanceof HTMLDialogElement && nativeElement.open;
            const nativeFocused = document.activeElement === nativeInput;
            const nativeClosed = closeHighestPriority()?.id ?? null;
            await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
            const nativeRestored = document.activeElement === trigger;

            const fallbackInput = document.createElement("input");
            const fallback = openModal({
                id: "fallback-modal-test",
                content: fallbackInput,
                useNativeDialog: false,
                initialFocus: fallbackInput,
            });
            const fallbackElement = fallback.element;
            const fallbackOpen = fallbackElement.classList.contains("ui-modal-backdrop");
            const fallbackPosition = getComputedStyle(fallbackElement).position;
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
            const fallbackClosed = !fallbackElement.isConnected;

            const backdropModal = openModal({
                content: document.createElement("button"),
                useNativeDialog: false,
            });
            const backdropElement = backdropModal.element;
            backdropElement.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
            await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
            const backdropClosed = !backdropElement.isConnected;

            trigger.remove();
            injectedStyles.remove();
            return {
                nativeOpen,
                nativeFocused,
                nativeClosed,
                nativeRestored,
                fallbackOpen,
                fallbackPosition,
                fallbackClosed,
                backdropClosed,
            };
        });

        assert.equal(result.nativeOpen, true);
        assert.equal(result.nativeFocused, true);
        assert.match(result.nativeClosed || "", /native-modal-test/);
        assert.equal(result.nativeRestored, true);
        assert.equal(result.fallbackOpen, true);
        assert.equal(result.fallbackPosition, "fixed");
        assert.equal(result.fallbackClosed, true);
        assert.equal(result.backdropClosed, true);
    } finally {
        await browser.close();
    }
});
