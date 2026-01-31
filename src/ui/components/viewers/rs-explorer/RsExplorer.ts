/**
 * <rs-explorer> Web Component
 * 
 * A self-contained file explorer with encapsulated styles.
 * Uses Shadow DOM for style isolation.
 * 
 * Usage:
 *   <rs-explorer></rs-explorer>
 *   <rs-explorer path="/" show-hidden></rs-explorer>
 * 
 * Attributes:
 *   - path: Current directory path
 *   - show-hidden: Show hidden files
 *   - view-mode: "list" | "grid" (default: "list")
 *   - multi-select: Enable multi-selection
 * 
 * Events:
 *   - rs-navigate: Fired when navigating to a directory
 *   - rs-open: Fired when opening a file
 *   - rs-select: Fired when selection changes
 *   - rs-context-menu: Fired on right-click
 */

import { GLitElement, defineElement, property } from "fest/lure";
import { H, M } from "fest/lure";
import { ref, subscribe, makeReactive } from "fest/object";

// @ts-ignore - SCSS import
import styles from "./rs-explorer.scss?inline";

// ============================================================================
// TYPES
// ============================================================================

export interface FileItem {
    name: string;
    path: string;
    kind: "file" | "directory";
    size?: number;
    modified?: Date;
    type?: string;
    handle?: FileSystemHandle;
    file?: File;
}

