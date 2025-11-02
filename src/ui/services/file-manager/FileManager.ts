import { H, defineElement, property, getDir, valueLink } from "fest/lure";
import { addEvent, preloadStyle } from "fest/dom";

//
import FileManagerContent from "./FileManagerContent";

//
import UIElement from "@fl-design/base/UIElement";

// @ts-ignore
import fmCss from "./FileManager.scss?inline";

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
    styles = () => styled?.cloneNode?.(true);
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
        const width = (this as any).getProperty?.("inlineSize")?.value ?? this.inlineSize ?? 0;
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
    render = function() {
        const sidebarVisible = this.showSidebar;

        //
        const content = H`<div part="content" class="fm-content"><slot></slot></div>`
        const toolbar = H`<div part="toolbar" class="fm-toolbar">
            <div class="fm-toolbar-left">
                <button class="btn" title="Up" on:click=${() => this.goUp()}><ui-icon icon="arrow-up"/></button>
                <button class="btn" title="Refresh" on:click=${() => this.navigate(this.path)}><ui-icon icon="arrow-clockwise"/></button>
            </div>
            <div class="fm-toolbar-center">
                <input class="address c2-surface" autocomplete="off" type="text" name="address" />
            </div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => this.requestUpload?.()}><ui-icon icon="upload"/></button>
                <button class="btn" title="Paste" on:click=${() => this.requestPaste?.()}><ui-icon icon="clipboard"/></button>
                <button class="btn" title="Use" on:click=${() => this.requestUse?.()}><ui-icon icon="hand-withdraw"/></button>
            </div>
        </div>`

        //
        const input = toolbar.querySelector("input");
        if (input) {
            requestAnimationFrame(() => {
                input.value = this.path;
                valueLink(input, this.pathRef);
            });
        }

        //
        return H`<div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>${toolbar}${content}</div>`;
    }
}

//
export default FileManager;
export { FileManagerContent };
