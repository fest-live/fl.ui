/**
 * Simple modal: backdrop + anchored panel (same junction mixins as `Windows.ts`).
 */
import { registerTransientOverlay } from "@fest-lib/lure";
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

export type ModalCloseReason = "backdrop" | "escape" | "native" | "programmatic" | "back" | "dispose";

export type ModalOptions = {
    content: HTMLElement | DocumentFragment;
    id?: string;
    className?: string;
    initialFocus?: HTMLElement | string | null;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    useNativeDialog?: boolean;
    onClose?: (reason: ModalCloseReason) => void;
};

export type ModalController = {
    element: HTMLDialogElement | HTMLDivElement;
    panel: HTMLElement;
    close: (reason?: ModalCloseReason) => void;
    dispose: () => void;
};

const focusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const resolveInitialFocus = (panel: HTMLElement, initial: ModalOptions["initialFocus"]): HTMLElement | null => {
    if (initial instanceof HTMLElement) return initial;
    if (typeof initial === "string") return panel.querySelector<HTMLElement>(initial);
    return panel.querySelector<HTMLElement>(focusableSelector) ?? panel;
};

/**
 * Open a top-layer native dialog when available, falling back to an interactive
 * backdrop while preserving one close/focus/back-navigation lifecycle.
 */
export const openModal = ({
    content,
    id,
    className = "",
    initialFocus = null,
    closeOnBackdrop = true,
    closeOnEscape = true,
    useNativeDialog = true,
    onClose,
}: ModalOptions): ModalController => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nativeRequested = useNativeDialog && typeof HTMLDialogElement !== "undefined";
    let nativeDialog: HTMLDialogElement | null = null;
    let element: HTMLDialogElement | HTMLDivElement;
    let panel: HTMLElement;

    if (nativeRequested) {
        const dialog = document.createElement("dialog");
        dialog.className = `ui-modal-dialog ${className}`.trim();
        if (id) dialog.id = id;
        panel = document.createElement("div");
        panel.className = "ui-modal-panel";
        dialog.append(panel);
        document.body.append(dialog);
        try {
            dialog.showModal();
            nativeDialog = dialog;
            element = dialog;
        } catch {
            dialog.remove();
            nativeDialog = null;
            element = document.createElement("div");
            element.className = `ui-modal-backdrop ${className}`.trim();
            if (id) element.id = id;
            panel = document.createElement("div");
            panel.className = "ui-modal-panel";
            element.append(panel);
            document.body.append(element);
        }
    } else {
        element = document.createElement("div");
        element.className = `ui-modal-backdrop ${className}`.trim();
        if (id) element.id = id;
        panel = document.createElement("div");
        panel.className = "ui-modal-panel";
        element.append(panel);
        document.body.append(element);
    }

    panel.append(content);
    let closed = false;
    let closeReason: ModalCloseReason = "programmatic";
    let unregister: (() => void) | null = null;

    const restoreFocus = () => {
        if (previousFocus?.isConnected) {
            requestAnimationFrame(() => previousFocus.focus?.({ preventScroll: true }));
        }
    };
    const cleanup = () => {
        document.removeEventListener("keydown", onKeyDown, true);
        element.removeEventListener("pointerdown", onBackdropPointerDown);
        nativeDialog?.removeEventListener("cancel", onNativeCancel);
        nativeDialog?.removeEventListener("close", onNativeClose);
        unregister?.();
        unregister = null;
    };
    const finish = (reason: ModalCloseReason) => {
        if (closed) return;
        closed = true;
        cleanup();
        element.remove();
        onClose?.(reason);
        restoreFocus();
    };
    const close = (reason: ModalCloseReason = "programmatic") => {
        if (closed) return;
        closeReason = reason;
        if (nativeDialog?.open) {
            nativeDialog.close();
        }
        finish(reason);
    };
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && closeOnEscape) {
            event.preventDefault();
            close("escape");
        }
    };
    const onBackdropPointerDown = (event: PointerEvent) => {
        if (closeOnBackdrop && event.target === element) close("backdrop");
    };
    const onNativeCancel = (event: Event) => {
        if (!closeOnEscape) {
            event.preventDefault();
            return;
        }
        event.preventDefault();
        close("escape");
    };
    const onNativeClose = () => finish(closeReason === "programmatic" ? "native" : closeReason);

    element.addEventListener("pointerdown", onBackdropPointerDown);
    nativeDialog?.addEventListener("cancel", onNativeCancel);
    nativeDialog?.addEventListener("close", onNativeClose);
    if (!nativeDialog && closeOnEscape) {
        document.addEventListener("keydown", onKeyDown, true);
    }
    unregister = registerTransientOverlay({
        id,
        kind: "modal",
        element,
        isActive: () => !closed && element.isConnected && (nativeDialog ? nativeDialog.open : true),
        close: () => {
            close("back");
            return true;
        },
    });
    requestAnimationFrame(() => resolveInitialFocus(panel, initialFocus)?.focus?.({ preventScroll: true }));

    return { element, panel, close, dispose: () => close("dispose") };
};
