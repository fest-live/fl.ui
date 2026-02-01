/**
 * File Operative
 *
 * Core file operations class supporting both OPFS and File System Access API.
 * Unified from RsExplorer and FileManagerContent implementations.
 */

import { observe, ref, affected } from "fest/object";

// OPFS helpers
import {
    openDirectory,
    getMimeTypeByFilename,
    downloadFile,
    writeFile,
    remove,
    uploadFile,
    getFileHandle,
    getDirectoryHandle,
    handleIncomingEntries
} from "fest/lure";

// Local imports
import { SelectionManager, createSelectionManager } from "./SelectionManager";
import { HistoryManager, createHistoryManager } from "./HistoryManager";
import { getParentPath } from "../utils";
import type {
    FileEntry,
    EntryKind,
    ClipboardState,
    ExplorerConfig,
    MenuAction,
    ExplorerEventDetail
} from "../types";

// Legacy export for backward compatibility
export type FileEntryItem = FileEntry;
export type { EntryKind };

// ============================================================================
// CONSTANTS
// ============================================================================

const handleCache = new WeakMap<FileSystemHandle, FileEntry>();

// ============================================================================
// FILE OPERATIVE CLASS
// ============================================================================

export class FileOperative {
    // ========================================================================
    // STATE
    // ========================================================================

    /** Reactive entries list */
    readonly entries = ref<FileEntry[]>([]);

    /** Loading state */
    readonly loading = ref(false);

    /** Error state */
    readonly error = ref("");

    /** Reactive path ref */
    readonly pathRef = ref("/user/");

    /** Selection manager */
    readonly selection: SelectionManager;

    /** History manager */
    readonly history: HistoryManager;

    /** Host element for events */
    host: HTMLElement | null = null;

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    #fsRoot: FileSystemDirectoryHandle | null = null;
    #fsaHandle: FileSystemDirectoryHandle | null = null; // File System Access API handle
    #dirProxy: any = null;
    #loadLock = false;
    #clipboard: ClipboardState | null = null;
    #subscribed: (() => void) | null = null;
    #loaderDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    #backend: "opfs" | "fsa" = "opfs";
    #config: ExplorerConfig;

    // ========================================================================
    // GETTERS/SETTERS
    // ========================================================================

    get path(): string {
        return this.pathRef.value;
    }

    set path(value: string) {
        this.pathRef.value = value;
    }

    get backend(): "opfs" | "fsa" {
        return this.#backend;
    }

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(config: ExplorerConfig = {}) {
        this.#config = {
            path: "/user/",
            showHidden: false,
            multiSelect: false,
            keyboardNav: true,
            historyNav: true,
            dragDrop: true,
            backend: "auto",
            ...config
        };

        // Initialize path
        this.pathRef.value = this.#config.path || "/user/";

        // Initialize selection manager
        this.selection = createSelectionManager({
            multiSelect: this.#config.multiSelect,
            onChange: (detail) => this.dispatchEvent(new CustomEvent("select", {
                bubbles: true,
                composed: true,
                detail
            }))
        });
        this.selection.bindItems(this.entries);

        // Initialize history manager
        this.history = createHistoryManager({
            onNavigate: (path, direction) => {
                if (direction !== "push") {
                    // For back/forward, load without adding to history
                    this.loadPath(path, false);
                }
            }
        });

        // Watch path changes
        affected(this.pathRef, (path) => this.loadPath(path, true));

        // Initialize storage root
        this.initStorage();
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    private async initStorage(): Promise<void> {
        try {
            this.#fsRoot = await navigator?.storage?.getDirectory?.();
        } catch (e) {
            console.warn("[Operative] Failed to get OPFS root:", e);
        }
    }

    // ========================================================================
    // FILE SYSTEM ACCESS API SUPPORT
    // ========================================================================

