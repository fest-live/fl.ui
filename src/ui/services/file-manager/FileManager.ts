import { H, defineElement, property, M, Q, E, ctxMenuTrigger } from "fest/lure";
import { makeReactive, ref } from "fest/object";
import { preloadStyle, addEvent } from "fest/dom";

// OPFS helpers
import {
    openDirectory,
    getDir,
    getMimeTypeByFilename,
    downloadFile,
    writeFile,
    remove,
    uploadFile,
    getFileHandle,
    getDirectoryHandle,
    copyFromOneHandlerToAnother,
    attachFile,
    provide
} from "fest/lure";

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

//
const iconByMime = (mime: string | undefined, def = "file") => {
    if (!mime) return def;
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "music";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "file-text";
    if (mime.includes("zip") || mime.includes("7z") || mime.includes("rar")) return "file-archive";
    if (mime.includes("json")) return "brackets-curly";
    if (mime.includes("csv")) return "file-spreadsheet";
    if (mime.includes("xml")) return "code";
    if (mime.startsWith("text/")) return "file-text";
    return def;
};

//
const iconFor = (item: FileEntryItem) => item?.kind === "directory" ? "folder" : iconByMime(item?.type);

//
const getSize = (size: number) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " kB";
    if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(2) + " MB";
    return (size / 1024 / 1024 / 1024).toFixed(2) + " GB";
};

//
const makeFileActionOps = (fileManager: FileManager, item: FileEntryItem | null) => {
    return [
        { id: "open", label: "Open", icon: "function", disabled: item?.kind === "directory" || !item },
        { id: "download", label: "Download", icon: "download" }
    ];
};

//
const makeFileSystemOps = (fileManager: FileManager, item: FileEntryItem | null) => {
    return [
        { id: "delete", label: "Delete", icon: "trash", disabled: item?.kind === "directory" || !item },
        { id: "rename", label: "Rename", icon: "pencil", disabled: item?.kind === "directory" || !item },
        { id: "copy", label: "Copy", icon: "copy" },
        { id: "move", label: "Move", icon: "hand-withdraw", disabled: item?.kind === "directory" || !item }
    ];
};

//
const disconnectRegistry = new FinalizationRegistry((ctxMenu: HTMLElement) => {
    // utilize redundant ctx menu from DOM
    //ctxMenu?.remove?.();
});

let hasContextMenu = null;
const makeContextMenu = () => {
    if (hasContextMenu) return hasContextMenu;
    const ctxMenu = H`<ul class="grid-rows c2-surface round-decor ctx-menu ux-anchor"></ul>`;
    hasContextMenu = ctxMenu;
    document.body.append(ctxMenu);
    return ctxMenu;
}

