/**
 * File Manager Content Component
 *
 * Renders the file list/grid using the unified FileOperative.
 * Uses OPFS by default for storage.
 */

import { property, defineElement, H, C, bindWith, initGlobalClipboard } from "fest/lure";
import { addEvent, handleStyleChange, isInFocus, preloadStyle } from "fest/dom";
import { computed, propRef, ref, affected } from "fest/object";

//
import UIElement from "@fl-ui/base/UIElement";

// @ts-ignore
import fmCss from "../scss/FileManagerContent.scss?inline";

// Unified core
import { FileOperative, createFileOperative } from "./Operative";
import { createItemCtxMenu } from "./ContextMenu";
import { iconFor, formatSize, formatDate } from "../utils";
import type { FileEntry } from "../types";

// Legacy re-export
export type { FileEntry as FileEntryItem };

//
initGlobalClipboard();

//
const styled = preloadStyle(fmCss);

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    /** Unified file operative */
    public operativeInstance: FileOperative | null = null;
    public operativeInstanceRef = ref<FileOperative | null>(null);

    //
    get path() { return this.operativeInstance?.path || ""; }
    set path(value: string) { if (this.operativeInstance) this.operativeInstance.path = value; }
    get pathRef() { return this.operativeInstance?.pathRef || ref("/user/"); }

    //
    onInitialize() {
        super.onInitialize();

        // Create operative if not exists
        if (!this.operativeInstance) {
            this.operativeInstance = createFileOperative({
                path: "/user/",
                backend: "opfs",
                multiSelect: true,
                keyboardNav: true,
                historyNav: true,
                dragDrop: true
            });
            this.operativeInstance.host = this as any;
            this.operativeInstanceRef.value = this.operativeInstance;
        }
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
                this.operativeInstance?.onDrop?.(ev);
            }
        });

        // Keyboard navigation
        addEvent(container, "keydown", (ev: KeyboardEvent) => {
            this.operativeInstance?.onKeyDown(ev);
        });
    }

    //
    public onPaste(ev: ClipboardEvent) {
        if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
            this.operativeInstance?.onPaste(ev);
        }
    }

    //
    public onCopy(ev: ClipboardEvent) {
        if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
            this.operativeInstance?.onCopy(ev);
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
        </div>`;

        //
        const operative = self.operativeInstance;
        if (!operative) return "";

        //
        const makeListElement = (item: FileEntry) => {
            const isFile = item?.kind === "file" || item?.file;

            const itemEl = H`<div draggable="${isFile}" data-id=${propRef(item, "name")} class="row c2-surface"
                on:click=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowClick?.(item, ev))}
                on:dblclick=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowDblClick?.(item, ev))}
                on:dragstart=${(ev: DragEvent) => operative.onRowDragStart?.(item, ev)}
                data-path=${propRef(item, "path")}
            >
                <div style="pointer-events: none; background-color: transparent;" class="c icon">
                    <ui-icon icon=${computed(item, () => iconFor(item))} />
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c name" title=${propRef(item, "name")}>
                    ${propRef(item, "name")}
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c size">
                    ${isFile ? computed(propRef(item, "size"), (val) => formatSize(val)) : ""}
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c date">
                    ${isFile ? computed(propRef(item, "lastModified"), (val) => formatDate(val)) : ""}
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c actions">
                    <button class="action-btn" title="Copy Path" on:click=${(ev: MouseEvent) => {
                        ev.stopPropagation();
                        requestAnimationFrame(() => operative.onMenuAction?.(item, "copyPath", ev));
                    }}>
                        <ui-icon icon="copy" />
                    </button>
                    <button class="action-btn" title="Copy" on:click=${(ev: MouseEvent) => {
                        ev.stopPropagation();
                        requestAnimationFrame(() => operative.onMenuAction?.(item, "copy", ev));
                    }}>
                        <ui-icon icon="clipboard" />
                    </button>
                    <button class="action-btn" title="Delete" on:click=${(ev: MouseEvent) => {
                        ev.stopPropagation();
                        requestAnimationFrame(() => operative.onMenuAction?.(item, "delete", ev));
                    }}>
                        <ui-icon icon="trash" />
                    </button>
                </div>
            </div>`;

            //
            bindWith(itemEl, "--order", computed(propRef(item, "name"), (val) => self.byFirstTwoLetterOrName(val ?? "")), handleStyleChange);

            // Selection state binding
            const updateSelection = () => {
                const isSelected = operative.selection?.isSelected(item.path);
                itemEl.setAttribute("aria-selected", String(isSelected));
                itemEl.classList.toggle("selected", isSelected);
            };

            // Update on selection changes
            if (operative.selection?.selected) {
                affected(operative.selection.selected, updateSelection);
            }

            return itemEl;
        };

        //
        let fileRows: any = null;
        const renderedEntries = C(computed(operative.entries, (v) => {
            if (v?.length != null && v?.length >= 0) {
                if (fileRows != null) fileRows.innerHTML = ``;
                const fragment = document.createDocumentFragment();
                fragment.append(...v?.map?.((file: FileEntry) => makeListElement(file))?.filter?.(el => el != null) || []);
                return fragment;
            }
        }));

        //
        fileRows = H`<div class="fm-grid-rows" style="will-change: contents;" tabindex="0">${renderedEntries}</div>`;
        renderedEntries.boundParent = fileRows;
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), operative.entries);
        queueMicrotask(() => self.bindDropHandlers());

        //
        const rendered = H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;

        return rendered;
    };

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Navigate to parent directory
     */
    goUp(): void {
        this.operativeInstance?.goUp();
    }

    /**
     * Navigate back in history
     */
    goBack(): void {
        this.operativeInstance?.goBack();
    }

    /**
     * Navigate forward in history
     */
    goForward(): void {
        this.operativeInstance?.goForward();
    }

    /**
     * Refresh current directory
     */
    refresh(): void {
        this.operativeInstance?.refresh();
    }

    /**
     * Get selected items
     */
    getSelectedItems(): FileEntry[] {
        if (!this.operativeInstance) return [];
        return this.operativeInstance.entries.value.filter(item =>
            this.operativeInstance!.selection.isSelected(item.path)
        );
    }

    /**
     * Clear selection
     */
    clearSelection(): void {
        this.operativeInstance?.selection.clear();
    }

    /**
     * Select all items
     */
    selectAll(): void {
        this.operativeInstance?.selection.selectAll();
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    disconnectedCallback(): void {
        super.disconnectedCallback?.();
        this.operativeInstance?.dispose();
    }
}

//
export default FileManagerContent;
