import { property, defineElement, H, bindWith, initGlobalClipboard } from "fest/lure";
import { addEvent, handleStyleChange, isInFocus } from "fest/dom";
import { ref } from "fest/object";
import { ensureStyleSheet, reinitializeRegistry } from "fest/icon";
import "fest/icon";

//
import UIElement from "@fl-ui/base/UIElement";

import { type FileEntryItem, FileOperative } from "./Operative";

import { createItemCtxMenu } from "../context/ContextMenu";

const iconByMime = (mime: string | undefined, def = "file"): string => {
    if (!mime) return def;
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "music";
    if (mime.startsWith("video/")) return "video";
    if (mime.includes("json")) return "brackets-curly";
    if (mime.startsWith("text/")) return "file-text";
    return def;
};

const iconFor = (item: FileEntryItem | string): string => {
    if (typeof item === "string") return item === "directory" ? "folder" : "file";
    if (item?.kind === "directory") return "folder";
    return iconByMime(item?.type);
};

const formatDate = (timestamp: number | Date | undefined): string => {
    if (timestamp === undefined || timestamp === null) return "";
    const value = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return value.toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "short",
    });
};

let fileManagerIconRuntimeReady = false;
const ensureFileManagerIconRuntime = (): void => {
    if (fileManagerIconRuntimeReady) return;
    try {
        ensureStyleSheet();
        reinitializeRegistry();
        fileManagerIconRuntimeReady = true;
    } catch (error) {
        console.warn("[FileManagerContent] Failed to initialize icon runtime:", error);
    }
};

const fmCss = `
    :host {
        --fm-row-bg: rgba(17, 27, 42, 0.28);
        --fm-row-hover: rgba(137, 176, 255, 0.12);
        --fm-row-border: rgba(138, 172, 248, 0.08);
        --fm-border: rgba(138, 172, 248, 0.18);
        --fm-muted: #8ca6ce;
        --fm-text: #dbe8ff;
        --fm-folder: #8fb6ff;
        --fm-file: #b9c9e8;
        --fm-focus: rgba(137, 176, 255, 0.55);
        display: block;
        inline-size: 100%;
        block-size: 100%;
        min-inline-size: 0;
        min-block-size: 0;
        box-sizing: border-box;
        overflow: hidden;
    }

    .fm-grid {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        block-size: 100%;
        min-block-size: 0;
        overflow: hidden;
        box-sizing: border-box;
    }

    .fm-grid-header,
    .row {
        display: grid;
        grid-template-columns: 1.6rem minmax(0, 1fr) 6.5rem 8.5rem 8rem;
        align-items: center;
        gap: 0.45rem;
        padding: 0.25rem 0.55rem;
        box-sizing: border-box;
    }

    .fm-grid-header {
        font-size: 0.735rem;
        line-height: 1.15;
        color: var(--fm-muted);
        border-block-end: 1px solid var(--fm-border);
        background: rgba(255, 255, 255, 0.02);
        position: sticky;
        inset-block-start: 0;
        z-index: 2;
    }

    .fm-grid-rows {
        overflow: auto;
        min-block-size: 0;
        display: grid;
        align-content: start;
        scrollbar-width: thin;
        scrollbar-color: rgba(138, 172, 248, 0.25) transparent;
    }

    .row {
        border-block-end: 1px solid var(--fm-row-border);
        min-block-size: 2.1rem;
        cursor: default;
        background: var(--fm-row-bg);
        color: var(--fm-text);
        transition: background-color 0.12s ease, border-color 0.12s ease;
    }

    .row:hover {
        background: var(--fm-row-hover);
        border-color: var(--fm-border);
    }

    .row[data-selected="true"] {
        background: color-mix(in oklab, var(--fm-row-hover) 72%, rgba(137, 176, 255, 0.2) 28%);
    }

    .row .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.82rem;
    }

    .row .icon {
        color: var(--fm-file);
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .row .icon ui-icon {
        --icon-size: 1rem;
    }

    .row[data-kind="directory"] .icon,
    .row .icon[data-kind="directory"] {
        color: var(--fm-folder);
    }

    .row .size,
    .row .date {
        color: var(--fm-muted);
        font-size: 0.74rem;
    }

    .row .actions {
        display: inline-flex;
        gap: 0.2rem;
        justify-self: end;
        opacity: 0.9;
    }

    .row:hover .actions {
        opacity: 1;
    }

    .row .action-btn {
        border: 0;
        border-radius: 6px;
        padding: 0.2rem;
        background: rgba(137, 176, 255, 0.08);
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.12s ease, transform 0.12s ease;
    }

    .row .action-btn ui-icon {
        --icon-size: 0.9rem;
    }

    .row .action-btn:hover {
        background: rgba(137, 176, 255, 0.2);
    }

    .row .action-btn:active {
        transform: translateY(0.5px);
    }

    .row .action-btn:focus-visible {
        outline: 0;
        box-shadow: 0 0 0 2px var(--fm-focus);
    }
`;