export interface ExplorerState {
    items: FileItem[];
    selected: Set<string>;
    loading: boolean;
    error: string | null;
}

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
    viewMode: "list" | "grid" = "list";
    
    @property({ attribute: "multi-select", source: "attr" })
    multiSelect: boolean = false;
    
    @property({ attribute: "loading", source: "attr" })
    loading: boolean = false;

    // ========================================================================
    // INTERNAL STATE
    // ========================================================================
    
    private state = makeReactive<ExplorerState>({
        items: [],
        selected: new Set(),
        loading: false,
        error: null
    });
    
    private listContainer: HTMLElement | null = null;
    private directoryHandle: FileSystemDirectoryHandle | null = null;
    private history: string[] = [];
    private historyIndex: number = -1;

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
        this.setupKeyboardNavigation();
        return this;
    }

    protected onRender(weak?: WeakRef<any>): this {
        // Initial load
        this.refresh();
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
                case "back": this.goBack(); break;
                case "forward": this.goForward(); break;
                case "up": this.goUp(); break;
                case "refresh": this.refresh(); break;
                case "open-folder": this.openFolderPicker(); break;
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
            
            if (e.ctrlKey || e.metaKey) {
                this.toggleSelection(itemPath);
            } else if (e.shiftKey && this.multiSelect) {
                this.rangeSelect(itemPath);
            } else {
                this.selectItem(itemPath);
            }
        });

        // Double-click to open
        this.listContainer?.addEventListener("dblclick", (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest("[data-item]") as HTMLElement | null;
            if (!item) return;

            const itemPath = item.dataset.path || "";
            const fileItem = this.state.items.find(i => i.path === itemPath);
            if (fileItem) {
                this.openItem(fileItem);
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
                    item: this.state.items.find(i => i.path === itemPath)
                }
            }));
        });
    }

    private setupKeyboardNavigation(): void {
        this.addEventListener("keydown", (e) => {
            if (!this.listContainer?.contains(document.activeElement)) return;

            switch (e.key) {
                case "Enter":
                    const selectedItem = this.state.items.find(i => 
                        this.state.selected.has(i.path)
                    );
                    if (selectedItem) this.openItem(selectedItem);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    this.moveSelection(1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    this.moveSelection(-1);
                    break;
                case "Backspace":
                    this.goUp();
                    break;
            }
        });
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================
    
    async navigate(path: string): Promise<void> {
        // Add to history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(path);
        this.historyIndex = this.history.length - 1;
        
        this.path = path;
        await this.loadDirectory(path);
        
        this.dispatchEvent(new CustomEvent("rs-navigate", {
            bubbles: true,
            composed: true,
            detail: { path }
        }));
    }

    goBack(): void {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.path = this.history[this.historyIndex];
            this.loadDirectory(this.path);
        }
    }

    goForward(): void {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.path = this.history[this.historyIndex];
            this.loadDirectory(this.path);
        }
    }

    goUp(): void {
        const parentPath = this.path.split("/").slice(0, -1).join("/") || "/";
        this.navigate(parentPath);
    }

    // ========================================================================
    // FILE OPERATIONS
    // ========================================================================
    
    async openFolderPicker(): Promise<void> {
        try {
            // @ts-ignore - File System Access API
            const handle = await window.showDirectoryPicker();
            this.directoryHandle = handle;
            this.path = "/" + handle.name;
            await this.loadFromHandle(handle);
            
            // Update history
            this.history = [this.path];
            this.historyIndex = 0;
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                console.error("[Explorer] Failed to open folder:", err);
                this.state.error = "Failed to open folder";
            }
        }
    }

    async refresh(): Promise<void> {
        if (this.directoryHandle) {
            await this.loadFromHandle(this.directoryHandle);
        } else {
            // Show empty state or prompt
            this.renderEmptyState();
        }
    }

    private async loadDirectory(path: string): Promise<void> {
        // For now, we rely on the File System Access API
        // which requires user interaction to select a folder
        if (this.directoryHandle) {
            await this.loadFromHandle(this.directoryHandle);
        }
    }

    private async loadFromHandle(handle: FileSystemDirectoryHandle): Promise<void> {
        this.state.loading = true;
        this.state.error = null;
        this.loading = true;

        try {
            const items: FileItem[] = [];
            
            // @ts-ignore - Async iterator
            for await (const [name, entryHandle] of handle.entries()) {
                if (!this.showHidden && name.startsWith(".")) continue;

                const isFile = entryHandle.kind === "file";
                const item: FileItem = {
                    name,
                    path: `${this.path}/${name}`,
                    kind: isFile ? "file" : "directory",
                    handle: entryHandle
                };

                if (isFile) {
                    try {
                        const file = await (entryHandle as FileSystemFileHandle).getFile();
                        item.size = file.size;
                        item.modified = new Date(file.lastModified);
                        item.type = file.type;
                        item.file = file;
                    } catch {
                        // Ignore file read errors
                    }
                }

                items.push(item);
            }

            // Sort: directories first, then by name
            items.sort((a, b) => {
                if (a.kind !== b.kind) {
                    return a.kind === "directory" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

            this.state.items = items;
            this.renderItems();
        } catch (err) {
            console.error("[Explorer] Failed to load directory:", err);
            this.state.error = "Failed to load directory";
        } finally {
            this.state.loading = false;
            this.loading = false;
        }
    }

    // ========================================================================
    // SELECTION
    // ========================================================================
    
    selectItem(path: string): void {
        this.state.selected.clear();
        this.state.selected.add(path);
        this.updateSelectionUI();
        this.dispatchSelectionEvent();
    }

    toggleSelection(path: string): void {
        if (this.state.selected.has(path)) {
            this.state.selected.delete(path);
        } else {
            if (!this.multiSelect) {
                this.state.selected.clear();
            }
            this.state.selected.add(path);
        }
        this.updateSelectionUI();
        this.dispatchSelectionEvent();
    }

    rangeSelect(path: string): void {
        const items = this.state.items;
        const selectedArr = Array.from(this.state.selected);
        const lastSelected = selectedArr[selectedArr.length - 1];
        
        if (!lastSelected) {
            this.selectItem(path);
            return;
        }

        const startIdx = items.findIndex(i => i.path === lastSelected);
        const endIdx = items.findIndex(i => i.path === path);
        
        if (startIdx === -1 || endIdx === -1) return;

        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        
        for (let i = from; i <= to; i++) {
            this.state.selected.add(items[i].path);
        }
        
        this.updateSelectionUI();
        this.dispatchSelectionEvent();
    }

    private moveSelection(delta: number): void {
        const items = this.state.items;
        const selectedArr = Array.from(this.state.selected);
        const currentPath = selectedArr[selectedArr.length - 1];
        
        let currentIdx = items.findIndex(i => i.path === currentPath);
        if (currentIdx === -1) currentIdx = -1;

        const newIdx = Math.max(0, Math.min(items.length - 1, currentIdx + delta));
        if (items[newIdx]) {
            this.selectItem(items[newIdx].path);
        }
    }

    private dispatchSelectionEvent(): void {
        const selectedItems = this.state.items.filter(i => 
            this.state.selected.has(i.path)
        );
        
        this.dispatchEvent(new CustomEvent("rs-select", {
            bubbles: true,
            composed: true,
            detail: { selected: selectedItems }
        }));
    }

    // ========================================================================
    // ITEM OPERATIONS
    // ========================================================================
    
    private openItem(item: FileItem): void {
        if (item.kind === "directory") {
            this.navigate(item.path);
        } else {
            this.dispatchEvent(new CustomEvent("rs-open", {
                bubbles: true,
                composed: true,
                detail: { item }
            }));
        }
    }

    // ========================================================================
    // RENDERING
    // ========================================================================
    
    private renderItems(): void {
        if (!this.listContainer) return;

        const items = this.state.items;
        
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

    private createItemElement(item: FileItem): HTMLElement {
        const isSelected = this.state.selected.has(item.path);
        const icon = item.kind === "directory" 
            ? "folder" 
            : this.getFileIcon(item.name);
        
        const el = H`
            <div class="rs-explorer__item" 
                 data-item 
                 data-path="${item.path}"
                 data-kind="${item.kind}"
                 aria-selected="${isSelected}">
                <div class="rs-explorer__item-icon">
                    <ui-icon icon="${icon}" icon-style="duotone"></ui-icon>
                </div>
                <div class="rs-explorer__item-info">
                    <span class="rs-explorer__item-name">${item.name}</span>
                    ${item.kind === "file" ? H`
                        <span class="rs-explorer__item-meta">
                            ${this.formatSize(item.size)}
                        </span>
                    ` : ""}
                </div>
            </div>
        ` as HTMLElement;

        return el;
    }

    private renderEmptyState(): void {
        if (!this.listContainer) return;

        this.listContainer.innerHTML = "";
        this.listContainer.appendChild(H`
            <div class="rs-explorer__empty">
                <ui-icon icon="folder-open" icon-style="duotone"></ui-icon>
                <p>No folder selected</p>
                <button class="rs-explorer__btn rs-explorer__btn--primary" 
                        data-action="open-folder" type="button">
                    Open Folder
                </button>
            </div>
        ` as HTMLElement);
    }

    private updateSelectionUI(): void {
        if (!this.listContainer) return;

        this.listContainer.querySelectorAll("[data-item]").forEach(el => {
            const path = (el as HTMLElement).dataset.path || "";
            const isSelected = this.state.selected.has(path);
            el.setAttribute("aria-selected", String(isSelected));
        });

        this.updateStatus();
    }

    private updateStatus(): void {
        const container = this.shadowRoot?.querySelector(".rs-explorer");
        if (!container) return;

        const itemCount = container.querySelector(".rs-explorer__item-count");
        const selectedCount = container.querySelector(".rs-explorer__selected-count");
        const pathEl = container.querySelector(".rs-explorer__path");

        if (itemCount) {
            const count = this.state.items.length;
            itemCount.textContent = `${count} item${count !== 1 ? "s" : ""}`;
        }

        if (selectedCount) {
            const count = this.state.selected.size;
            selectedCount.textContent = count > 0 ? `${count} selected` : "";
        }

        if (pathEl) {
            pathEl.textContent = this.path;
        }
    }

    private setViewMode(mode: "list" | "grid"): void {
        this.viewMode = mode;
        this.setAttribute("view-mode", mode);
        
        const container = this.shadowRoot?.querySelector(".rs-explorer");
        container?.setAttribute("data-view-mode", mode);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    private getFileIcon(filename: string): string {
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        
        const iconMap: Record<string, string> = {
            // Documents
            md: "file-text",
            txt: "file-text",
            pdf: "file-pdf",
            doc: "file-doc",
            docx: "file-doc",
            
            // Images
            png: "file-image",
            jpg: "file-image",
            jpeg: "file-image",
            gif: "file-image",
            svg: "file-image",
            webp: "file-image",
            
            // Code
            js: "file-js",
            ts: "file-ts",
            jsx: "file-jsx",
            tsx: "file-tsx",
            html: "file-html",
            css: "file-css",
            scss: "file-css",
            json: "file-json",
            
            // Archives
            zip: "file-zip",
            tar: "file-zip",
            gz: "file-zip",
            rar: "file-zip",
            
            // Media
            mp3: "file-audio",
            wav: "file-audio",
            mp4: "file-video",
            mov: "file-video",
            webm: "file-video"
        };

        return iconMap[ext] || "file";
    }

    private formatSize(bytes?: number): string {
        if (bytes === undefined) return "";
        
        const units = ["B", "KB", "MB", "GB"];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    getSelectedItems(): FileItem[] {
        return this.state.items.filter(i => this.state.selected.has(i.path));
    }

    clearSelection(): void {
        this.state.selected.clear();
        this.updateSelectionUI();
    }

    selectAll(): void {
        this.state.items.forEach(i => this.state.selected.add(i.path));
        this.updateSelectionUI();
        this.dispatchSelectionEvent();
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
