/*
 * Filename: Windows2.ts
 * FullPath: modules/projects/fl.ui/src/ui/containers/window/Windows2.ts
 * Change date and time: 07.25.00_29.07.2026
 * Reason for changes: Reliable titlebar controls via capture delegation + retry wire.
 */
import { defineElement, property, H, numberRef, bindStyle, S } from "fest/lure";
import { preloadStyle, addEvent } from "fest/dom";
import { UIElement } from "fl-ui/base/UIElement";
import "fest/icon";

// @ts-ignore — Vite inline SCSS → adopted stylesheet
import styles from "./Windows2.scss?inline";

const styled = preloadStyle(styles);

/** Phosphor names (duotone registry): minimize / maximize / restore / close. */
const ICON_MINIMIZE = "minus";
const ICON_MAXIMIZE = "corners-out";
const ICON_RESTORE = "corners-in";
const ICON_CLOSE = "x";

const DRAG_MIN = Object.freeze({ w: 240, h: 160 });

export type UiWindowBounds = {
    x: number;
    y: number;
    w: number;
    h: number;
};

/**
 * Draggable window chrome: titlebar + content + footer slots, standard window controls.
 *
 * INVARIANT: when `managed` is set, the host shell owns left/top/width/height/z;
 * chrome emits `window-move` / `window-resize` / `window-focus` / max|min|close intents.
 */
// @ts-ignore
@defineElement("ui-window")
export class Windows2 extends UIElement {
    @property({ source: "query", name: ".title-handler" }) titleHandler?: HTMLElement;
    @property({ source: "query", name: ".content-handler" }) contentHandler?: HTMLElement;
    @property({ source: "query", name: ".footer-handler" }) footerHandler?: HTMLElement;
    @property({ source: "query", name: ".window-resizer" }) resizer?: HTMLElement;

    /** Cumulative drag offset in CSS pixels (unmanaged / standalone mode). */
    #ox = numberRef(0);
    #oy = numberRef(0);
    #dragUnbind: (() => void) | null = null;
    #resizeUnbind: (() => void) | null = null;
    #focusUnbind: (() => void) | null = null;
    #controlsUnbind: (() => void) | null = null;
    #controlsReady = false;
    #wireAttempts = 0;

    // WHY: UIElement defines `render`/`styles` as instance fields; subclass methods would be shadowed.
    styles = function () { return styled; };
    render = function (this: Windows2) {
        return H`<div class="window-container" part="window-container">
            <header class="title-handler" part="title-handler">
                <div class="title-handler-main" part="title">
                    <slot name="title"></slot>
                </div>
                <div class="title-handler-actions" part="actions">
                    <slot name="actions"></slot>
                </div>
                <div class="title-handler-buttons" part="controls">
                    <button class="title-minimize" type="button" aria-label="Minimize" title="Minimize">
                        <ui-icon icon=${ICON_MINIMIZE}></ui-icon>
                    </button>
                    <button class="title-maximize" type="button" aria-label="Maximize" title="Maximize">
                        <span class="icon-maximize" aria-hidden="true"><ui-icon icon=${ICON_MAXIMIZE}></ui-icon></span>
                        <span class="icon-restore" aria-hidden="true"><ui-icon icon=${ICON_RESTORE}></ui-icon></span>
                    </button>
                    <button class="title-close" type="button" aria-label="Close" title="Close">
                        <ui-icon icon=${ICON_CLOSE}></ui-icon>
                    </button>
                </div>
            </header>
            <div class="content-handler" part="content-handler">
                <slot name="content"></slot>
                <slot></slot>
            </div>
            <footer class="footer-handler" part="footer-handler">
                <slot name="footer"></slot>
            </footer>
            <div class="window-resizer" part="resizer" aria-hidden="true" data-no-drag></div>
        </div>`;
    };

    constructor() {
        super();
    }

    /** Shell-driven chrome: position/size come from host CSS, not transform. */
    get managed(): boolean {
        return this.hasAttribute("managed");
    }

