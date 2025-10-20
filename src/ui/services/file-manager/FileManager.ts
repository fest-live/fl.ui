import { H, defineElement, property, getDir, Q } from "fest/lure";
import { link, ref, subscribe } from "fest/object";
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
    pathRef = ref("/user/");

    //
    get path() { return this.pathRef.value; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value; }

    //
    constructor() { super(); }

    //
    onInitialize() {
        super.onInitialize();

        //
        const weak: any = new WeakRef(this);
        requestAnimationFrame(()=>{
            const self = weak?.deref?.();
            //const frame: any = document.createElement("ui-scrollframe");
            //frame.style.zIndex = 99;

            //
            //const rows = Q(".fm-grid-container", self?.shadowRoot), grid = Q(".fm-grid", self?.shadowRoot);
            //frame.bindWith(rows, rows);
            //grid?.append(frame);
        });

        //
        const self: any = this;
        self.pathRef ??= ref("/user/");
        subscribe(this.pathRef, (path) => this.navigate(path));

        //
        const contents: any = document.createElement("ui-file-manager-content");
        link(this.pathRef, contents.pathRef);
        requestAnimationFrame(() => self.append(contents));
    }

    //
    onRender() {
        super.onRender();
        // handle address field submit
        const weak: any = new WeakRef(this);
        const onEnter = (ev: KeyboardEvent) => {
            if (ev.key === "Enter") {
                const self = weak.deref() as any;
                const input = Q('ui-longtext input', self?.shadowRoot ?? self);
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
        await (this as any)?.querySelector?.("ui-file-manager-content")?.loadPath?.(toPath);
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
                <ui-longtext class="address c2-surface" style="background-color: --c2-surface(0.04, var(--current, transparent)); inline-size: stretch; border: none 0px transparent; outline: none 0px transparent;" name="address">
                    <input autocomplete="off" type="text" value=${this.pathRef} name="address" />
                </ui-longtext>
            </div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => this.requestUpload?.()}><ui-icon icon="upload"/></button>
                <button class="btn" title="Paste" on:click=${() => this.requestPaste?.()}><ui-icon icon="clipboard"/></button>
                <button class="btn" title="Use" on:click=${() => this.requestUse?.()}><ui-icon icon="hand-withdraw"/></button>
            </div>
        </div>`

        //
        return H`<div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>${toolbar}${content}</div>`;
    }
}

//
export default FileManager;
export { FileManagerContent };
