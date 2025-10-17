import { H, defineElement, property, M, Q, E, makeRenderer } from "fest/lure";
import { preloadStyle } from "fest/dom";
import { ref } from "fest/object";
import { addEvent } from "fest/dom";

//
import UIElement from "@fl-design/base/UIElement";

// @ts-ignore
import fmCss from "./FileManagerContent.scss?inline";
import { FileEntryItem, FileOperative } from "./Operative";

//
import { createItemCtxMenu } from "./ContextMenu";

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
const iconFor = (item: FileEntryItem) => item?.kind === "directory" ? "folder" : iconByMime(item?.type);

//
const getSize = (size: number) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " kB";
    if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(2) + " MB";
    return (size / 1024 / 1024 / 1024).toFixed(2) + " GB";
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
    protected bindDropHandlers() {
        const container = Q(".fm-grid-container", (this as any)?.shadowRoot ?? this) as HTMLElement;
        if (!container) return;
        addEvent(container, "dragover", (ev: DragEvent) => { ev.preventDefault(); ev.dataTransfer!.dropEffect = "copy"; });
        addEvent(container, "drop", (ev: DragEvent) => this.operativeInstance?.onDrop?.(ev));
        addEvent(this, "keydown", (ev: KeyboardEvent) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "v") {
                ev.preventDefault(); this.operativeInstance?.requestPaste?.();
            }
        });
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
    }

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
        const oper = this.operativeInstance;
        if (!oper) return "";

        //
        const fileContainer = this.shadowRoot;
        const renderedEntries = M(oper.entries, (item: FileEntryItem) => {
            const itemEl = H`<div draggable="${item?.kind === "file"}" data-id=${item?.name} class="row c2-surface"
                on:click=${(ev: MouseEvent) => oper.onRowClick?.(item, ev)}
                on:dblclick=${(ev: MouseEvent) => oper.onRowDblClick?.(item, ev)}
                on:dragstart=${(ev: DragEvent) => oper.onRowDragStart?.(item, ev)}
            >
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c icon">${H`<ui-icon icon=${iconFor(item)} />`}</div>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none; inline-size: stretch;" class="c name" title=${item?.name}>${item?.name}</div>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c size">${item?.size != null ? getSize(item?.size) : ""}</div>
                <div style="grid-row: 1; place-content: center; place-items: center; text-overflow: ellipsis; min-block-size: 2rem; block-size: max-content; overflow: hidden; pointer-events: none;" class="c date">${item?.lastModified ? new Date(item?.lastModified).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : ""}</div>
            </div>`;
            itemEl.style.setProperty("--order", this.byFirstTwoLetterOrName(item?.name));
            return itemEl;
        });

        //
        const fileRows = H`<div class="fm-grid-rows">${renderedEntries}</div>`
        E(fileRows, {}, renderedEntries);
        createItemCtxMenu?.(fileRows, oper.onMenuAction.bind(oper), oper.entries);
        requestAnimationFrame(() => this.bindDropHandlers());

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
