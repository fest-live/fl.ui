import { property, defineElement, H, bindWith, initGlobalClipboard } from "fest/lure";
import { addEvent, handleStyleChange, isInFocus, preloadStyle } from "fest/dom";
import { affected, ref } from "fest/object";

//
import { UIElement } from "@fl-ui/base/UIElement";

// @ts-ignore
import fmCss from "./FileManagerContent.scss?inline";
import { type FileEntryItem, FileOperative } from "./Operative";

//
import { createItemCtxMenu } from "./ContextMenu";

//
import { iconFor, formatDate } from "./utils";

//
initGlobalClipboard();

//
const styled = preloadStyle(fmCss);

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    //
    public operativeInstance: FileOperative | null = null;
    public operativeInstanceRef = ref<FileOperative | null>(null);
    #rowsWatcherDisposer: (() => void) | null = null;

    //
    get entries() { return this.operativeInstance?.entries ?? []; }
    get path() { return this.operativeInstance?.path || "/"; }
    set path(value: string) { if (this.operativeInstance) this.operativeInstance.path = value || "/"; }
    get pathRef() { return this.operativeInstance?.pathRef; }

    //
    refreshList() {
        if (this.gridRowsEl) this.gridRowsEl.innerHTML = ``;
        if (this.gridEl) this.gridEl.innerHTML = ``;
        if (this.operativeInstance) this.operativeInstance.refreshList(this.path || "/");
    }

    //
    onInitialize(): this {
        const result = super.onInitialize();
        return (result ?? this) as this;
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
        const index = (firstTwoLetters?.charCodeAt?.(0) || 65) - 65;
        return index;
    }

    //
    constructor() {
        super();
        this.operativeInstance ??= new FileOperative();
        this.operativeInstance.host = this as any;
        this.refreshList();
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
            const itemEl = H`<div draggable="${isFile}" class="row c2-surface"
                on:click=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowClick?.(item, ev))}
                on:dblclick=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowDblClick?.(item, ev))}
                on:dragstart=${(ev: DragEvent) => operative.onRowDragStart?.(item, ev)}
                data-id=${item?.name || ""}
            >
                <div style="pointer-events: none; background-color: transparent;" class="c icon"><ui-icon icon=${iconFor(item)} /></div>
                <div style="pointer-events: none; background-color: transparent;" class="c name" title=${item?.name || ""}>${item?.name || ""}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c size">${isFile ? (item?.size ?? "") : ""}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c date">${isFile ? formatDate(item?.lastModified ?? 0) : ""}</div>
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
            bindWith(itemEl, "--order", self.byFirstTwoLetterOrName(item?.name ?? ""), handleStyleChange);
            return itemEl;
        }

        //
        let fileRows: any = null;
        fileRows = H`<div class="fm-grid-rows" style="will-change: contents;"></div>`;
        const syncRows = () => {
            if (!fileRows) return;
            const currentEntries = (self.entries as any)?.value ?? self.entries ?? [];
            const safeEntries = Array.isArray(currentEntries) ? currentEntries : [];
            fileRows.innerHTML = "";
            const fragment = document.createDocumentFragment();
            for (const entry of safeEntries) {
                if (entry && typeof entry === "object" && entry.name != null) {
                    const row = makeListElement(entry as FileEntryItem);
                    if (row) fragment.append(row);
                }
            }
            fileRows.append(fragment);
        };
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), self.entries);
        queueMicrotask(() => {
            self.#rowsWatcherDisposer?.();
            self.#rowsWatcherDisposer = null;
            syncRows();
            self.#rowsWatcherDisposer = affected(operative.entries, () => syncRows());
            self.bindDropHandlers();
        });

        //
        const rendered = H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;

        //
        return rendered;
    }
}

//
export default FileManagerContent;
