import type { View, ViewOptions } from "@shells/types";
import { defineElement, GLitElement, H, property } from "fest/lure";
import { ensureStyleSheet } from "fest/icon";

//
export interface CwViewViewerHostElement extends HTMLElement {
    shadowRoot: ShadowRoot | null;
}

/**
 * Compatibility adapter: current view implementations already satisfy `View`.
 * Keep this function as the canonical registry hook for future host adapters.
 *
 * Important: `{ ...viewInstance }` does **not** copy class methods (`handleMessage`, etc.),
 * which breaks unified-messaging registration (`bindViewReceiveChannel` requires
 * `handleMessage`). Return the live instance; wrapping `render` was redundant.
 */
export const createWebComponentViewAdapter = <T extends View>(view: T): T => {
    return view;
};
type ViewLike = {
    render: (options?: unknown) => HTMLElement;
};

type ViewOptionsLike = Record<string, unknown> | undefined;

const SHELL_TAG_PREFIX = "cw-shell-";
const VIEW_TAG_PREFIX = "cw-view-";
const WINDOW_FRAME_TAG = "cw-window-frame";

const normalizeToken = (value: string, fallback: string): string => {
    const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    return normalized || fallback;
};

class ShellHostElement extends HTMLElement {
    mountShellLayout(layout: HTMLElement): void {
        const root = this.shadowRoot || this.attachShadow({ mode: "open" });
        root.replaceChildren(layout);
    }
}

export class MinimalShellHostElement extends ShellHostElement {
    override mountShellLayout(layout: HTMLElement): void {
        const slotHost = layout.querySelector("[data-shell-content]");
        if (slotHost && !slotHost.querySelector('slot[name="view"]')) {
            const slot = document.createElement("slot");
            slot.name = "view";
            slotHost.appendChild(slot);
        }
        super.mountShellLayout(layout);
    }
}

export class WindowShellHostElement extends ShellHostElement {
    override mountShellLayout(layout: HTMLElement): void {
        const stage = layout.querySelector("[data-shell-content]");
        if (stage && !stage.querySelector('slot[name="window-frame"]')) {
            const frameSlot = document.createElement("slot");
            frameSlot.name = "window-frame";
            frameSlot.style.display = "contents";
            stage.appendChild(frameSlot);
        }
        super.mountShellLayout(layout);
    }
}

/** Plain `HTMLElement` — not `GLitElement`: GLit attaches a shadow in the ctor, which breaks
 * `renderIntoWebComponentHost` (it must own the first `attachShadow` for toolbar + slots). */
export class ViewHostElement extends HTMLElement {
    mountView(view: ViewLike, options?: ViewOptionsLike): void {
        const mountIntoHost = (view as { renderIntoWebComponentHost?: (host: HTMLElement, options?: unknown) => void })
            .renderIntoWebComponentHost;
        if (typeof mountIntoHost === "function") {
            mountIntoHost.call(view, this, options);
            return;
        }
        const element = view.render(options);
        this.replaceChildren(element);
    }
}

export class WindowFrameHostElement extends HTMLElement {
    private titleEl: HTMLElement | null = null;
    private pidEl: HTMLElement | null = null;
    private dragHandle: HTMLElement | null = null;
    private resizeHandle: HTMLElement | null = null;
    private _initialized = false;

