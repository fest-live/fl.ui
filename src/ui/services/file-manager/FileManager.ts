import { H, defineElement, property, M, Q, E } from "fest/lure";
import { makeReactive, ref } from "fest/object";
import { addEvent, preloadStyle } from "fest/dom";

// OPFS helpers
import {
    openDirectory,
    getDir,
    getMimeTypeByFilename,
    downloadFile
} from "fest/lure";

import UIElement from "@design/base/UIElement";

// @ts-ignore
import fmCss from "./FileManager.scss?inline";
const styled = preloadStyle(fmCss);

type EntryKind = "file" | "directory";
interface FileEntryItem {
    name: string;
    kind: EntryKind;
    type?: string;
    size?: number;
    lastModified?: number;
    handle?: any;
}

const iconByMime = (mime: string | undefined, def = "file") => {
    if (!mime) return def;
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "music";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "file-text";
    if (mime.includes("zip") || mime.includes("7z") || mime.includes("rar")) return "file-archive";
    if (mime.includes("json")) return "brackets";
    if (mime.includes("csv")) return "file-spreadsheet";
    if (mime.includes("xml")) return "code";
    if (mime.startsWith("text/")) return "file-text";
    return def;
};

//
const iconFor = (item: FileEntryItem) => item?.kind === "directory" ? "folder" : iconByMime(item?.type);

