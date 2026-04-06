import { H, defineElement, property, getDir, valueLink } from "fest/lure";
import { addEvent } from "fest/dom";
import { affected, propRef } from "fest/object";
import { ensureStyleSheet, reinitializeRegistry } from "fest/icon";
import "fest/icon";

//
import UIElement from "@fl-ui/base/UIElement";

//
import FileManagerContent from "./FileManagerContent";

const fmCss = `
    :host {
        --fm-bg: #0b1320;
        --fm-bg-elev: #101b2c;
        --fm-surface: rgba(20, 31, 50, 0.9);
        --fm-surface-hover: rgba(133, 174, 255, 0.12);
        --fm-border: rgba(138, 172, 248, 0.2);
        --fm-text: #dbe8ff;
        --fm-muted: #91a9cf;
        --fm-accent: #89b0ff;
        --fm-focus: rgba(137, 176, 255, 0.55);
        display: block;
        inline-size: 100%;
        block-size: 100%;
        min-inline-size: 0;
        min-block-size: 0;
        box-sizing: border-box;
        overflow: hidden;
        background: var(--fm-bg);
        color: var(--fm-text);
        border-radius: 12px;
    }

    .fm-root {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        inline-size: 100%;
        block-size: 100%;
        min-inline-size: 0;
        min-block-size: 0;
        box-sizing: border-box;
        border: 1px solid var(--fm-border);
        border-radius: inherit;
        overflow: hidden;
        background: linear-gradient(180deg, rgba(12, 21, 35, 0.96) 0%, rgba(8, 14, 24, 0.96) 100%);
    }

    .fm-toolbar {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr) max-content;
        align-items: center;
        gap: 0.45rem;
        padding: 0.4rem 0.5rem;
        border-block-end: 1px solid var(--fm-border);
        background: color-mix(in oklab, var(--fm-bg-elev) 86%, black 14%);
    }

    .fm-toolbar-left,
    .fm-toolbar-right {
        display: inline-flex;
        gap: 0.2rem;
        align-items: center;
    }

    .fm-toolbar-center {
        min-inline-size: 0;
    }

    .fm-toolbar .address {
        inline-size: 100%;
        min-inline-size: 0;
        border: 1px solid var(--fm-border);
        border-radius: 8px;
        padding: 0.4rem 0.55rem;
        background: rgba(7, 12, 20, 0.72);
        color: var(--fm-text);
        outline: none;
        font-size: 0.8rem;
        line-height: 1.2;
    }

    .fm-toolbar .address::placeholder {
        color: var(--fm-muted);
    }

    .fm-toolbar .address:focus-visible {
        border-color: var(--fm-accent);
        box-shadow: 0 0 0 2px var(--fm-focus);
    }

    .fm-toolbar .btn {
        border: 0;
        border-radius: 8px;
        padding: 0.35rem 0.4rem;
        background: rgba(137, 176, 255, 0.08);
        color: var(--fm-text);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.14s ease, color 0.14s ease, transform 0.14s ease;
    }

    .fm-toolbar .btn:hover {
        background: var(--fm-surface-hover);
        color: white;
    }

    .fm-toolbar .btn:active {
        transform: translateY(0.5px);
    }

    .fm-toolbar .btn:focus-visible {
        outline: 0;
        box-shadow: 0 0 0 2px var(--fm-focus);
    }

    .fm-toolbar .btn ui-icon {
        --icon-size: 1rem;
    }

    .fm-content {
        min-inline-size: 0;
        min-block-size: 0;
        overflow: hidden;
        background: rgba(8, 14, 24, 0.94);
    }
`;

let fileManagerIconRuntimeReady = false;
const ensureFileManagerIconRuntime = (): void => {
    if (fileManagerIconRuntimeReady) return;
    try {
        ensureStyleSheet();
        reinitializeRegistry();
        fileManagerIconRuntimeReady = true;
    } catch (error) {
        console.warn("[FileManager] Failed to initialize icon runtime:", error);
    }
};