    connectedCallback(): void {
        if (this._initialized) return;
        this._initialized = true;
        const root = this.shadowRoot || this.attachShadow({ mode: "open" });
        root.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    position: absolute;
                    overflow: visible;
                    user-select: none;
                    touch-action: none;
                    pointer-events: auto;
                    color-scheme: inherit;
                    --_size-x: calc(var(--initial-inline-size, 640px) + var(--resize-x, 0px));
                    --_size-y: calc(var(--initial-block-size, 480px) + var(--resize-y, 0px));
                    inset-inline-start: clamp(0px, var(--shift-x, 0px), calc(100% - var(--min-inline-size, 640px)));
                    inset-block-start: clamp(0px, var(--shift-y, 0px), calc(100% - var(--min-block-size, 480px)));
                    min-inline-size: var(--min-inline-size, 640px);
                    min-block-size: var(--min-block-size, 480px);
                    inline-size: clamp(var(--min-inline-size, 640px), var(--_size-x), calc(100% - var(--shift-x, 0px)));
                    block-size: clamp(var(--min-block-size, 480px), var(--_size-y), calc(100% - var(--shift-y, 0px)));
                    transform:
                        scale3d(var(--scale, 1), var(--scale, 1), var(--scale, 1))
                        translate3d(var(--drag-x, 0px), var(--drag-y, 0px), 0px);
                    transition: box-shadow 150ms ease;
                }
                :host(.is-maximized) {
                    inset-inline-start: 0 !important;
                    inset-block-start: 0 !important;
                    inline-size: 100% !important;
                    block-size: 100% !important;
                    transform: none !important;
                    --frame-radius: 0;
                }
                @media (max-width: 900px) {
                    :host(:not(.is-maximized)) {
                        --shift-x: 0 !important;
                        --shift-y: 0 !important;
                        --drag-x: 0 !important;
                        --drag-y: 0 !important;
                        inset-inline-start: 0 !important;
                        inset-block-start: 0 !important;
                        inline-size: 100% !important;
                        block-size: 100% !important;
                        min-inline-size: 0;
                        min-block-size: 0;
                        transform: none !important;
                        --frame-radius: 0;
                    }
                }
                .frame {
                    display: flex;
                    flex-direction: column;
                    flex: 1 1 0%;
                    min-block-size: 0;
                    min-inline-size: 0;
                    border: 1px solid light-dark(rgba(0, 0, 0, .1), rgba(120, 140, 180, .18));
                    border-radius: var(--frame-radius, 14px);
                    background: light-dark(rgba(255, 255, 255, .92), rgba(14, 18, 28, .88));
                    color: light-dark(#1a1c2b, #edf2ff);
                    overflow: hidden;
                    box-shadow: light-dark(
                        0 8px 32px rgba(0, 0, 0, .08), 0 0 0 0.5px rgba(0, 0, 0, .06),
                        0 8px 32px rgba(0, 0, 0, .35), 0 0 0 0.5px rgba(255, 255, 255, .06)
                    );
                    backdrop-filter: blur(2px);
                }
                :host(.is-active) .frame {
                    border-color: light-dark(rgba(59, 125, 219, .22), rgba(139, 183, 255, .22));
                    box-shadow: light-dark(
                        0 12px 42px rgba(0, 0, 0, .12), 0 0 0 0.5px rgba(59, 125, 219, .15),
                        0 12px 42px rgba(0, 0, 0, .42), 0 0 0 0.5px rgba(139, 183, 255, .15)
                    );
                }
                :host(.is-maximized) .frame {
                    border-radius: 0;
                    border-color: transparent;
                }
                :host(.is-drop-target) .frame {
                    border-color: light-dark(rgba(59, 125, 219, .35), rgba(139, 183, 255, .35));
                    box-shadow:
                        0 0 0 1px light-dark(rgba(59, 125, 219, .2), rgba(139, 183, 255, .2)),
                        0 12px 42px light-dark(rgba(0, 0, 0, .12), rgba(0, 0, 0, .42));
                }
                .bar {
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    gap: .4rem;
                    min-block-size: 36px;
                    padding: .3rem .6rem;
                    background: light-dark(rgba(245, 247, 252, .95), rgba(22, 28, 42, .7));
                    border-block-end: 1px solid light-dark(rgba(0, 0, 0, .06), rgba(255, 255, 255, .04));
                    user-select: none;
                    cursor: default;
                }
                .title {
                    flex: 1 1 auto;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: .84rem;
                    font-weight: 500;
                    opacity: .88;
                }
                .pid {
                    font-size: .7rem;
                    opacity: .4;
                    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                }
                .btns { display: flex; gap: .15rem; }
                button {
                    border: 0;
                    border-radius: 6px;
                    padding: .22rem .42rem;
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    font-size: .82rem;
                    line-height: 1;
                    opacity: .5;
                    transition: opacity 100ms ease, background 100ms ease;
                }
                button:hover { background: light-dark(rgba(0, 0, 0, .06), rgba(255, 255, 255, .1)); opacity: 1; }
                button[data-window-action="popout"] { font-size: .76rem; }
                button[data-window-action="close"]:hover { background: rgba(220, 60, 60, .45); opacity: 1; }
                .content {
                    position: relative;
                    flex: 1 1 0%;
                    inline-size: 100%;
                    min-inline-size: 0;
                    min-block-size: 0;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                ::slotted(*) {
                    flex: 1 1 0%;
                    box-sizing: border-box;
                    inline-size: 100%;
                    min-inline-size: 0;
                    min-block-size: 0;
                    overflow: auto;
                }
                .resize {
                    position: absolute;
                    inline-size: 18px;
                    block-size: 18px;
                    inset: auto 0 0 auto;
                    cursor: nwse-resize;
                    opacity: .3;
                    z-index: 10;
                    background: linear-gradient(
                        135deg,
                        transparent 40%, currentColor 41%, currentColor 49%,
                        transparent 50%, transparent 60%,
                        currentColor 61%, currentColor 69%, transparent 70%
                    );
                    transition: opacity 120ms ease;
                }
                .resize:hover { opacity: .55; }
                :host(.is-maximized) .resize { display: none; }
            </style>
            <div class="frame">
                <div class="bar" data-drag-handle>
                    <span class="title" data-title></span>
                    <span class="pid" data-pid></span>
                    <span class="btns">
                        <button type="button" data-window-action="popout" title="Open in new tab">&#8599;</button>
                        <button type="button" data-window-action="minimize" title="Minimize">&minus;</button>
                        <button type="button" data-window-action="maximize" title="Maximize">&#9633;</button>
                        <button type="button" data-window-action="close" title="Close">&#10005;</button>
                    </span>
                </div>
                <div class="content">
                    <slot name="window-view"></slot>
                </div>
            </div>
            <span class="resize" data-resize-handle></span>
        `;

        this.titleEl = root.querySelector("[data-title]");
        this.pidEl = root.querySelector("[data-pid]");
        this.dragHandle = root.querySelector("[data-drag-handle]");
        this.resizeHandle = root.querySelector("[data-resize-handle]");

        root.querySelectorAll("[data-window-action]").forEach((button) => {
            button.addEventListener("click", (event) => {
                const action = (event.currentTarget as HTMLElement).dataset.windowAction || "";
                this.dispatchEvent(new CustomEvent("window-action", { detail: { action }, bubbles: true }));
            });
        });

        this.setTitle(this.getAttribute("data-title") || this.getAttribute("title") || "Window");
        this.setPidLabel(this.getAttribute("data-pid") || "");
    }

    setTitle(title: string): void {
        if (this.titleEl) this.titleEl.textContent = title;
    }

    setPidLabel(pid: string): void {
        if (this.pidEl) this.pidEl.textContent = pid ? `#${pid}` : "";
    }

    getDragHandle(): HTMLElement | null {
        return this.dragHandle;
    }

    getResizeHandle(): HTMLElement | null {
        return this.resizeHandle;
    }
}

const ensureDefined = (tagName: string, ctor: CustomElementConstructor): void => {
    if (typeof customElements === "undefined") return;
    if (!customElements?.get?.(tagName)) {
        customElements?.define?.(tagName, ctor);
    }
};

export type ShellElement = ShellHostElement | MinimalShellHostElement | WindowShellHostElement;

export type WindowFrameElement = WindowFrameHostElement;

export const getViewElementTagName = (viewId: string): string =>
    `${VIEW_TAG_PREFIX}${normalizeToken(viewId, "viewer")}`;

export const ensureViewElementDefined = (viewId: string): string => {
    const tagName = getViewElementTagName(viewId);
    ensureDefined(tagName, ViewHostElement);
    return tagName;
};

export const ensureShellElementDefined = (shellId: string): string => {
    const token = normalizeToken(shellId, "minimal");
    const tagName = `${SHELL_TAG_PREFIX}${token}`;
    /** Views must be light-DOM children with `slot="view"` so document-level `views.scss` applies; same for base and minimal. */
    const useSlottedHost = token === "minimal" || token === "base";
    /** Windowing shells need `slot="window-frame"` for process frame projection. */
    const isWindowingShell = token === "window" || token === "environment" || token === "tabbed";
    const ctor = useSlottedHost
        ? MinimalShellHostElement
        : isWindowingShell
            ? WindowShellHostElement
            : ShellHostElement;
    ensureDefined(tagName, ctor);
    return tagName;
};

export const ensureWindowFrameElementDefined = (): string => {
    ensureDefined(WINDOW_FRAME_TAG, WindowFrameHostElement);
    return WINDOW_FRAME_TAG;
};

// @ts-ignore
@defineElement("cw-base-element")
export class BaseElement extends GLitElement<HTMLElement>(HTMLElement) implements HTMLElement {
    @property({ source: "attr" }) theme: string = "default";

    //
    render = function () { return H`<slot></slot>`; }

    //
    constructor(options: any = {}) { super(options); }

    //
    onRender(): this|void|undefined {
        return super.onRender();
    }

    //
    connectedCallback(): this {
        const result = super.connectedCallback?.();
        const self : any = result ?? this;
        return self;
    }

    //
    onInitialize(): this {
        const result = super.onInitialize();
        // Only load icon styles, not the heavy veela runtime styles
        // which cause freezing/hanging performance issues
        const self : any = result ?? this;
        self.loadStyleLibrary(ensureStyleSheet());
        return self;
    }
}

//
export default BaseElement;

/** Alias for legacy / app imports: `@fl-ui/base/UIElement` */
export { BaseElement as UIElement };

ensureWindowFrameElementDefined();
