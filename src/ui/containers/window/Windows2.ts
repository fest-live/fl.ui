/*
 * Filename: Windows2.ts
 * FullPath: modules/projects/fl.ui/src/ui/containers/window/Windows2.ts
 * Change date and time: 18.08.00_28.07.2026
 * Reason for changes: ui-window shell with phosphor control icons + light/dark chrome.
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

/**
 * Draggable window chrome: titlebar + content + footer slots, standard window controls.
 * Themes: inherit `color-scheme`, or set `data-theme="light"|"dark"` on the host.
 */
// @ts-ignore
@defineElement("ui-window")
export class Windows2 extends UIElement {
    @property({ source: "query", name: ".title-handler" }) titleHandler?: HTMLElement;
    @property({ source: "query", name: ".content-handler" }) contentHandler?: HTMLElement;
    @property({ source: "query", name: ".footer-handler" }) footerHandler?: HTMLElement;

    /** Cumulative drag offset in CSS pixels. */
    #ox = numberRef(0);
    #oy = numberRef(0);
    #dragUnbind: (() => void) | null = null;

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
        </div>`;
    };

    constructor() {
        super();
    }

    onInitialize() {
        super.onInitialize();
    }

    onRender() {
        super.onRender();
        // Host leaves ux-preload display:none once chrome styles are adopted.
        (this as HTMLElement).style.display ||= "block";
        // WHY: titlebar lives in shadow; wire after first paint when nodes exist.
        queueMicrotask(() => {
            this.#wireControls();
            this.#wireDrag();
        });
    }

    /** Toggle maximized layout; CSS swaps maximize/restore icons via :host([maximized]). */
    toggleMaximize(): void {
        const next = !this.hasAttribute("maximized");
        this.toggleAttribute("maximized", next);
        if (next) this.removeAttribute("minimized");
        this.dispatchEvent(new CustomEvent(next ? "window-maximize" : "window-restore", { bubbles: true }));
    }

    toggleMinimize(): void {
        const next = !this.hasAttribute("minimized");
        this.toggleAttribute("minimized", next);
        if (next) this.removeAttribute("maximized");
        this.dispatchEvent(new CustomEvent(next ? "window-minimize" : "window-restore", { bubbles: true }));
    }

    closeWindow(): void {
        // WHY: cancelable so hosts can keep the node (dialogs, dirty state).
        const allowed = this.dispatchEvent(
            new CustomEvent("window-close", { bubbles: true, cancelable: true })
        );
        if (!allowed) return;
        this.remove();
    }

    #wireControls(): void {
        if ((this as any).dataset?.flWinControls === "1") return;
        (this as any).dataset.flWinControls = "1";
        addEvent(this, "click", (ev: Event) => {
            const t = ev.target as HTMLElement | null;
            if (!t) return;
            // COMPAT: composedPath reaches into shadow for ui-icon clicks.
            const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
            const hit = (sel: string) =>
                (t.closest?.(sel) as HTMLElement | null) ||
                (path.find((n) => n instanceof Element && (n as Element).matches?.(sel)) as Element | undefined);

            if (hit(".title-close")) {
                ev.preventDefault();
                this.closeWindow();
                return;
            }
            if (hit(".title-maximize")) {
                ev.preventDefault();
                this.toggleMaximize();
                return;
            }
            if (hit(".title-minimize")) {
                ev.preventDefault();
                this.toggleMinimize();
            }
        });
    }

    /**
     * Titlebar drag — translates the host. Ignores clicks on control buttons.
     * NOTE: uses pointer capture so drag continues outside the bar.
     */
    #wireDrag(): void {
        const root = this.shadowRoot ?? this;
        const bar = (this.titleHandler ?? root.querySelector?.(".title-handler")) as HTMLElement | null;
        if (!bar || this.#dragUnbind) return;

        const pointerMap = new Map<number, { sx: number; sy: number; ox: number; oy: number }>();

        bindStyle(this, S`transform: translate(${this.#ox}px, ${this.#oy}px)`);
        const offDown = addEvent(bar, "pointerdown", (ev: PointerEvent) => {
            if (ev.button !== 0) return;
            const t = ev.target as HTMLElement | null;
            if (t?.closest("button, a, input, textarea, select, [data-no-drag]")) return;
            if (this.hasAttribute("maximized")) return;

            //this.#ox.value = 0;
            //this.#oy.value = 0;
            ev.preventDefault();
            this.setPointerCapture?.(ev.pointerId);
            pointerMap.set(ev.pointerId, {
                sx: ev.clientX,
                sy: ev.clientY,
                ox: this.#ox.value,
                oy: this.#oy.value
            });

            const offMove = addEvent(document.body, "pointermove", (ev: PointerEvent) => {
                const p = pointerMap.get(ev.pointerId);
                if (!p) return;
                this.#ox.value = p.ox + (ev.clientX - p.sx);
                this.#oy.value = p.oy + (ev.clientY - p.sy);
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

}

export default Windows2;
