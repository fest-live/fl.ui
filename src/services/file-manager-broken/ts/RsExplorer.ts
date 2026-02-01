/**
 * <rs-explorer> Web Component
 *
 * A self-contained file explorer with encapsulated styles.
 * Uses Shadow DOM for style isolation.
 * Now uses unified FileOperative for both OPFS and File System Access API.
 *
 * Usage:
 *   <rs-explorer></rs-explorer>
 *   <rs-explorer path="/" show-hidden></rs-explorer>
 *   <rs-explorer backend="fsa"></rs-explorer>
 *
 * Attributes:
 *   - path: Current directory path
 *   - show-hidden: Show hidden files
 *   - view-mode: "list" | "grid" (default: "list")
 *   - multi-select: Enable multi-selection
 *   - backend: "opfs" | "fsa" | "auto" (default: "auto")
 *
 * Events:
 *   - rs-navigate: Fired when navigating to a directory
 *   - rs-open: Fired when opening a file
 *   - rs-select: Fired when selection changes
 *   - rs-context-menu: Fired on right-click
 */

import { GLitElement, defineElement, property } from "fest/lure";
import { H } from "fest/lure";
import { ref, affected, computed } from "fest/object";

// @ts-ignore - SCSS import
import styles from "../scss/rs-explorer.scss?inline";

// Unified core
import { FileOperative, createFileOperative } from "./Operative";
import { getFileIcon, formatSize, formatDate } from "../utils";
import type { FileEntry, ViewMode, ExplorerState } from "../types";

// Re-export types for consumers
export type { FileEntry as FileItem, ExplorerState };

// ============================================================================
// RS-EXPLORER WEB COMPONENT
// ============================================================================

@defineElement("rs-explorer")
export class RsExplorerElement extends GLitElement() {

    // ========================================================================
    // PROPERTIES (reactive, reflected to attributes)
    // ========================================================================

    @property({ attribute: "path", source: "attr" })
    path: string = "/";

    @property({ attribute: "show-hidden", source: "attr" })
    showHidden: boolean = false;

    @property({ attribute: "view-mode", source: "attr" })
    viewMode: ViewMode = "list";

    @property({ attribute: "multi-select", source: "attr" })
    multiSelect: boolean = false;

    @property({ attribute: "backend", source: "attr" })
    backend: "opfs" | "fsa" | "auto" = "auto";

    @property({ attribute: "loading", source: "attr" })
    loading: boolean = false;

    // ========================================================================
    // INTERNAL STATE
    // ========================================================================

    /** Unified file operative */
    private operative: FileOperative | null = null;

    /** DOM references */
    private listContainer: HTMLElement | null = null;

    // ========================================================================
    // STYLES
    // ========================================================================

