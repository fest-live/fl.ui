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
const makeFileActionOps = () => {
    return [
        { id: "open", label: "Open", icon: "function" },
        { id: "download", label: "Download", icon: "download" }
    ];
};

//
const makeFileSystemOps = () => {
    return [
        { id: "delete", label: "Delete", icon: "trash" },
        { id: "rename", label: "Rename", icon: "pencil" },
        { id: "copy", label: "Copy", icon: "copy" },
        { id: "move", label: "Move", icon: "hand-withdraw" }
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
const _LOG_ = (ev: any) => {
    console.log(ev);
    return ev;
}

//
const createItemCtxMenu = async (fileManager: any, entries: FileEntryItem[]) => {
    const ctxMenuDesc = {
        openedWith: null,
        items: [
            makeFileActionOps(),
            makeFileSystemOps(),
        ],
        defaultAction: (initiator: HTMLElement, menuItem: any, ev: MouseEvent) => {
            const rowFromCompose = Array.from(ev?.composedPath?.() || []).find((element: any) => element?.classList?.contains?.("row")) ?? initiator;
            (fileManager as any).onMenuAction?.(entries?.find?.(item => (item?.name === (rowFromCompose as any)?.getAttribute?.("data-id"))), menuItem?.id, ev);
        }
    };

    //
    const initiatorElement = fileManager;

    //
    const ctxMenu = makeContextMenu();
    ctxMenuTrigger(initiatorElement as any, ctxMenuDesc, ctxMenu);
    disconnectRegistry.register(initiatorElement, ctxMenu);
    return ctxMenu;
}

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    // refs/state
    #entries = makeReactive<FileEntryItem[]>([]);
    #loading = ref(false);
    #error = ref("");
    #fsRoot: any = null;
    #dirProxy: any = null;
    #loadLock = false;

    //
    protected pathRef = ref("/user/");

    //
    get path() { return this.pathRef.value; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value; }

    //
    #clipboard: { items: string[]; cut?: boolean } | null = null;

    //
    onInitialize() {
        super.onInitialize();
        this.#entries = makeReactive<FileEntryItem[]>([]);
        this.pathRef ??= ref("/user/");

        // initialize OPFS root
        Promise.try(async () => {
            // @ts-ignore
            this.#fsRoot = await navigator?.storage?.getDirectory?.();
            this.loadPath(this.path || "/user/");
        });

        //
        const weak: any = new WeakRef(this);
        requestAnimationFrame(() => {
            const self = weak?.deref?.();
            const frame: any = document.createElement("ui-scrollframe");
            frame.style.zIndex = 99;

            //
            const rows = Q(".fm-grid-container", self?.shadowRoot), grid = Q(".fm-grid", self?.shadowRoot);
            frame.bindWith(rows, rows);
            //grid?.append(frame);
        });
    }

    //
    async loadPath(path: string) {
        const self: any = this;

        //
        if (this.#loadLock) { return setTimeout(() => this.loadPath(path), 1000); };
        this.#loadLock = true;

        //
        try {
            this.#loading.value = true;
            this.#error.value = "";
            const rel = path; // openDirectory can consume absolute-like parts (it filters Booleans)

            //
            this.#dirProxy = openDirectory(this.#fsRoot, rel, { create: false }); await this.#dirProxy;
            const handleMap = await Promise.all(await Array.fromAsync(await this.#dirProxy?.entries?.() ?? []));

            //
            this.#entries.splice(0, this.#entries.length);
            await Promise.all(handleMap?.map?.(async ($pair: any) => {
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
            }))?.catch?.(console.warn.bind(console));

            //
            //self.manuallyRenderFileList(this.#entries);
            // sort: directories first, then files by name
            //items.sort((a, b) => (a?.kind === b?.kind ? a?.name?.localeCompare?.(b?.name) : (a?.kind === "directory" ? -1 : 1)));
            //this.#entries.splice(0, this.#entries.length, ...items);
        } catch (e: any) {
            this.#error.value = e?.message || String(e || "");
            console.warn(e);
        } finally {
            this.#loading.value = false;
            this.#loadLock = false;
        }

        //
        this.#loadLock = false;
        return this;
    }


    //
    protected onRowClick = (item: FileEntryItem, ev: MouseEvent) => {
        ev.preventDefault();
        (this as any).itemAction?.(item);
    };

    //
    protected onRowDblClick = (item: FileEntryItem, ev: MouseEvent) => {
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
    protected onRowDragStart = (item: FileEntryItem, ev: DragEvent) => {
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
    protected async onMenuAction(item: FileEntryItem | null, actionId: string, ev: MouseEvent) {
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
    protected async renameFile(oldName: string, newName: string) {
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
    protected bindDropHandlers() {
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
    protected onDrop(ev: DragEvent) {
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
    byFirstTwoLetterOrName(name: string): number {
        const firstTwoLetters = name?.substring?.(0, 2)?.toUpperCase?.();

        // needs get index by first two letters in alphabet
        const index = (firstTwoLetters?.charCodeAt?.(0) || 65) - 65; //+ ((firstTwoLetters?.charCodeAt?.(1) || 65) - 65);
        return index;
    }

    //
    constructor() { super(); }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function () {
        const self: any = this;
        const fileHeader = H`<div class="fm-grid-header">
            <div class="c icon" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content;"></div>
            <div class="c name" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content; inline-size: stretch;">Name</div>
            <div class="c size" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content;">Size</div>
            <div class="c date" style="place-content: center; place-items: center; min-block-size: 2rem; overflow: hidden; block-size: max-content;">Modified</div>
        </div>`

        //
        const fileContainer = this.shadowRoot;
        const renderedEntries = M(this.#entries, (item: FileEntryItem) => {
            const itemEl = H`<div draggable="${item?.kind === "file"}" data-id=${item?.name} class="row c2-surface" on:click=${(ev: MouseEvent) => self.onRowClick?.(item, ev)} on:dblclick=${(ev: MouseEvent) => self.onRowDblClick?.(item, ev)} on:dragstart=${(ev: DragEvent) => self.onRowDragStart?.(item, ev)}>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c icon">${H`<ui-icon icon=${iconFor(item)} />`}</div>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none; inline-size: stretch;" class="c name" title=${item?.name}>${item?.name}</div>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c size">${item?.size != null ? getSize(item?.size) : ""}</div>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c date">${item?.lastModified ? new Date(item?.lastModified).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : ""}</div>
            </div>`;
            itemEl.style.setProperty("--order", this.byFirstTwoLetterOrName(item?.name));
            return itemEl;
        });

        //
        requestAnimationFrame(() => this.bindDropHandlers());

        //
        const fileRows = H`<div class="fm-grid-rows">${renderedEntries}</div>`
        E(fileRows, {}, renderedEntries);
        createItemCtxMenu?.(fileRows, this.entries);

        //
        return H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;
    }
}

export default FileManagerContent;
