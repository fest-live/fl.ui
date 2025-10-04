import { H, defineElement, property, M, Q, E, ctxMenuTrigger } from "fest/lure";
import { link, makeReactive, ref, subscribe } from "fest/object";
import { preloadStyle, addEvent } from "fest/dom";

import FileManagerContent from "./FileManagerContent";

// OPFS helpers
import { getDir } from "fest/lure";

import UIElement from "@fl-design/base/UIElement";

// @ts-ignore
import fmCss from "./FileManager.scss?inline";
const styled = preloadStyle(fmCss);

//
type EntryKind = "file" | "directory";
interface FileEntryItem {
    name: string;
    kind: EntryKind;
    type?: string;
    size?: number;
    lastModified?: number;
    handle?: any;
}

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
    #loading = ref(false);
    #error = ref("");
    #fsRoot: any = null;
    #dirProxy: any = null;
    #loadLock = false;

    styles = () => styled?.cloneNode?.(true);
    pathRef = ref("/user/");

    //
    get path() { return this.pathRef.value; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value; }

    constructor() { super(); }

    //
    itemAction(item: FileEntryItem) {
        const self: any = this;
        if (item?.kind === "directory") {
            const next = (self.path?.endsWith?.("/") ? self.path : self.path + "/") + item?.name + "/";
            self.path = next;
        } else {
            const detail = { path: (self.path || "/user/") + item?.name, item };
            self.path = detail.path;
            self.dispatchEvent?.(new CustomEvent("open", { detail, bubbles: true, composed: true }));
        }
    }

    //
    onInitialize() {
        super.onInitialize();
        // initialize OPFS root
        Promise.try(async () => {
            // @ts-ignore
            this.#fsRoot = await navigator?.storage?.getDirectory?.();
            this.path = "/user/";
        });

        //
        const weak: any = new WeakRef(this);
        requestAnimationFrame(()=>{
            const self = weak?.deref?.();
            const frame: any = document.createElement("ui-scrollframe");
            frame.style.zIndex = 99;

            //
            const rows = Q(".fm-grid-container", self?.shadowRoot), grid = Q(".fm-grid", self?.shadowRoot);
            frame.bindWith(rows, rows);
            //grid?.append(frame);
        });

        //
        const self: any = this;
        self.pathRef ??= ref("/user/");
        subscribe(this.pathRef, (path) => {
            this.navigate(path);
        });

        //
        const contents: any = document.createElement("ui-file-manager-content");
        contents.itemAction = this.itemAction;
        link(this.pathRef, contents.pathRef);
        requestAnimationFrame(() => self.append(contents));
    }

    //
    manuallyRenderFileList(entries: FileEntryItem[]) {
        /*const rows = entries?.map?.((item: FileEntryItem) => {
            return H`<div class="row c2-surface" on:click=${(ev: MouseEvent) => self.onRowClick?.(item, ev)} on:dblclick=${(ev: MouseEvent) => self.onRowDblClick?.(item, ev)}>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden;" class="c icon">${H`<ui-icon icon=${iconFor(item)} />`}</div>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; inline-size: stretch;" class="c name" title=${item?.name}>${item?.name}</div>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden;" class="c size">${item?.size != null ? getSize(item?.size) : ""}</div>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden;" class="c date">${item?.lastModified ? new Date(item?.lastModified).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : ""}</div>
            </div>`;
        });
        const self: any = this;
        self.innerHTML = "";
        self?.append?.(...rows);
        return rows;*/
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
        if (!clean?.startsWith?.("/user")) {
            // only allow OPFS /user; optional host stub
            this.#error.value = "Only /user partition is supported";
            return;
        }

        console.log((this as any)?.querySelector?.("ui-file-manager-content"));
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
        const loading = this.#loading;
        const error = this.#error;
        const sidebarVisible = this.showSidebar;

        //
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
        const status = H`
        ${loading?.value ? H`<div class="status">Loading…</div>` : null}
        ${error?.value ? H`<div class="status error">${error.value}</div>` : null}
        `

        //
        const content = H`<div part="content" class="fm-content">
            ${status}
            <slot></slot>
        </div>`

        // ${content}
        const root = H`
            <div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>
                ${toolbar}
                ${content}
            </div>
        `;
        // bind drop and paste handlers after first render

        return root;
    }
}

//
export default FileManager;

//
export { FileManagerContent };