    /**
     * Open folder using File System Access API picker
     */
    async openFolderPicker(): Promise<boolean> {
        try {
            // @ts-ignore - File System Access API
            const handle = await window.showDirectoryPicker();
            this.#fsaHandle = handle;
            this.#backend = "fsa";

            // Set path and load
            this.pathRef.value = "/" + handle.name;
            this.history.clear("/" + handle.name);

            await this.loadFromFSAHandle(handle);
            return true;
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                console.error("[Operative] Failed to open folder:", err);
                this.error.value = "Failed to open folder";
            }
            return false;
        }
    }

    /**
     * Load directory from File System Access API handle
     */
    private async loadFromFSAHandle(handle: FileSystemDirectoryHandle): Promise<void> {
        this.loading.value = true;
        this.error.value = "";

        try {
            const items: FileEntry[] = [];
            const showHidden = this.#config.showHidden;

            // @ts-ignore - Async iterator
            for await (const [name, entryHandle] of handle.entries()) {
                if (!showHidden && name.startsWith(".")) continue;

                const isFile = entryHandle.kind === "file";
                const item: FileEntry = {
                    name,
                    path: `${this.path}/${name}`.replace(/\/+/g, "/"),
                    kind: isFile ? "file" : "directory",
                    handle: entryHandle
                };

                if (isFile) {
                    try {
                        const file = await (entryHandle as FileSystemFileHandle).getFile();
                        item.size = file.size;
                        item.lastModified = file.lastModified;
                        item.type = file.type;
                        item.file = file;
                    } catch { /* ignore */ }
                }

                items.push(item);
            }

            // Sort: directories first, then by name
            items.sort((a, b) => {
                if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

            this.entries.value = items;
        } catch (err) {
            console.error("[Operative] Failed to load FSA directory:", err);
            this.error.value = (err as Error)?.message || "Failed to load directory";
        } finally {
            this.loading.value = false;
        }
    }

    // ========================================================================
    // OPFS SUPPORT (ORIGINAL)
    // ========================================================================

    /**
     * Load directory from OPFS
     */
    async loadPath(path: string, addToHistory = true): Promise<this> {
        if (this.#loadLock) {
            requestIdleCallback(() => this.loadPath(path, addToHistory), { timeout: 1000 });
            return this;
        }

        this.#loadLock = true;

        try {
            this.loading.value = true;
            this.error.value = "";

            // Add to history if requested
            if (addToHistory) {
                this.history.push(path);
            }

            // Clear selection on navigation
            this.selection.clear();

            // Use FSA if we have a handle
            if (this.#backend === "fsa" && this.#fsaHandle) {
                // Navigate within FSA directory structure
                const relativePath = path.replace(/^\/[^/]+/, "").replace(/^\//, "");
                let targetHandle = this.#fsaHandle;

                if (relativePath) {
                    const parts = relativePath.split("/").filter(Boolean);
                    for (const part of parts) {
                        try {
                            targetHandle = await targetHandle.getDirectoryHandle(part);
                        } catch {
                            this.error.value = `Directory not found: ${part}`;
                            break;
                        }
                    }
                }

                await this.loadFromFSAHandle(targetHandle);
            } else {
                // Use OPFS
                await this.loadFromOPFS(path);
            }
        } catch (e: any) {
            this.error.value = e?.message || String(e || "");
            console.warn("[Operative] Load error:", e);
        } finally {
            this.loading.value = false;
            this.#loadLock = false;
        }

        return this;
    }

    /**
     * Load from OPFS (Origin Private File System)
     */
    private async loadFromOPFS(path: string): Promise<void> {
        // Cleanup previous proxy
        if (this.#dirProxy?.dispose) {
            this.#dirProxy.dispose();
        }

        this.#dirProxy = openDirectory(this.#fsRoot, path, { create: false });
        await this.#dirProxy;

        const loader = async ($map?: Map<string, any>) => {
            const $entries = $map instanceof Map ? $map?.entries?.() : null;
            const handleMap = await Promise.all(
                $entries
                    ? Array.from($entries)
                    : (await Array.fromAsync(await this.#dirProxy?.entries?.() ?? []))
            );

            const entries = (await Promise.all(
                handleMap?.map?.(async ($pair: any) => {
                    return Promise.try(async () => {
                        const [name, handle] = $pair as [string, FileSystemHandle];
                        return handleCache?.getOrInsertComputed?.(handle, async () => {
                            const kind: EntryKind = (handle as any)?.kind || (name?.endsWith?.("/") ? "directory" : "file");
                            const item: FileEntry = observe({
                                name,
                                kind,
                                path: `${path}/${name}`.replace(/\/+/g, "/"),
                                handle
                            });

                            if (kind === "file") {
                                item.type = getMimeTypeByFilename?.(name);
                                Promise.try(async () => {
                                    try {
                                        const f = await (handle as FileSystemFileHandle)?.getFile?.();
                                        item.file = f;
                                        item.size = f?.size;
                                        item.lastModified = f?.lastModified;
                                        item.type = f?.type || item.type;
                                    } catch { /* ignore */ }
                                }).catch?.(console.warn.bind(console));
                            }

                            return item;
                        });
                    })?.catch?.(console.warn.bind(console));
                })
            ))?.filter?.((item: any) => item != null) as FileEntry[];

            if (entries?.length != null && entries?.length >= 0) {
                this.entries.value = entries;
            }
        };

        const debouncedLoader = ($map?: Map<string, any>) => {
            if (this.#loaderDebounceTimer) clearTimeout(this.#loaderDebounceTimer);
            this.#loaderDebounceTimer = setTimeout(() => loader($map), 50);
        };

        // Unsubscribe previous
        if (typeof this.#subscribed === "function") {
            this.#subscribed();
            this.#subscribed = null;
        }

        await loader(await this.#dirProxy?.getMap?.() ?? []);
        this.#subscribed = affected((await this.#dirProxy?.getMap?.() ?? []), debouncedLoader);
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    /**
     * Navigate to parent directory
     */
    goUp(): void {
        const parentPath = getParentPath(this.path);
        if (parentPath !== this.path) {
            this.pathRef.value = parentPath;
        }
    }

    /**
     * Navigate back in history
     */
    goBack(): boolean {
        const path = this.history.back();
        if (path) {
            this.pathRef.value = path;
            return true;
        }
        return false;
    }

    /**
     * Navigate forward in history
     */
    goForward(): boolean {
        const path = this.history.forward();
        if (path) {
            this.pathRef.value = path;
            return true;
        }
        return false;
    }

    /**
     * Refresh current directory
     */
    async refresh(): Promise<void> {
        if (this.#backend === "fsa" && this.#fsaHandle) {
            await this.loadFromFSAHandle(this.#fsaHandle);
        } else if (this.#fsRoot) {
            await this.loadFromOPFS(this.path);
        }
    }

    // ========================================================================
    // ITEM ACTIONS
    // ========================================================================

    /**
     * Open/navigate to item
     */
    itemAction(item: FileEntry): void {
        const detail: ExplorerEventDetail = {
            path: item.path,
            item,
            originalEvent: undefined
        };

        const event = new CustomEvent("open-item", {
            detail,
            bubbles: true,
            composed: true,
            cancelable: true
        });
        this.host?.dispatchEvent(event);

        if (event.defaultPrevented) return;

        if (item.kind === "directory") {
            this.pathRef.value = item.path.endsWith("/") ? item.path : item.path + "/";
        } else {
            this.dispatchEvent(new CustomEvent("open", {
                detail,
                bubbles: true,
                composed: true
            }));
        }
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    onRowClick = (item: FileEntry, ev: MouseEvent): void => {
        this.selection.handleClick(item.path, ev);
    };

    onRowDblClick = (item: FileEntry, ev: MouseEvent): void => {
        ev.preventDefault();
        this.itemAction(item);
    };

    onRowDragStart = (item: FileEntry, ev: DragEvent): void => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.effectAllowed = "copyMove";

        const abs = item.path;
        ev.dataTransfer.setData("text/plain", abs);
        ev.dataTransfer.setData("text/uri-list", abs);

        if (item.file) {
            ev.dataTransfer.setData(
                "DownloadURL",
                `${item.file.type}:${item.file.name}:${URL.createObjectURL(item.file)}`
            );
            ev.dataTransfer.items.add(item.file);
        }
    };

    /**
     * Handle keyboard events
     */
    onKeyDown = (ev: KeyboardEvent): void => {
        // Selection navigation
        const focusedItem = this.selection.handleKeyboard(ev);

        // Enter to open
        if (ev.key === "Enter" && focusedItem) {
            ev.preventDefault();
            this.itemAction(focusedItem);
        }

        // Backspace to go up
        if (ev.key === "Backspace") {
            ev.preventDefault();
            this.goUp();
        }

        // Ctrl+V to paste
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "v") {
            ev.preventDefault();
            this.requestPaste();
        }
    };

    // ========================================================================
    // CONTEXT MENU ACTIONS
    // ========================================================================

    async onMenuAction(item: FileEntry | null, actionId: MenuAction, ev?: MouseEvent): Promise<void> {
        try {
            const abs = item?.path || this.path;

            switch (actionId) {
                case "open":
                    if (item) this.itemAction(item);
                    break;

                case "view":
                    this.dispatchEvent(new CustomEvent("context-action", {
                        bubbles: true,
                        composed: true,
                        detail: { action: "view", item, path: abs }
                    }));
                    break;

                case "attach-workcenter":
                    this.dispatchEvent(new CustomEvent("context-action", {
                        bubbles: true,
                        composed: true,
                        detail: { action: "attach-workcenter", item, path: abs }
                    }));
                    break;

                case "download":
                    await this.downloadItem(item);
                    break;

                case "delete":
                    if (item) await remove(this.#fsRoot, abs);
                    break;

                case "rename":
                    if (item?.kind === "file") {
                        const newName = prompt("Rename to:", item.name);
                        if (newName && newName !== item.name) {
                            await this.renameFile(abs, newName);
                        }
                    }
                    break;

                case "copyPath":
                case "copy":
                    this.#clipboard = { items: [abs], cut: false };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { /* ignore */ }
                    break;

                case "cut":
                    this.#clipboard = { items: [abs], cut: true };
                    break;

                case "paste":
                    await this.requestPaste();
                    break;
            }
        } catch (e: any) {
            console.warn("[Operative] Menu action error:", e);
            this.error.value = e?.message || String(e || "");
        }
    }

    // ========================================================================
    // FILE OPERATIONS
    // ========================================================================

    private async downloadItem(item: FileEntry | null): Promise<void> {
        if (!item) return;

        try {
            if (item.kind === "file") {
                await downloadFile(await getFileHandle(this.#fsRoot, item.path, { create: false }));
            } else {
                await downloadFile(await getDirectoryHandle(this.#fsRoot, item.path, { create: false }));
            }
        } catch (e) {
            console.warn("[Operative] Download error:", e);
        }
    }

    private async renameFile(oldPath: string, newName: string): Promise<void> {
        const fromHandle = await getFileHandle(this.#fsRoot, oldPath, { create: false });
        const file = await fromHandle?.getFile?.();
        if (!file) return;

        const newPath = this.path + newName;
        await writeFile(this.#fsRoot, newPath, file);
        await remove(this.#fsRoot, oldPath);
    }

    async requestUpload(): Promise<void> {
        try {
            await uploadFile(this.path, null);
        } catch (e) {
            console.warn("[Operative] Upload error:", e);
        }
    }

    async requestPaste(): Promise<void> {
        try {
            // Try modern Async Clipboard API
            try {
                // @ts-ignore
                const clipboardItems = await navigator.clipboard.read();
                if (clipboardItems?.length > 0) {
                    await handleIncomingEntries(clipboardItems, this.path);
                    return;
                }
            } catch { /* fallback */ }

            // Try system clipboard text
            let systemText = "";
            try {
                systemText = await navigator.clipboard?.readText?.() || "";
            } catch { /* ignore */ }

            // Check internal clipboard
            const internalItems = this.#clipboard?.items || [];

            if (systemText) {
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? systemText : ""
                }, this.path);
                return;
            }

            if (internalItems.length > 0) {
                const txt = internalItems.join("\n");
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? txt : ""
                }, this.path);

                if (this.#clipboard?.cut) {
                    for (const src of internalItems) {
                        await remove(this.#fsRoot, src);
                    }
                    this.#clipboard = null;
                }
            }
        } catch (e) {
            console.warn("[Operative] Paste error:", e);
        }
    }

    async requestUse(): Promise<void> {
        // TODO: Implement file usage/association
    }

    // ========================================================================
    // DRAG & DROP / CLIPBOARD
    // ========================================================================

    onPaste(ev: ClipboardEvent): void {
        ev.preventDefault();
        const data = ev.clipboardData || (ev as any).dataTransfer;
        if (data) {
            handleIncomingEntries(data, this.path);
            return;
        }
        this.requestPaste();
    }

    onCopy(ev: ClipboardEvent): void {
        const selectedItems = this.selection.paths;
        if (selectedItems.length > 0) {
            this.#clipboard = { items: selectedItems, cut: false };
            try {
                ev.clipboardData?.setData("text/plain", selectedItems.join("\n"));
            } catch { /* ignore */ }
        }
    }

    async onDrop(ev: DragEvent): Promise<void> {
        ev.preventDefault();
        const data = (ev as any).clipboardData || ev.dataTransfer;
        if (data) {
            await handleIncomingEntries(data, this.path);
        }
    }

    // ========================================================================
    // UTILITY
    // ========================================================================

    private dispatchEvent(event: CustomEvent): void {
        this.host?.dispatchEvent(event);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        if (this.#subscribed) {
            this.#subscribed();
            this.#subscribed = null;
        }
        if (this.#dirProxy?.dispose) {
            this.#dirProxy.dispose();
        }
        if (this.#loaderDebounceTimer) {
            clearTimeout(this.#loaderDebounceTimer);
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createFileOperative(config?: ExplorerConfig): FileOperative {
    return new FileOperative(config);
}

export default FileOperative;
