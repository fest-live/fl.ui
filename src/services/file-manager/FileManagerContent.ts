/**
 * File Manager Content Component
 *
 * Unified file listing component with grid view.
 * Uses FileOperative for file operations and shared utilities.
 */

import { property, defineElement, H, C, bindWith, initGlobalClipboard } from "fest/lure";
import { addEvent, handleStyleChange, isInFocus, preloadStyle } from "fest/dom";
import { computed, propRef, ref } from "fest/object";

// Base element
import UIElement from "@fl-ui/base/UIElement";

// Local modules
import type { FileEntry } from "./types";
import { FileOperative } from "./Operative";
import { createItemCtxMenu } from "./ContextMenu";
import { iconFor, formatDate, getAlphaOrder } from "./utils";

// Styles
// @ts-ignore
import fmCss from "./scss/FileManagerContent.scss?inline";

// ============================================================================
// INITIALIZATION
// ============================================================================

initGlobalClipboard();
const styled = preloadStyle(fmCss);

// ============================================================================
// FILE MANAGER CONTENT COMPONENT
// ============================================================================

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    // ========================================================================
    // PROPERTIES
    // ========================================================================

    @property({ source: "query-shadow", name: ".fm-grid-rows" })
    gridRowsEl?: HTMLElement;

    @property({ source: "query-shadow", name: ".fm-grid" })
    gridEl?: HTMLElement;

    // ========================================================================
    // STATE
    // ========================================================================

    /** File operative instance */
    public operativeInstance: FileOperative | null = null;

    /** Reactive reference to operative */
    public operativeInstanceRef = ref<FileOperative | null>(null);

    // ========================================================================
    // GETTERS / SETTERS
    // ========================================================================

    get path(): string {
        return this.operativeInstance?.path || "";
    }

    set path(value: string) {
        if (this.operativeInstance) {
            this.operativeInstance.path = value;
        }
    }

    get pathRef() {
        return this.operativeInstance?.pathRef || ref("/user/");
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    constructor() {
        super();
        this.operativeInstance ??= new FileOperative({ host: this as any });
        this.operativeInstance.host = this as any;
    }

    onInitialize(): void {
        super.onInitialize();
        // Additional initialization can be added here
    }

    // ========================================================================
    // DROP HANDLERS
    // ========================================================================

    protected bindDropHandlers(): void {
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
    }

    // ========================================================================
    // CLIPBOARD HANDLERS
    // ========================================================================

    public onPaste(ev: ClipboardEvent): void {
        if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
            if (this.operativeInstance) {
                this.operativeInstance.onPaste(ev);
            }
        }
    }

    public onCopy(ev: ClipboardEvent): void {
        if (isInFocus(ev?.target as HTMLElement, "ui-file-manager-content, ui-file-manager")) {
            if (this.operativeInstance) {
                this.operativeInstance.onCopy(ev);
            }
        }
    }

    // ========================================================================
    // UTILITY
    // ========================================================================

    /**
     * Get sort order by first two letters of name
     */
    byFirstTwoLetterOrName(name: string): number {
        return getAlphaOrder(name);
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    styles = () => styled;

    render = function (this: FileManagerContent) {
        const self: any = this;

        // Grid header
        const fileHeader = H`<div class="fm-grid-header">
            <div class="c icon">@</div>
            <div class="c name">Name</div>
            <div class="c size">Size</div>
            <div class="c date">Modified</div>
            <div class="c actions">Actions</div>
        </div>`;

        const operative = this.operativeInstance;
        if (!operative) return "";

        // Create list element for each file entry
        const makeListElement = (item: FileEntry) => {
            const isFile = item?.kind === "file" || item?.file;

            const itemEl = H`<div draggable="${isFile}" data-id=${propRef(item, "name")} class="row c2-surface"
                on:click=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowClick?.(item, ev))}
                on:dblclick=${(ev: MouseEvent) => requestAnimationFrame(() => operative.onRowDblClick?.(item, ev))}
                on:dragstart=${(ev: DragEvent) => operative.onRowDragStart?.(item, ev)}
            >
                <div style="pointer-events: none; background-color: transparent;" class="c icon">
                    <ui-icon icon=${computed(item, () => iconFor(item))} />
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c name" title=${propRef(item, "name")}>
                    ${propRef(item, "name")}
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c size">
                    ${isFile ? propRef(item, "size") : ""}
                </div>
                <div style="pointer-events: none; background-color: transparent;" class="c date">
                    ${isFile ? computed(propRef(item, "lastModified"), (val) => formatDate(val ?? 0)) : ""}
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

            // Bind CSS order for alphabetical sorting
            bindWith(
                itemEl,
                "--order",
                computed(propRef(item, "name"), (val) => self.byFirstTwoLetterOrName(val ?? "")),
                handleStyleChange
            );

            return itemEl;
        };

        // Render entries reactively
        let fileRows: HTMLElement | null = null;
        const renderedEntries = C(computed(operative.entries, (v) => {
            if (v?.length != null && v?.length >= 0) {
                if (fileRows != null) {
                    fileRows.innerHTML = "";
                }
                const fragment = document.createDocumentFragment();
                fragment.append(
                    ...(v?.map?.((file: FileEntry) => makeListElement(file))?.filter?.(el => el != null) || [])
                );
                return fragment;
            }
        }));

        // Create rows container
        fileRows = H`<div class="fm-grid-rows" style="will-change: contents;">${renderedEntries}</div>` as HTMLElement;
        (renderedEntries as any).boundParent = fileRows;

        // Attach context menu
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), operative.entries);

        // Bind drop handlers
        queueMicrotask(() => this.bindDropHandlers());

        // Final grid
        const rendered = H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;

        return rendered;
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FileManagerContent;
