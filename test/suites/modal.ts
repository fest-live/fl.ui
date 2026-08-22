/*
 * Filename: modal.ts
 * FullPath: modules/projects/fl.ui/test/suites/modal.ts
 * Reason for changes: Exercise the public native-first Modal helper lifecycle.
 */

import "../../src/styles/index.scss";
import { closeHighestPriority } from "@fest-lib/lure";
import { openModal, type ModalController } from "../../src/ui/containers/modal/Modal";

export function mount(el: HTMLElement): void {
    el.style.cssText =
        "display:flex;flex-direction:column;gap:1rem;padding:1rem;position:relative;box-sizing:border-box;";

    const caption = document.createElement("p");
    caption.className = "fl-ui-dev-suite-caption";
    caption.textContent =
        "Modal — native top-layer dialog by default, with controlled fallback and priority-based close.";

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;";
    const nativeButton = document.createElement("button");
    nativeButton.type = "button";
    nativeButton.textContent = "Open native modal";
    const fallbackButton = document.createElement("button");
    fallbackButton.type = "button";
    fallbackButton.textContent = "Open fallback modal";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close highest priority";
    const status = document.createElement("output");
    status.style.cssText = "font:0.8rem ui-monospace,monospace;color:#9bb6df;";
    controls.append(nativeButton, fallbackButton, closeButton, status);

    const open = (useNativeDialog: boolean) => {
        const content = document.createElement("div");
        const title = document.createElement("h2");
        title.textContent = useNativeDialog ? "Native dialog" : "Fallback modal";
        const description = document.createElement("p");
        description.textContent = "Escape, backdrop click, and back priority all close this modal.";
        const input = document.createElement("input");
        input.placeholder = "Initial focus";
        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "Close";
        content.append(title, description, input, close);

        let controller: ModalController;
        controller = openModal({
            id: `modal-demo-${useNativeDialog ? "native" : "fallback"}`,
            content,
            initialFocus: input,
            useNativeDialog,
            onClose: (reason) => {
                status.value = `closed: ${reason}`;
            },
        });
        close.addEventListener("click", () => controller.close("programmatic"));
        status.value = `open: ${controller.element instanceof HTMLDialogElement ? "native" : "fallback"}`;
    };

    nativeButton.addEventListener("click", () => open(true));
    fallbackButton.addEventListener("click", () => open(false));
    closeButton.addEventListener("click", () => {
        const closed = closeHighestPriority();
        status.value = closed ? `closed: ${closed.id}` : "no active modal";
    });
    el.append(caption, controls);
    status.value = "ready";
}
