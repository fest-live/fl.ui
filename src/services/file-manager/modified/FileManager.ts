import { H, defineElement, property, getDir, valueLink } from "fest/lure";
import { addEvent, preloadStyle } from "fest/dom";

//
import FileManagerContent from "./FileManagerContent";

//
import UIElement from "./UIElement";

// @ts-ignore
import fmCss from "./FileManager.scss?inline";
import { propRef } from "fest/object";

//
const styled = preloadStyle(fmCss);

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
    styles = () => styled;
    constructor() { super(); }

    //
    get pathRef() { return ((this as any)?.querySelector?.("ui-file-manager-content") as any)?.pathRef; }
    get path() { return ((this as any)?.querySelector?.("ui-file-manager-content") as any)?.pathRef?.value ?? "/user/"; }
    set path(value: string) {
        const content = (this as any)?.querySelector?.("ui-file-manager-content");
        if (content) (content as any).pathRef.value = value;
    }

    //
    onInitialize() {
        super.onInitialize();

        //
        const self: any = this;
        const contents: any = document.createElement("ui-file-manager-content");
        self.append(contents);
    }

    //
    onRender() {
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
        (this as any).path = clean || (this as any).path;
    }

    //
    async goUp() {
        const contents = (this as any)?.querySelector?.("ui-file-manager-content");
        const parts = (contents?.path || "/user/")
            .replace(/\/+$/g, "")
            .split("/")
            .filter(Boolean);
        if (parts.length <= 1) return; // stay at /user
        const up = "/" + parts.slice(0, -1).join("/") + "/";
        this.path = up;
    }

    //
    get content() { return (this as any)?.querySelector?.("ui-file-manager-content") as any; }
    get operative() { return this.content?.operativeInstance; }

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
                <button class="btn" title="Up" on:click=${() => requestAnimationFrame(() => self.goUp())}><ui-icon icon="arrow-up"/></button>
                <button class="btn" title="Refresh" on:click=${() => requestAnimationFrame(() => self.navigate(self.path))}><ui-icon icon="arrow-clockwise"/></button>
            </div>
            <div class="fm-toolbar-center">
                <input class="address c2-surface" autocomplete="off" type="text" name="address" />
            </div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => requestAnimationFrame(() => self.requestUpload?.())}><ui-icon icon="upload"/></button>
                <button class="btn" title="Paste" on:click=${() => requestAnimationFrame(() => self.requestPaste?.())}><ui-icon icon="clipboard"/></button>
                <button class="btn" title="Use" on:click=${() => requestAnimationFrame(() => self.requestUse?.())}><ui-icon icon="hand-withdraw"/></button>
            </div>
        </div>`

        //
        const input = toolbar.querySelector("input");
        if (input) {
            queueMicrotask(() => {
                input.value = self.path;
                valueLink(input, self.pathRef);
            });
        }

        //
        return H`<div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>${toolbar}${content}</div>`;
    }
}

//
export default FileManager;
export { FileManagerContent };