// @ts-ignore
@defineElement("ui-file-manager")
export class FileManager extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    // explicit sidebar control; if not provided, auto by container size
    @property({ source: "attr", name: "sidebar" }) sidebar?: any = "auto";

    // container inline size for CQ-based decisions
    @property({ source: "inline-size" }) inlineSize?: number;

    // refs/state
    styles = () => fmCss as any;
    #pathWatcherDisposer: (() => void) | null = null;
    constructor() { super(); ensureFileManagerIconRuntime(); }

    //
    get content() { return (this as any)?.querySelector?.("ui-file-manager-content") as any; }
    get operative() { return this.content?.operativeInstance; }
    get pathRef() { return this.operative?.pathRef; }
    get path() { return this.content?.path || this.operative?.path || "/"; }
    set path(value: string) {
        if (this.content) this.content.path = value || "/";
        if (this.operative) this.operative.path = value || "/";
    }

    //
    get input() { return this?.shadowRoot?.querySelector?.("input[name=\"address\"]") as HTMLInputElement | null; }
    get inputValue() { return this.input?.value || "/"; }
    set inputValue(value: string) {
        if (this.input) this.input.value = value || "/";
    }

    //
    onInitialize(): this {
        ensureFileManagerIconRuntime();
        const result = super.onInitialize();
        const self: any = result ?? this;
        self.removeAttribute?.("hidden");
        if (self.style) self.style.display = "block";

        //
        const existingContents = Array.from(self.querySelectorAll("ui-file-manager-content")) as HTMLElement[];
        const primaryContent = existingContents[0] ?? document.createElement("ui-file-manager-content");
        (primaryContent as HTMLElement)?.removeAttribute?.("hidden");
        if (!existingContents.length) {
            self.append(primaryContent);
        }
        if (existingContents.length > 1) {
            for (const extra of existingContents.slice(1)) {
                extra.remove();
            }
        }

        //
        queueMicrotask(() => {
            this.#pathWatcherDisposer?.();
            this.#pathWatcherDisposer = null;
            if (!this.pathRef) return;
            this.#pathWatcherDisposer = affected(this.pathRef, (path) => {
                const input = this?.shadowRoot?.querySelector?.("input[name=\"address\"]");
                if (input && input instanceof HTMLInputElement && input.value != path) {
                    input.value = path || "/";
                }
            });
        });

        //
        return self as this;
    }

    //
    onRender(): this|void|undefined {
        super.onRender();

        // handle address field submit
        const weak: any = new WeakRef(this);
        const onEnter = (ev: KeyboardEvent) => {
            if (ev.key === "Enter") {
                const self = weak.deref() as any;
                const input = self?.querySelector?.("input[name=\"address\"]");
                const val = (input as HTMLInputElement)?.value?.trim?.() || "";
                if (val) self?.navigate(val);
            }
        };
        addEvent(this, "keydown", onEnter);
    }

    //
    get showSidebar(): boolean {
        const force = String(this.sidebar ?? "auto").toLowerCase();
        if (force === "true" || force === "1") return true;
        if (force === "false" || force === "0") return false;
        const width = propRef(this as any, "inlineSize")?.value ?? this.inlineSize ?? 0;
        return width >= 720; // container-query based threshold
    }

    //
    async navigate(toPath: string) {
        const clean = getDir(toPath);
        this.path = clean || this.path || "/";
        const input = this?.shadowRoot?.querySelector?.("input[name=\"address\"]");
        if (input && input instanceof HTMLInputElement && input.value != this.path) { input.value = this.path || "/"; };
    }

    //
    async goUp() {
        const currentPath = this.path || this.content?.path || "/";
        const parts = currentPath
            .replace(/\/+$/g, "")
            .split("/")
            .filter(Boolean);
        console.log("parts", parts, this.path, this.content?.path);
        if (parts.length <= 1) {
            this.navigate(this.path = "/");
            return;
        }
        const up = "/" + parts.slice(0, -1).join("/") + "/";
        const clean = getDir(up);
        this.navigate(this.path = clean || "/");
    }

    //
    requestUpload() { this.operative?.requestUpload?.(); }
    requestPaste() { this.operative?.requestPaste?.(); }
    requestUse() { this.operative?.requestUse?.(); }

    //
    render = function() {
        const self: any = this;
        const sidebarVisible = self.showSidebar;

        //
        const content = H`<div part="content" class="fm-content"><slot></slot></div>`
        const toolbar = H`<div part="toolbar" class="fm-toolbar">
            <div class="fm-toolbar-left">
                <button class="btn" title="Up" on:click=${() => self.goUp()}><ui-icon icon="arrow-up"/></button>
                <button class="btn" title="Refresh" on:click=${() => self.navigate(self.inputValue || self.path || "/")}><ui-icon icon="arrow-clockwise"/></button>
            </div>
            <div class="fm-toolbar-center"><form style="display: contents;" onsubmit="return false;">
                <input class="address c2-surface" autocomplete="off" type="text" name="address" value=${self.path || "/"} />
            </form></div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => self.requestUpload?.()}><ui-icon icon="upload"/></button>
                <button class="btn" title="Paste" on:click=${() => self.requestPaste?.()}><ui-icon icon="clipboard"/></button>
                <button class="btn" title="Use" on:click=${() => self.requestUse?.()}><ui-icon icon="hand-withdraw"/></button>
            </div>
        </div>`

        //
        return H`<div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>${toolbar}${content}</div>`;
    }
}

//
export default FileManager;
export { FileManagerContent };
