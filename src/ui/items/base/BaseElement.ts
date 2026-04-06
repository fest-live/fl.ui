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
 */
export const createWebComponentViewAdapter = <T extends View>(view: T): T => {
    return {
        ...view,
        render: (options?: ViewOptions) => view.render(options),
    } as T;
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

export class WindowFrameHostElement extends GLitElement(HTMLElement) {
    private titleEl: HTMLElement | null = null;
    private pidEl: HTMLElement | null = null;
    private dragHandle: HTMLElement | null = null;
    private resizeHandle: HTMLElement | null = null;

    connectedCallback(): this {
        if (this.shadowRoot) return;
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = `
            <style>
                :host { display:block; position:absolute; min-width:320px; min-height:220px; }
                .frame { display:flex; flex-direction:column; block-size:100%; min-block-size:220px; border:1px solid rgba(120,140,180,.35); border-radius:12px; background:rgba(12,14,20,.92); color:#eef4ff; overflow:hidden; }
                .bar { display:flex; align-items:center; gap:.35rem; min-block-size:34px; padding:.25rem .5rem; background:rgba(28,32,44,.95); user-select:none; }
                .title { flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.85rem; }
                .pid { font-size:.72rem; opacity:.68; }
                .btns { display:flex; gap:.25rem; }
                button { border:0; border-radius:8px; padding:.2rem .45rem; background:rgba(255,255,255,.09); color:inherit; cursor:pointer; }
                .content { position:relative; flex:1 1 auto; min-block-size:0; }
                .resize { position:absolute; inline-size:12px; block-size:12px; inset:auto 0 0 auto; cursor:nwse-resize; }
            </style>
            <div class="frame">
                <div class="bar" data-drag-handle>
                    <span class="title" data-title></span>
                    <span class="pid" data-pid></span>
                    <span class="btns">
                        <button type="button" data-window-action="minimize">_</button>
                        <button type="button" data-window-action="maximize">[]</button>
                        <button type="button" data-window-action="close">x</button>
                    </span>
                </div>
                <div class="content">
                    <slot name="window-view"></slot>
                    <span class="resize" data-resize-handle></span>
                </div>
            </div>
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
    if (!customElements.get(tagName)) {
        customElements.define(tagName, ctor);
    }
};

export type ShellElement = ShellHostElement | MinimalShellHostElement;

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
    ensureDefined(tagName, useSlottedHost ? MinimalShellHostElement : ShellHostElement);
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