    onInitialize() {
        super.onInitialize();
    }

    onRender() {
        super.onRender();
        this.#scheduleChromeWire();
    }

    connectedCallback(): void {
        super.connectedCallback?.();
        this.#scheduleChromeWire();
    }

    #scheduleChromeWire(): void {
        const run = (): void => {
            this.#wireControls();
            this.#wireFocus();
            this.#wireDrag();
            this.#wireResize();
            // WHY: first microtask can race shadow paint; retry until control host exists.
            if (!this.#controlsReady && this.#wireAttempts < 20) {
                this.#wireAttempts += 1;
                requestAnimationFrame(run);
            }
        };
        queueMicrotask(run);
    }

    /** Apply absolute bounds (managed shells / workspace layer). */
    applyBounds(bounds: Partial<UiWindowBounds> & { z?: number }): void {
        const el = this as HTMLElement;
        el.style.position = "absolute";
        if (typeof bounds.x === "number") el.style.left = `${bounds.x}px`;
        if (typeof bounds.y === "number") el.style.top = `${bounds.y}px`;
        if (typeof bounds.w === "number") {
            el.style.width = `${bounds.w}px`;
            el.style.setProperty("--ui-win-width", `${bounds.w}px`);
        }
        if (typeof bounds.h === "number") {
            el.style.height = `${bounds.h}px`;
            el.style.setProperty("--ui-win-height", `${bounds.h}px`);
        }
        if (typeof bounds.z === "number") el.style.zIndex = String(bounds.z);
        el.style.right = "";
        el.style.bottom = "";
        if (this.managed) {
            this.#ox.value = 0;
            this.#oy.value = 0;
            el.style.transform = "";
        }
    }

    setVisible(visible: boolean): void {
        this.toggleAttribute("hidden-window", !visible);
        (this as HTMLElement).style.visibility = visible ? "" : "hidden";
        (this as HTMLElement).style.pointerEvents = visible ? "" : "none";
    }

    get isMaximized(): boolean {
        return (
            this.hasAttribute("maximized") ||
            this.hasAttribute("data-desk-max") ||
            this.hasAttribute("data-mobile-max")
        );
    }

    get isMinimized(): boolean {
        return this.hasAttribute("minimized");
    }

    #emitChrome(name: string, cancelable = false): boolean {
        return this.dispatchEvent(
            new CustomEvent(name, { bubbles: true, composed: true, cancelable })
        );
    }

    /**
     * WHY (managed): only emit intent — environment-shell owns attrs via applyChrome.
     */
    toggleMaximize(): void {
        const restoring = this.isMaximized;
        if (this.managed) {
            this.#emitChrome(restoring ? "window-restore" : "window-maximize");
            return;
        }
        const next = !restoring;
        this.toggleAttribute("maximized", next);
        if (next) this.removeAttribute("minimized");
        this.#emitChrome(next ? "window-maximize" : "window-restore");
    }

    toggleMinimize(): void {
        if (this.managed) {
            this.#emitChrome(this.isMinimized ? "window-restore" : "window-minimize");
            return;
        }
        const next = !this.isMinimized;
        this.toggleAttribute("minimized", next);
        if (next) this.removeAttribute("maximized");
        this.#emitChrome(next ? "window-minimize" : "window-restore");
    }

    restoreWindow(): void {
        if (this.managed) {
            this.#emitChrome("window-restore");
            return;
        }
        const wasMin = this.isMinimized;
        const wasMax = this.isMaximized;
        this.removeAttribute("minimized");
        this.removeAttribute("maximized");
        if (wasMin || wasMax) this.#emitChrome("window-restore");
    }

    closeWindow(): void {
        const allowed = this.#emitChrome("window-close", true);
        if (!allowed) return;
        this.remove();
    }

    #wireFocus(): void {
        if (this.#focusUnbind) return;
        this.#focusUnbind = addEvent(
            this,
            "pointerdown",
            () => {
                this.requestFocus();
            },
            { capture: true, passive: true }
        );
    }

    requestFocus(): void {
        this.dispatchEvent(new CustomEvent("window-focus", { bubbles: true, composed: true }));
    }

    bringToFront(z: number): void {
        const el = this as HTMLElement;
        if (Number.isFinite(z)) el.style.zIndex = String(z);
        el.toggleAttribute("data-focused", true);
    }

    clearFocused(): void {
        (this as HTMLElement).toggleAttribute("data-focused", false);
    }

    /** Resolve control hit from composedPath (works for ui-icon shadow retargeting). */
    #hitControl(ev: Event): "minimize" | "maximize" | "close" | null {
        const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
        for (const n of path) {
            if (!(n instanceof Element)) continue;
            if (n.matches?.(".title-close")) return "close";
            if (n.matches?.(".title-maximize")) return "maximize";
            if (n.matches?.(".title-minimize")) return "minimize";
        }
        const t = ev.target;
        if (t instanceof Element) {
            if (t.closest?.(".title-close")) return "close";
            if (t.closest?.(".title-maximize")) return "maximize";
            if (t.closest?.(".title-minimize")) return "minimize";
        }
        return null;
    }

    #handleControlEvent(ev: Event): boolean {
        const which = this.#hitControl(ev);
        if (!which) return false;
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();
        if (which === "close") this.closeWindow();
        else if (which === "maximize") this.toggleMaximize();
        else this.toggleMinimize();
        return true;
    }

    #wireControls(): void {
        if (this.#controlsReady) return;
        const root = this.shadowRoot;
        if (!root) return;

        const titleBar = (this.titleHandler ?? root.querySelector(".title-handler")) as HTMLElement | null;
        const buttons = root.querySelector(".title-handler-buttons") as HTMLElement | null;
        if (!titleBar || !buttons) return;

        // WHY: only `click` (not also pointerup) — dual handlers double-toggle max/min.
        const onClick = (ev: Event): void => {
            this.#handleControlEvent(ev);
        };
        const onDbl = (ev: MouseEvent): void => {
            if (this.#hitControl(ev)) return;
            const t = ev.target as HTMLElement | null;
            if (t?.closest?.("button, a, input, textarea, select, [data-no-drag]")) return;
            ev.preventDefault();
            this.toggleMaximize();
        };

        // WHY: capture on controls host + stopImmediatePropagation so shell bubble fallback does not double-toggle.
        const offBtnClick = addEvent(buttons, "click", onClick, { capture: true });
        const offBarClick = addEvent(titleBar, "click", onClick, { capture: true });
        const offDbl = addEvent(titleBar, "dblclick", onDbl);

        this.#controlsUnbind = () => {
            offBtnClick?.();
            offBarClick?.();
            offDbl?.();
            this.#controlsUnbind = null;
            this.#controlsReady = false;
        };
        this.#controlsReady = true;
        this.#wireAttempts = 0;
    }

    #wireDrag(): void {
        const root = this.shadowRoot ?? this;
        const bar = (this.titleHandler ?? root.querySelector?.(".title-handler")) as HTMLElement | null;
        if (!bar || this.#dragUnbind) return;

        if (!this.managed) {
            bindStyle(this, S`transform: translate(${this.#ox}px, ${this.#oy}px)`);
        }

        const pointerMap = new Map<number, { sx: number; sy: number; ox: number; oy: number; bx: number; by: number }>();

        const offDown = addEvent(bar, "pointerdown", (ev: PointerEvent) => {
            if (ev.button !== 0) return;
            // WHY: never start drag from chrome controls (incl. ui-icon inside button).
            if (this.#hitControl(ev)) return;
            const t = ev.target as HTMLElement | null;
            if (t?.closest("button, a, input, textarea, select, [data-no-drag]")) return;
            if (this.isMaximized || this.isMinimized) return;

            this.requestFocus();
            ev.preventDefault();
            this.setPointerCapture?.(ev.pointerId);
            const host = this as HTMLElement;
            pointerMap.set(ev.pointerId, {
                sx: ev.clientX,
                sy: ev.clientY,
                ox: this.#ox.value,
                oy: this.#oy.value,
                bx: Number.parseFloat(host.style.left || "0") || 0,
                by: Number.parseFloat(host.style.top || "0") || 0
            });

            const offMove = addEvent(document.body, "pointermove", (ev: PointerEvent) => {
                const p = pointerMap.get(ev.pointerId);
                if (!p) return;
                const dx = ev.clientX - p.sx;
                const dy = ev.clientY - p.sy;
                if (this.managed) {
                    this.dispatchEvent(
                        new CustomEvent("window-move", {
                            bubbles: true,
                            composed: true,
                            detail: { x: p.bx + dx, y: p.by + dy, dx, dy }
                        })
                    );
                    return;
                }
                this.#ox.value = p.ox + dx;
                this.#oy.value = p.oy + dy;
            });

            const end = (ev: PointerEvent) => {
                if (!pointerMap.has(ev.pointerId)) return;
                pointerMap.delete(ev.pointerId);
                try {
                    this.releasePointerCapture?.(ev.pointerId);
                } catch {
                    /* already released */
                }
                offMove?.();
                offUp?.();
                offCancel?.();
            };

            const offUp = addEvent(document.body, "pointerup", end);
            const offCancel = addEvent(document.body, "pointercancel", end);
        });

        this.#dragUnbind = () => {
            offDown?.();
        };
    }

    #wireResize(): void {
        const root = this.shadowRoot ?? this;
        const grip = (this.resizer ?? root.querySelector?.(".window-resizer")) as HTMLElement | null;
        if (!grip || this.#resizeUnbind) return;

        const pointerMap = new Map<number, { sx: number; sy: number; w: number; h: number }>();

        const offDown = addEvent(grip, "pointerdown", (ev: PointerEvent) => {
            if (ev.button !== 0) return;
            if (this.isMaximized || this.isMinimized) return;
            ev.preventDefault();
            ev.stopPropagation();
            this.requestFocus();
            this.setPointerCapture?.(ev.pointerId);
            const rect = (this as HTMLElement).getBoundingClientRect();
            pointerMap.set(ev.pointerId, {
                sx: ev.clientX,
                sy: ev.clientY,
                w: rect.width,
                h: rect.height
            });

            const offMove = addEvent(document.body, "pointermove", (ev: PointerEvent) => {
                const p = pointerMap.get(ev.pointerId);
                if (!p) return;
                const w = Math.max(DRAG_MIN.w, p.w + (ev.clientX - p.sx));
                const h = Math.max(DRAG_MIN.h, p.h + (ev.clientY - p.sy));
                if (this.managed) {
                    this.dispatchEvent(
                        new CustomEvent("window-resize", {
                            bubbles: true,
                            composed: true,
                            detail: { w, h }
                        })
                    );
                    return;
                }
                (this as HTMLElement).style.width = `${w}px`;
                (this as HTMLElement).style.height = `${h}px`;
                (this as HTMLElement).style.setProperty("--ui-win-width", `${w}px`);
                (this as HTMLElement).style.setProperty("--ui-win-height", `${h}px`);
            });

            const end = (ev: PointerEvent) => {
                if (!pointerMap.has(ev.pointerId)) return;
                pointerMap.delete(ev.pointerId);
                try {
                    this.releasePointerCapture?.(ev.pointerId);
                } catch {
                    /* already released */
                }
                offMove?.();
                offUp?.();
                offCancel?.();
            };

            const offUp = addEvent(document.body, "pointerup", end);
            const offCancel = addEvent(document.body, "pointercancel", end);
        });

        this.#resizeUnbind = () => {
            offDown?.();
        };
    }
}

export default Windows2;
