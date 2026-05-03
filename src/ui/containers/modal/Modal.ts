/**
 * Simple modal: backdrop + anchored panel (same junction mixins as `Windows.ts`).
 */
import { createAnchoredWindowShell, type AnchoredWindowOptions } from "../window/Windows";

export type AnchoredModalOptions = AnchoredWindowOptions & {
    /** Called when backdrop is clicked (primary pointer only). */
    onBackdropClose?: () => void;
};

export function createAnchoredModal(opts: AnchoredModalOptions = {}): { backdrop: HTMLElement; panel: HTMLElement } {
    const backdrop = document.createElement("div");
    backdrop.className = "ui-anchored-modal-backdrop";
    backdrop.setAttribute("role", "presentation");
    backdrop.style.cssText =
        "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:1rem;" +
        "background:color-mix(in oklab, #020617 65%, transparent);backdrop-filter:blur(6px);";

    const { frame: panel } = createAnchoredWindowShell(opts);
    panel.style.position = "relative";
    panel.style.left = "auto";
    panel.style.top = "auto";
    panel.style.margin = "0";

    backdrop.appendChild(panel);

    const { onBackdropClose } = opts;
    backdrop.addEventListener("pointerdown", (ev) => {
        if (ev.target === backdrop && onBackdropClose) onBackdropClose();
    });

    return { backdrop, panel };
}