// @ts-ignore
@defineElement("ui-file-manager")
export class FileManager extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    // path to show; starts from /user
    @property({ source: "attr", name: "path" }) path = "/user/";

    // explicit sidebar control; if not provided, auto by container size
    @property({ source: "attr", name: "sidebar" }) sidebar?: any = "auto";

    // container inline size for CQ-based decisions
    @property({ source: "inline-size" }) inlineSize?: number;

    // refs/state
    #entries = makeReactive<FileEntryItem[]>([]);
    #loading = ref(false);
    #error = ref("");
    #fsRoot: any = null;
    #dirProxy: any = null;

    styles = () => styled?.cloneNode?.(true);

    constructor() { super(); }

    //
    onInitialize() {
        super.onInitialize();
        // initialize OPFS root
        Promise.try(async () => {
            // @ts-ignore
            this.#fsRoot = await navigator?.storage?.getDirectory?.();
            this.navigate(this.path || "/user/");
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
            grid?.append(frame);
        });
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

        //
        const self: any = this;
        return E(self, {}, M(this.#entries, (item: FileEntryItem) => {
            return H`<div class="row c2-surface" on:click=${(ev: MouseEvent) => self.onRowClick?.(item, ev)} on:dblclick=${(ev: MouseEvent) => self.onRowDblClick?.(item, ev)}>
                <div style="text-overflow: ellipsis; overflow: hidden;" class="c icon">${H`<ui-icon icon=${iconFor(item)} />`}</div>
                <div style="text-overflow: ellipsis; overflow: hidden; inline-size: stretch;" class="c name" title=${item?.name}>${item?.name}</div>
                <div style="text-overflow: ellipsis; overflow: hidden;" class="c type">${item?.kind === "directory" ? "directory" : (item?.type || "")}</div>
                <div style="text-overflow: ellipsis; overflow: hidden;" class="c size">${item?.size != null ? (item?.size as number).toLocaleString() : ""}</div>
                <div style="text-overflow: ellipsis; overflow: hidden;" class="c date">${item?.lastModified ? new Date(item?.lastModified).toLocaleString() : ""}</div>
            </div>`;
        }));
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

        this.path = clean || this.path;
        await this.loadPath(this.path);
    }

    //
    async goUp() {
        const parts = (this.path || "/user/")
            .replace(/\/+$/g, "")
            .split("/")
            .filter(Boolean);
        if (parts.length <= 1) return; // stay at /user
        const up = "/" + parts.slice(0, -1).join("/") + "/";
        return this.navigate(up);
    }

    //
    async loadPath(path: string) {
        const self: any = this;
        this.#entries.splice(0, this.#entries.length);
        try {
            this.#loading.value = true;
            this.#error.value = "";
            const rel = path; // openDirectory can consume absolute-like parts (it filters Booleans)
            this.#dirProxy = openDirectory(this.#fsRoot, rel, { create: false });
            //const map = await this.#dirProxy?.getMap?.();
            const items: FileEntryItem[] = [];
            await this.#dirProxy;
            for (const [name, $handle] of (await this.#dirProxy?.entries?.() ?? [])) {
                const handle = await $handle;
                const kind: EntryKind = handle?.kind || (name?.endsWith?.("/") ? "directory" : "file");
                let type: string | undefined;
                let size: number | undefined;
                let lastModified: number | undefined;
                if (kind === "file") {
                    type = getMimeTypeByFilename?.(name);
                    try {
                        const f = await handle?.getFile?.();
                        size = f?.size;
                        lastModified = f?.lastModified;
                        type = f?.type || type;
                    } catch {}
                }

                //items.push({ name, kind, type, size, lastModified, handle });
                //this.#entries.push({ name, kind, type, size, lastModified, handle });
                const item = { name, kind, type, size, lastModified, handle };
                const up = { onRowClick: () => self.onRowClick(item), onRowDblClick: () => self.onRowDblClick(item) };
                this.#entries.push(item);
            }
            // sort: directories first, then files by name
            //items.sort((a, b) => (a?.kind === b?.kind ? a?.name?.localeCompare?.(b?.name) : (a?.kind === "directory" ? -1 : 1)));
            //this.#entries.splice(0, this.#entries.length, ...items);
        } catch (e: any) {
            this.#error.value = e?.message || String(e || "");
        } finally {
            this.#loading.value = false;
        }
    }

    //
    private onRowClick = (item: FileEntryItem, ev: MouseEvent) => {
        ev.preventDefault();
        if (item?.kind === "directory") {
            const next = (this.path?.endsWith?.("/") ? this.path : this.path + "/") + item?.name + "/";
            this.navigate(next);
        } else {
            const detail = { path: (this.path || "/user/") + item?.name, item };
            (this as any).dispatchEvent?.(new CustomEvent("open", { detail, bubbles: true, composed: true }));
        }
    };

    //
    private onRowDblClick = (item: FileEntryItem, ev: MouseEvent) => {
        ev.preventDefault();
        if (item?.kind === "file") {
            // attempt to download the file
            Promise.try(async () => {
                const fh = await this.#dirProxy?.getFileHandle?.(item?.name, { create: false });
                const file = await fh?.getFile?.();
                if (file) await downloadFile(file);
            }).catch(console.warn);
        }
    };

    //
    render = function() {
        const entries = this.#entries;
        const loading = this.#loading;
        const error = this.#error;
        const sidebarVisible = this.showSidebar;

        //
        return H`
            <div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>
                <div part="toolbar" class="fm-toolbar">
                    <button class="btn" title="Up" on:click=${() => this.goUp()}><ui-icon icon="arrow-up"/></button>
                    <button class="btn" title="Refresh" on:click=${() => this.loadPath(this.path)}><ui-icon icon="arrow-clockwise"/></button>
                    <ui-longtext class="address c2-surface" style="background-color: --c2-surface(0.04, var(--current, transparent)); inline-size: stretch; border: none 0px transparent; outline: none 0px transparent;" name="address">
                        <input type="text" value=${this.path} name="address" />
                    </ui-longtext>
                </div>

                ${H`<aside visible=${sidebarVisible} part="sidebar" class="fm-sidebar">
                    <div class="sec">
                        <div class="sec-title">Places</div>
                        <button class="link" on:click=${() => this.navigate("/user/")}>/user</button>
                        <button class="link" on:click=${() => this.navigate("/user/temp/")}>/user/temp</button>
                        <button class="link" on:click=${() => this.navigate("/user/pictures/")}>/user/pictures</button>
                    </div>
                </aside>`}

                <div part="content" class="fm-content">
                    ${loading?.value ? H`<div class="status">Loading…</div>` : null}
                    ${error?.value ? H`<div class="status error">${error.value}</div>` : null}
                    <div class="fm-grid-container">
                        <div class="fm-grid" part="grid">
                            <div class="fm-grid-header">
                                <div class="c icon" style="overflow: hidden;"></div>
                                <div class="c name" style="overflow: hidden; inline-size: stretch;">Name</div>
                                <div class="c type" style="overflow: hidden;">Type</div>
                                <div class="c size" style="overflow: hidden;">Size</div>
                                <div class="c date" style="overflow: hidden;">Modified</div>
                            </div>
                            <div class="fm-grid-rows"><slot></slot></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

//
export default FileManager;
