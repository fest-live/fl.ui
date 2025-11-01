import { property, defineElement, H, M, E, C } from "fest/lure";
import { addEvent, preloadStyle } from "fest/dom";
import { computed, ref } from "fest/object";

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
        addEvent(container, "dragover", (ev: DragEvent) => { ev?.preventDefault?.(); (ev.dataTransfer as DataTransfer)!.dropEffect = "copy"; });
        addEvent(container, "drop", (ev: DragEvent) => {
            ev?.preventDefault?.();
            ev?.stopImmediatePropagation?.();
            this.operativeInstance?.onDrop?.(ev)
        });
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
            <div class="c icon">@</div>
            <div class="c name">Name</div>
            <div class="c size">Size</div>
            <div class="c date">Modified</div>
            <div class="c actions">Actions</div>
        </div>`

        //
        const operative = this.operativeInstance;
        if (!operative) return "";

        //
        const makeListElement = (item: FileEntryItem) => {
            const itemEl = H`<div draggable="${item?.kind === "file"}" data-id=${item?.name} class="row c2-surface"
                on:click=${(ev: MouseEvent) => operative.onRowClick?.(item, ev)}
                on:dblclick=${(ev: MouseEvent) => operative.onRowDblClick?.(item, ev)}
                on:dragstart=${(ev: DragEvent) => operative.onRowDragStart?.(item, ev)}
            >
                <div class="c icon">${H`<ui-icon icon=${iconFor(item)} />`}</div>
                <div class="c name" title=${item?.name}>${item?.name}</div>
                <div class="c size">${item?.size != null ? getSize(item?.size) : ""}</div>
                <div class="c date">${item?.lastModified ? new Date(item?.lastModified).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : ""}</div>
                <div class="c actions">
                    <button class="action-btn" title="Copy Path" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); operative.onMenuAction?.(item, "copyPath", ev); }}>
                        <ui-icon icon="copy" />
                    </button>
                    <button class="action-btn" title="Copy" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); operative.onMenuAction?.(item, "copy", ev); }}>
                        <ui-icon icon="clipboard" />
                    </button>
                    <button class="action-btn" title="Delete" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); operative.onMenuAction?.(item, "delete", ev); }}>
                        <ui-icon icon="trash" />
                    </button>
                </div>
            </div>`;
            itemEl.style.setProperty("--order", this.byFirstTwoLetterOrName(item?.name));
            return itemEl;
        }

        //
        const fileContainer = this.shadowRoot;

        //
        let fileRows: any = null;
        const renderedEntries = C(computed(operative.entries, (v)=>{
            if (v?.length != null && v?.length >= 0) {
                if (fileRows) fileRows.innerHTML = ``;
                const fragment = document.createDocumentFragment();
                fragment.append(...v?.map?.((file)=>makeListElement(file)));
                return fragment;
            }
        }));

        //
        fileRows = H`<div class="fm-grid-rows">${renderedEntries}</div>`
        renderedEntries.boundParent = fileRows;
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), operative.entries);
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