//
initGlobalClipboard();

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    //
    public operativeInstance: FileOperative | null = null;
    public operativeInstanceRef = ref<FileOperative | null>(null);
    #rowsContainer: HTMLElement | null = null;

    //
    get entries() { return this.operativeInstance?.entries ?? []; }
    get path() { return this.operativeInstance?.path || "/"; }
    set path(value: string) { if (this.operativeInstance) this.operativeInstance.path = value || "/"; }
    get pathRef() { return this.operativeInstance?.pathRef; }

    //
    refreshList() {
        if (this.gridRowsEl) this.gridRowsEl.innerHTML = ``;
        if (this.gridEl) this.gridEl.innerHTML = ``;
        if (this.operativeInstance) {
            void this.operativeInstance.refreshList(this.path || "/").then(() => this.syncRows()).catch(console.warn);
        }
    }

    //
    onInitialize(): this {
        const result = super.onInitialize();
        const self: any = result ?? this;
        self.removeAttribute?.("hidden");
        if (self.style) self.style.display = "block";
        return self as this;
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
                ev?.stopPropagation?.();
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
        ensureFileManagerIconRuntime();
        this.operativeInstance ??= new FileOperative();
        this.operativeInstance.host = this as any;
        this.addEventListener("entries-updated", () => this.syncRows());
        this.refreshList();
    }

    private syncRows() {
        let rows = this.#rowsContainer;
        if (!rows || !rows.isConnected) {
            rows = (this.shadowRoot?.querySelector?.(".fm-grid:last-of-type .fm-grid-rows") as HTMLElement | null) ?? null;
            this.#rowsContainer = rows;
        }
        const operative = this.operativeInstance;
        if (!rows || !operative) return;
        const rawEntries: any = operative.entries as any;
        const currentEntries =
            Array.isArray(rawEntries) ? rawEntries :
            (Array.isArray(rawEntries?.value) ? rawEntries.value : []);
        const safeEntries = Array.isArray(currentEntries) ? currentEntries : [];
        const seen = new Set<string>();
        rows.innerHTML = "";
        const fragment = document.createDocumentFragment();
        for (const item of safeEntries) {
            if (!item || typeof item !== "object" || item.name == null) continue;
            const dedupeKey = `${item.kind}:${item.name}`;
            if (seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);
            fragment.append(this.makeListElement(item as FileEntryItem, operative));
        }
        rows.append(fragment);
    }

    private makeListElement(item: FileEntryItem, operative: FileOperative) {
        const op: any = operative as any;
        const isFile = item?.kind === "file" || item?.file;
        const itemEl = H`<div draggable="${isFile}" class="row c2-surface"
            on:click=${(ev: MouseEvent) => op.onRowClick?.(item, ev)}
            on:dblclick=${(ev: MouseEvent) => op.onRowDblClick?.(item, ev)}
            on:dragstart=${(ev: DragEvent) => op.onRowDragStart?.(item, ev)}
            data-id=${item?.name || ""}
        >
            <div style="pointer-events: none; background-color: transparent;" class="c icon"><ui-icon icon=${iconFor(item)} /></div>
            <div style="pointer-events: none; background-color: transparent;" class="c name" title=${item?.name || ""}>${item?.name || ""}</div>
            <div style="pointer-events: none; background-color: transparent;" class="c size">${isFile ? (item?.size ?? "") : ""}</div>
            <div style="pointer-events: none; background-color: transparent;" class="c date">${isFile ? formatDate(item?.lastModified ?? 0) : ""}</div>
            <div style="pointer-events: none; background-color: transparent;" class="c actions">
                <button class="action-btn" title="Copy Path" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); op.onMenuAction?.(item, "copyPath", ev); }}>
                    <ui-icon icon="copy" />
                </button>
                <button class="action-btn" title="Copy" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); op.onMenuAction?.(item, "copy", ev); }}>
                    <ui-icon icon="clipboard" />
                </button>
                <button class="action-btn" title="Delete" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); op.onMenuAction?.(item, "delete", ev); }}>
                    <ui-icon icon="trash" />
                </button>
            </div>
        </div>`;
        bindWith(itemEl, "--order", this.byFirstTwoLetterOrName(item?.name ?? ""), handleStyleChange);
        return itemEl;
    }

    //
    styles = () => fmCss as any;
    render = function () {
        ensureFileManagerIconRuntime();
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
        const fileRows = H`<div class="fm-grid-rows" style="will-change: contents;"></div>`;
        this.#rowsContainer = fileRows as HTMLElement;
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), self.entries);
        queueMicrotask(() => {
            self.bindDropHandlers();
            const root = self.shadowRoot;
            const grids = Array.from(root?.querySelectorAll?.(".fm-grid") || []) as HTMLElement[];
            if (grids.length > 1) {
                const latest = grids.at(-1) as HTMLElement;
                for (const extra of grids) {
                    if (extra !== latest) {
                        extra.remove();
                    }
                }
                self.#rowsContainer = latest.querySelector(".fm-grid-rows") as HTMLElement | null;
            }
            self.syncRows();
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
