import { property, defineElement, H, C, bindWith, initGlobalClipboard } from "fest/lure";
import { addEvent, handleStyleChange, isInFocus, preloadStyle } from "fest/dom";
import { computed, propRef, ref } from "fest/object";

//
import UIElement from "./UIElement";

// @ts-ignore
import fmCss from "./FileManagerContent.scss?inline";
import { type FileEntryItem, FileOperative } from "./Operative";

//
import { createItemCtxMenu } from "./ContextMenu";

//
initGlobalClipboard();

//
const styled = preloadStyle(fmCss);

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
const iconFor = (item: FileEntryItem, type?: string) => {
    if (typeof item === "string") return (item === "directory" ? "folder" : iconByMime(type || item || ""));
    return item?.kind === "directory" ? "folder" : iconByMime(item?.type);
}

//
const sizeCache = new Map<number, string>();
const getSize = (size: number) => {
    if (!sizeCache.has(size)) {
        let formatted: string;
        if (size < 1024) formatted = size + " B";
        else if (size < 1024 * 1024) formatted = (size / 1024).toFixed(2) + " kB";
        else if (size < 1024 * 1024 * 1024) formatted = (size / 1024 / 1024).toFixed(2) + " MB";
        else formatted = (size / 1024 / 1024 / 1024).toFixed(2) + " GB";
        sizeCache.set(size, formatted);
    }
    return sizeCache.get(size)!;
};

//
const dateCache = new Map<number, string>();
const getFormattedDate = (timestamp: number) => {
    if (!dateCache.has(timestamp)) {
        dateCache.set(timestamp, new Date(timestamp).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }));
    }
    return dateCache.get(timestamp)!;
};

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    //
    public operativeInstance: FileOperative | null = null;
    public operativeInstanceRef = ref<FileOperative | null>(null);

    //
    get path() { return this.operativeInstance?.path || ""; }
    set path(value: string) { if (this.operativeInstance) this.operativeInstance.path = value; }
    get pathRef() { return this.operativeInstance?.pathRef || ref("/user/"); }

    //
    onInitialize() {
        super.onInitialize();

        //
        //const weak: any = new WeakRef(this);
        //requestAnimationFrame(() => {
            //const self = weak?.deref?.();
            //const frame: any = document.createElement("ui-scrollframe");
            //frame.style.zIndex = 99;

            //
            //const rows = Q(".fm-grid-container", self?.shadowRoot), grid = Q(".fm-grid", self?.shadowRoot);
            //frame.bindWith(rows, rows);
            //grid?.append(frame);
        //});
    }

    //
    protected bindDropHandlers() {
        const container = this;
        if (!container) return;
        addEvent(container, "dragover", (ev: DragEvent) => {
            if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
                ev?.preventDefault?.();
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = "copy";
                }
            }
        });
        addEvent(container, "drop", (ev: DragEvent) => {
            if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
                ev?.preventDefault?.();
                ev?.stopImmediatePropagation?.();
                this.operativeInstance?.onDrop?.(ev)
            }
        });
        /*addEvent(this, "keydown", (ev: KeyboardEvent) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "v") {
                ev.preventDefault(); this.operativeInstance?.requestPaste?.();
            }
        });*/
    }

    //
    public onPaste(ev: ClipboardEvent) {
        if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
            if (this.operativeInstance) this.operativeInstance.onPaste(ev);
        }
    }

    //
    public onCopy(ev: ClipboardEvent) {
        if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
            if (this.operativeInstance) this.operativeInstance.onCopy(ev);
        }
    }

    //
    byFirstTwoLetterOrName(name: string): number {
        const firstTwoLetters = name?.substring?.(0, 2)?.toUpperCase?.();

        // needs get index by first two letters in alphabet
        const index = (firstTwoLetters?.charCodeAt?.(0) || 65) - 65; //+ ((firstTwoLetters?.charCodeAt?.(1) || 65) - 65);
        return index;
    }

    //
    constructor() {
        super();
        this.operativeInstance ??= new FileOperative();
        this.operativeInstance.host = this as any;
    }

    //
    styles = () => styled;
    render = function () {
        const self: any = this;
        const fileHeader = H`<div class="fm-grid-header">
            <div class="c icon">@</div>
            <div class="c name">Name</div>
            <div class="c size">Size</div>
            <div class="c date">Modified</div>
            <div class="c actions">Actions</div>
        </div>`

        //
        const operative = self.operativeInstance;
        if (!operative) return "";

        //
        const makeListElement = (item: FileEntryItem) => {
            const isFile = item?.kind === "file" || item?.file;
            const itemEl = H`<div draggable="${isFile}" data-id=${propRef(item, "name")} class="row c2-surface"
                on:click=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowClick?.(item, ev))}
                on:dblclick=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowDblClick?.(item, ev))}
                on:dragstart=${(ev: DragEvent) => operative.onRowDragStart?.(item, ev)}
                data-id=${propRef(item, "name")}
            >
                <div style="pointer-events: none; background-color: transparent;" class="c icon"><ui-icon icon=${computed(item, ()=>{ return iconFor(item); })} /></div>
                <div style="pointer-events: none; background-color: transparent;" class="c name" title=${propRef(item, "name")}>${propRef(item, "name")}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c size">${isFile ? propRef(item, "size") : ""}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c date">${isFile ? computed(propRef(item, "lastModified"), (val)=>{ return getFormattedDate(val ?? 0); }) : ""}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c actions">
                    <button class="action-btn" title="Copy Path" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); requestAnimationFrame(() => operative.onMenuAction?.(item, "copyPath", ev)); }}>
                        <ui-icon icon="copy" />
                    </button>
                    <button class="action-btn" title="Copy" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); requestAnimationFrame(() => operative.onMenuAction?.(item, "copy", ev)); }}>
                        <ui-icon icon="clipboard" />
                    </button>
                    <button class="action-btn" title="Delete" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); requestAnimationFrame(() => operative.onMenuAction?.(item, "delete", ev)); }}>
                        <ui-icon icon="trash" />
                    </button>
                </div>
            </div>`;

            //
            bindWith(itemEl, "--order", computed(propRef(item, "name"), (val)=>{ return self.byFirstTwoLetterOrName(val ?? ""); }), handleStyleChange);
            return itemEl;
        }

        //
        let fileRows: any = null;
        const renderedEntries = C(computed(operative.entries, (v)=>{
            if (v?.length != null && v?.length >= 0) {
                if (fileRows != null) fileRows.innerHTML = ``;
                const fragment = document.createDocumentFragment();
                fragment.append(...v?.map?.((file: FileEntryItem)=>makeListElement(file))?.filter?.(el => el != null) || []);
                return fragment;
            }
        }));

        //
        fileRows = H`<div class="fm-grid-rows" style="will-change: contents;">${renderedEntries}</div>`
        renderedEntries.boundParent = fileRows;
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), operative.entries);
        queueMicrotask(() => self.bindDropHandlers());

        //
        const rendered = H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;

        //
        //const renderer = makeRenderer();
        //renderer.append(rendered);
        //return renderer;
        return rendered;
    }
}

//
export default FileManagerContent;