    get styles() {
        return styles;
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    protected onInitialize(weak?: WeakRef<any>): this {
        // Create operative with configuration
        this.operative = createFileOperative({
            path: this.path,
            showHidden: this.showHidden,
            multiSelect: this.multiSelect,
            backend: this.backend === "auto" ? "opfs" : this.backend,
            keyboardNav: true,
            historyNav: true,
            dragDrop: true
        });

        // Bind operative to this element
        this.operative.host = this;

        // Sync path changes
        affected(this.operative.pathRef, (path) => {
            this.path = path;
            this.updateBreadcrumb();
            this.dispatchEvent(new CustomEvent("rs-navigate", {
                bubbles: true,
                composed: true,
                detail: { path }
            }));
        });

        // Sync loading state
        affected(this.operative.loading, (loading) => {
            this.loading = loading;
        });

        // Re-render on entries change
        affected(this.operative.entries, () => {
            this.renderItems();
        });

        // Forward selection events
        this.operative.selection.selected;
        affected(this.operative.selection.selected, () => {
            this.updateSelectionUI();
            this.dispatchSelectionEvent();
        });

        // Forward open events
        this.addEventListener("open", (e: Event) => {
            const detail = (e as CustomEvent).detail;
            this.dispatchEvent(new CustomEvent("rs-open", {
                bubbles: true,
                composed: true,
                detail
            }));
        });

        return this;
    }

    protected onRender(weak?: WeakRef<any>): this {
        this.setupKeyboardNavigation();
        // Initial load
        this.operative?.loadPath(this.path);
        return this;
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    render(weak?: WeakRef<any>): HTMLElement {
        const container = H`
            <div class="rs-explorer" part="container" data-view-mode="${this.viewMode}">
                <div class="rs-explorer__toolbar" part="toolbar">
                    <div class="rs-explorer__nav">
                        <button class="rs-explorer__btn" data-action="back" title="Go back" type="button">
                            <ui-icon icon="arrow-left"></ui-icon>
                        </button>
                        <button class="rs-explorer__btn" data-action="forward" title="Go forward" type="button">
                            <ui-icon icon="arrow-right"></ui-icon>
                        </button>
                        <button class="rs-explorer__btn" data-action="up" title="Go up" type="button">
                            <ui-icon icon="arrow-up"></ui-icon>
                        </button>
                        <button class="rs-explorer__btn" data-action="refresh" title="Refresh" type="button">
                            <ui-icon icon="arrow-clockwise"></ui-icon>
                        </button>
                    </div>
                    <div class="rs-explorer__breadcrumb" part="breadcrumb">
                        <span class="rs-explorer__path">${this.path}</span>
                    </div>
                    <div class="rs-explorer__actions">
                        <button class="rs-explorer__btn" data-action="open-folder" title="Open folder" type="button">
                            <ui-icon icon="folder-open"></ui-icon>
                        </button>
                        <button class="rs-explorer__btn" data-action="view-list" title="List view" type="button">
                            <ui-icon icon="list"></ui-icon>
                        </button>
                        <button class="rs-explorer__btn" data-action="view-grid" title="Grid view" type="button">
                            <ui-icon icon="squares-four"></ui-icon>
                        </button>
                    </div>
                </div>
                <div class="rs-explorer__content" part="content">
                    <div class="rs-explorer__list" part="list" tabindex="0">
                        <div class="rs-explorer__loading" part="loading">
                            <div class="rs-explorer__spinner"></div>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="rs-explorer__status" part="status">
                    <span class="rs-explorer__item-count">0 items</span>
                    <span class="rs-explorer__selected-count"></span>
                </div>
            </div>
        ` as HTMLElement;

        this.listContainer = container.querySelector(".rs-explorer__list");
        this.setupEventListeners(container);

        return container;
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    private setupEventListeners(container: HTMLElement): void {
        // Toolbar actions
        container.querySelector(".rs-explorer__toolbar")?.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-action]") as HTMLElement | null;
            if (!button) return;

            const action = button.dataset.action;
            switch (action) {
                case "back": this.operative?.goBack(); break;
                case "forward": this.operative?.goForward(); break;
                case "up": this.operative?.goUp(); break;
                case "refresh": this.operative?.refresh(); break;
                case "open-folder": this.operative?.openFolderPicker(); break;
                case "view-list": this.setViewMode("list"); break;
                case "view-grid": this.setViewMode("grid"); break;
            }
        });

        // List item interactions
        this.listContainer?.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest("[data-item]") as HTMLElement | null;
            if (!item) return;

            const itemPath = item.dataset.path || "";
            this.operative?.selection.handleClick(itemPath, e as MouseEvent);
        });

        // Double-click to open
        this.listContainer?.addEventListener("dblclick", (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest("[data-item]") as HTMLElement | null;
            if (!item) return;

            const itemPath = item.dataset.path || "";
            const fileItem = this.operative?.entries.value.find(i => i.path === itemPath);
            if (fileItem) {
                this.operative?.itemAction(fileItem);
            }
        });

        // Context menu
        this.listContainer?.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const item = target.closest("[data-item]") as HTMLElement | null;
            const itemPath = item?.dataset.path || "";

            this.dispatchEvent(new CustomEvent("rs-context-menu", {
                bubbles: true,
                composed: true,
                detail: {
                    x: (e as MouseEvent).clientX,
                    y: (e as MouseEvent).clientY,
                    item: this.operative?.entries.value.find(i => i.path === itemPath),
                    selected: this.getSelectedItems()
                }
            }));
        });

        // Drag and drop support
        this.listContainer?.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        });

        this.listContainer?.addEventListener("drop", (e) => {
            e.preventDefault();
            this.operative?.onDrop(e);
        });
    }

    private setupKeyboardNavigation(): void {
        this.addEventListener("keydown", (e) => {
            if (!this.listContainer?.contains(document.activeElement) &&
                !this.shadowRoot?.contains(document.activeElement)) return;

            // Forward to operative keyboard handler
            this.operative?.onKeyDown(e);

            // Handle Enter for open
            if (e.key === "Enter") {
                const focusedItem = this.operative?.selection.getFocusedItem();
                if (focusedItem) {
                    e.preventDefault();
                    this.operative?.itemAction(focusedItem);
                }
            }
        });
    }

    // ========================================================================
    // NAVIGATION (Public API)
    // ========================================================================

    async navigate(path: string): Promise<void> {
        if (this.operative) {
            this.operative.pathRef.value = path;
        }
    }

    goBack(): void {
        this.operative?.goBack();
    }

    goForward(): void {
        this.operative?.goForward();
    }

    goUp(): void {
        this.operative?.goUp();
    }

    async openFolderPicker(): Promise<void> {
        await this.operative?.openFolderPicker();
    }

    async refresh(): Promise<void> {
        await this.operative?.refresh();
    }

    // ========================================================================
    // SELECTION (Public API)
    // ========================================================================

    getSelectedItems(): FileEntry[] {
        if (!this.operative) return [];
        return this.operative.entries.value.filter(i =>
            this.operative!.selection.isSelected(i.path)
        );
    }

    clearSelection(): void {
        this.operative?.selection.clear();
    }

    selectAll(): void {
        this.operative?.selection.selectAll();
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    private renderItems(): void {
        if (!this.listContainer || !this.operative) return;

        const items = this.operative.entries.value;

        if (items.length === 0) {
            this.renderEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const item of items) {
            const el = this.createItemElement(item);
            fragment.appendChild(el);
        }

        // Clear loading and add items
        this.listContainer.innerHTML = "";
        this.listContainer.appendChild(fragment);

        // Update status
        this.updateStatus();
    }

    private createItemElement(item: FileEntry): HTMLElement {
        const isSelected = this.operative?.selection.isSelected(item.path) ?? false;
        const icon = item.kind === "directory"
            ? "folder"
            : getFileIcon(item.name);

        const el = H`
            <div class="rs-explorer__item"
                 data-item
                 data-path="${item.path}"
                 data-kind="${item.kind}"
                 draggable="${item.kind === 'file'}"
                 aria-selected="${isSelected}">
                <div class="rs-explorer__item-icon">
                    <ui-icon icon="${icon}" icon-style="duotone"></ui-icon>
                </div>
                <div class="rs-explorer__item-info">
                    <span class="rs-explorer__item-name">${item.name}</span>
                    ${item.kind === "file" ? H`
                        <span class="rs-explorer__item-meta">
                            ${formatSize(item.size)}
                            ${item.lastModified ? ` • ${formatDate(item.lastModified)}` : ""}
                        </span>
                    ` : ""}
                </div>
            </div>
        ` as HTMLElement;

        // Add drag handlers
        if (item.kind === "file") {
            el.addEventListener("dragstart", (e) => this.operative?.onRowDragStart(item, e));
        }

        return el;
    }

    private renderEmptyState(): void {
        if (!this.listContainer) return;

        this.listContainer.innerHTML = "";
        const emptyEl = H`
            <div class="rs-explorer__empty">
                <ui-icon icon="folder-open" icon-style="duotone"></ui-icon>
                <p>No folder selected</p>
                <button class="rs-explorer__btn rs-explorer__btn--primary"
                        data-action="open-folder" type="button">
                    Open Folder
                </button>
            </div>
        ` as HTMLElement;

        emptyEl.querySelector("[data-action='open-folder']")?.addEventListener("click", () => {
            this.operative?.openFolderPicker();
        });

        this.listContainer.appendChild(emptyEl);
    }

    private updateSelectionUI(): void {
        if (!this.listContainer || !this.operative) return;

        this.listContainer.querySelectorAll("[data-item]").forEach(el => {
            const path = (el as HTMLElement).dataset.path || "";
            const isSelected = this.operative!.selection.isSelected(path);
            el.setAttribute("aria-selected", String(isSelected));
        });

        this.updateStatus();
    }

    private updateBreadcrumb(): void {
        const pathEl = this.shadowRoot?.querySelector(".rs-explorer__path");
        if (pathEl) {
            pathEl.textContent = this.path;
        }
    }

    private updateStatus(): void {
        const container = this.shadowRoot?.querySelector(".rs-explorer");
        if (!container || !this.operative) return;

        const itemCount = container.querySelector(".rs-explorer__item-count");
        const selectedCount = container.querySelector(".rs-explorer__selected-count");

        if (itemCount) {
            const count = this.operative.entries.value.length;
            itemCount.textContent = `${count} item${count !== 1 ? "s" : ""}`;
        }

        if (selectedCount) {
            const count = this.operative.selection.count;
            selectedCount.textContent = count > 0 ? `${count} selected` : "";
        }
    }

    private dispatchSelectionEvent(): void {
        const selectedItems = this.getSelectedItems();
        this.dispatchEvent(new CustomEvent("rs-select", {
            bubbles: true,
            composed: true,
            detail: {
                selected: selectedItems,
                paths: selectedItems.map(i => i.path)
            }
        }));
    }

    private setViewMode(mode: ViewMode): void {
        this.viewMode = mode;
        this.setAttribute("view-mode", mode);

        const container = this.shadowRoot?.querySelector(".rs-explorer");
        container?.setAttribute("data-view-mode", mode);
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    disconnectedCallback(): void {
        super.disconnectedCallback?.();
        this.operative?.dispose();
    }
}

// ============================================================================
// TYPE DECLARATION
// ============================================================================

declare global {
    interface HTMLElementTagNameMap {
        "rs-explorer": RsExplorerElement;
    }
}

export default RsExplorerElement;