//
const createItemCtxMenu = async (fileManager: FileManager, item: FileEntryItem | null) => {
    if (!item) return;

    //
    const ctxMenuDesc = {
        openedWith: null,
        items: [
            makeFileActionOps(fileManager, item),
            makeFileSystemOps(fileManager, item),
        ],
        defaultAction: (initiator: HTMLElement, menuItem: any, ev: MouseEvent) => {
            (fileManager as any).onMenuAction?.(item, menuItem?.id, ev);
        }
    };

    //
    const initiatorElement = Q(`.row[data-id="${item?.name}"]`, fileManager as any);

    //
    const ctxMenu = makeContextMenu();
    ctxMenuTrigger(initiatorElement as any, ctxMenuDesc, ctxMenu);
    disconnectRegistry.register(item, ctxMenu);
    return ctxMenu;
}



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
    #clipboard: { items: string[]; cut?: boolean } | null = null;

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

        //
        const self: any = this;
        self.manuallyRenderFileList(this.#entries);

        //
        return E(self, {}, M(this.#entries, (item: FileEntryItem) => {
            const itemEl = H`<div draggable="${item?.kind === "file"}" data-id=${item?.name} class="row c2-surface" on:click=${(ev: MouseEvent) => self.onRowClick?.(item, ev)} on:dblclick=${(ev: MouseEvent) => self.onRowDblClick?.(item, ev)} on:dragstart=${(ev: DragEvent) => self.onRowDragStart?.(item, ev)}>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c icon">${H`<ui-icon icon=${iconFor(item)} />`}</div>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none; inline-size: stretch;" class="c name" title=${item?.name}>${item?.name}</div>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c size">${item?.size != null ? getSize(item?.size) : ""}</div>
                <div style="place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c date">${item?.lastModified ? new Date(item?.lastModified).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : ""}</div>
            </div>`;
            createItemCtxMenu?.(self, item);
            return itemEl;
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
            const handleMap = await Promise.all(await Array.fromAsync(await this.#dirProxy?.entries?.() ?? []));

            for (const $pair of handleMap) {
                try {
                    const [name, handle] = $pair as any;
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
                        } catch { }
                    }

                    //items.push({ name, kind, type, size, lastModified, handle });
                    //this.#entries.push({ name, kind, type, size, lastModified, handle });
                    const up = { onRowClick: () => self.onRowClick(item), onRowDblClick: () => self.onRowDblClick(item) };
                    const item = { name, kind, type, size, lastModified, handle, up };
                    this.#entries.push(item);
                } catch (e: any) {
                    console.warn(e);
                }
            }
            self.manuallyRenderFileList(this.#entries);
            // sort: directories first, then files by name
            //items.sort((a, b) => (a?.kind === b?.kind ? a?.name?.localeCompare?.(b?.name) : (a?.kind === "directory" ? -1 : 1)));
            //this.#entries.splice(0, this.#entries.length, ...items);
        } catch (e: any) {
            this.#error.value = e?.message || String(e || "");
            console.warn(e);
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
    private onRowDragStart = (item: FileEntryItem, ev: DragEvent) => {
        try {
            if (item?.kind !== "file") return;
            const dt = ev?.dataTransfer;
            if (!dt) return;
            ev.stopPropagation();
            Promise.try(async () => {
                const fh = await this.#dirProxy?.getFileHandle?.(item?.name, { create: false });
                const file = await fh?.getFile?.();
                const abs = (this.path || "/user/") + item?.name;
                if (file) attachFile(dt, file, abs);
            }).catch(console.warn);
        } catch (e) { console.warn(e); }
    };

    //
    private async onMenuAction(item: FileEntryItem | null, actionId: string, ev: MouseEvent) {
        try {
            if (!actionId) return;
            const abs = (this.path || "/user/") + (item?.name || "");
            switch (actionId) {
                case "open":
                    if (item?.kind === "file") {
                        const detail = { path: abs, item };
                        (this as any).dispatchEvent?.(new CustomEvent("open", { detail, bubbles: true, composed: true }));
                    }
                    break;
                case "download":
                    if (item?.kind === "file") {
                        Promise.try(async () => {
                            const fh = await this.#dirProxy?.getFileHandle?.(item?.name, { create: false });
                            const file = await fh?.getFile?.();
                            if (file) await downloadFile(file);
                        }).catch(console.warn);
                    }
                    break;
                case "delete":
                    await remove(this.#fsRoot, abs);
                    await this.loadPath(this.path);
                    break;
                case "rename":
                    if (item?.kind === "file") {
                        const next = prompt("Rename to:", item?.name);
                        if (next && next !== item?.name) {
                            await this.renameFile(item?.name, next);
                            await this.loadPath(this.path);
                        }
                    }
                    break;
                case "copy":
                    this.#clipboard = { items: [abs], cut: false };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { }
                    break;
                case "move":
                    this.#clipboard = { items: [abs], cut: true };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { }
                    break;
            }
        } catch (e: any) {
            console.warn(e);
            this.#error.value = e?.message || String(e || "");
        }
    }

    //
    private async renameFile(oldName: string, newName: string) {
        const fromHandle = await this.#dirProxy?.getFileHandle?.(oldName, { create: false });
        const file = await fromHandle?.getFile?.();
        if (!file) return;
        const target = await this.#dirProxy?.getFileHandle?.(newName, { create: true }).catch(() => null);
        if (!target) {
            await writeFile(this.#fsRoot, (this.path || "/user/") + newName, file);
        } else {
            await writeFile(this.#fsRoot, (this.path || "/user/") + newName, file);
        }
        await remove(this.#fsRoot, (this.path || "/user/") + oldName);
    }

    //
    async requestUpload() {
        try {
            await uploadFile(this.path, null);
            await this.loadPath(this.path);
        } catch (e) { console.warn(e); }
    }

    //
    async requestPaste() {
        try {
            let sources: string[] = [];
            // try system clipboard
            try {
                const txt = await navigator.clipboard?.readText?.();
                if (txt && txt.startsWith("/user/")) sources = txt.split(/\n+/).map(s => s.trim()).filter(Boolean);
            } catch { }
            if (!sources?.length && this.#clipboard?.items?.length) sources = this.#clipboard.items;
            if (!sources?.length) return;

            const toDir = await getDirectoryHandle(this.#fsRoot, this.path, { create: true });
            for (const src of sources) {
                // fallback: detect via getHandler not exported; instead derive by trailing slash
                const isDir = src.endsWith("/");
                if (isDir) {
                    const fromDir = await getDirectoryHandle(this.#fsRoot, src, { create: false });
                    await copyFromOneHandlerToAnother(fromDir as any, toDir as any);
                } else {
                    const fromFile = await getFileHandle(this.#fsRoot, src, { create: false });
                    const toFile = await toDir?.getFileHandle?.(src.split("/").pop() || "file", { create: true });
                    await copyFromOneHandlerToAnother(fromFile as any, toFile as any);
                }
                if (this.#clipboard?.cut) { await remove(this.#fsRoot, src); }
            }
            this.#clipboard = null;
            await this.loadPath(this.path);
        } catch (e) { console.warn(e); }
    }

    //
    private bindDropHandlers() {
        const container = Q(".fm-grid-container", (this as any)?.shadowRoot ?? this) as HTMLElement;
        if (!container) return;
        addEvent(container, "dragover", (ev: DragEvent) => { ev.preventDefault(); ev.dataTransfer!.dropEffect = "copy"; });
        addEvent(container, "drop", (ev: DragEvent) => this.onDrop(ev));
        // paste via keyboard
        addEvent(this, "keydown", (ev: KeyboardEvent) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "v") {
                ev.preventDefault(); this.requestPaste();
            }
        });
    }

    //
    private onDrop(ev: DragEvent) {
        ev.preventDefault();
        const dt = ev.dataTransfer;
        if (!dt) return;
        const files = dt.files;
        const tasks: Promise<any>[] = [];
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            tasks.push(writeFile(this.#fsRoot, (this.path || "/user/") + f.name, f));
        }
        // URLs
        const uriList = dt.getData("text/uri-list") || dt.getData("text/plain");
        if (uriList) {
            const urls = uriList.split(/\r?\n/).filter(Boolean);
            for (const url of urls) {
                tasks.push(Promise.try(async () => {
                    const file = await provide(url);
                    if (file) await writeFile(this.#fsRoot, (this.path || "/user/") + file.name, file);
                }));
            }
        }
        Promise.allSettled(tasks).then(() => this.loadPath(this.path)).catch(console.warn);
    }

    //
    render = function() {
        const entries = this.#entries;
        const loading = this.#loading;
        const error = this.#error;
        const sidebarVisible = this.showSidebar;

        //
        const fileHeader = H`<div class="fm-grid-header">
            <div class="c icon" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content;"></div>
            <div class="c name" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content; inline-size: stretch;">Name</div>
            <div class="c size" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content;">Size</div>
            <div class="c date" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content;">Modified</div>
        </div>`

        //
        const fileRows = H`<div class="fm-grid-rows"><slot></slot></div>`
        const fileContainer = H`<div class="fm-grid-container" data-mixin="ov-scrollbar">
            <div class="fm-grid" part="grid">
                ${fileHeader}
                ${fileRows}
            </div>
        </div>`

        //
        const toolbar = H`<div part="toolbar" class="fm-toolbar">
            <div class="fm-toolbar-left">
                <button class="btn" title="Up" on:click=${() => this.goUp()}><ui-icon icon="arrow-up"/></button>
                <button class="btn" title="Refresh" on:click=${() => this.loadPath(this.path)}><ui-icon icon="arrow-clockwise"/></button>
            </div>
            <div class="fm-toolbar-center">
                <ui-longtext class="address c2-surface" style="background-color: --c2-surface(0.04, var(--current, transparent)); inline-size: stretch; border: none 0px transparent; outline: none 0px transparent;" name="address">
                    <input type="text" value=${this.path} name="address" />
                </ui-longtext>
            </div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => this.requestUpload?.()}><ui-icon icon="file-up"/></button>
                <button class="btn" title="Paste" on:click=${() => this.requestPaste?.()}><ui-icon icon="clipboard-paste"/></button>
                <button class="btn" title="Use" on:click=${() => this.requestUse?.()}><ui-icon icon="image-play"/></button>
            </div>
        </div>`

        //! UNUSED!
        const sidebar = H`<aside visible=${sidebarVisible} part="sidebar" class="fm-sidebar">
            <div class="sec">
                <div class="sec-title">Places</div>
                <button class="link" on:click=${() => this.navigate("/user/")}>/user</button>
                <button class="link" on:click=${() => this.navigate("/user/temp/")}>/user/temp</button>
                <button class="link" on:click=${() => this.navigate("/user/pictures/")}>/user/pictures</button>
            </div>
        </aside>`

        //
        const status = H`
        ${loading?.value ? H`<div class="status">Loading…</div>` : null}
        ${error?.value ? H`<div class="status error">${error.value}</div>` : null}
        `

        //
        const content = H`<div part="content" class="fm-content">
            ${status}
            ${fileContainer}
        </div>`

        //
        const root = H`
            <div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>
                ${toolbar}
                ${content}
            </div>
        `;
        // bind drop and paste handlers after first render
        requestAnimationFrame(() => this.bindDropHandlers());
        return root;
    }
}

//
export default FileManager;
