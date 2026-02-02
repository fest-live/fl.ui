/**
 * File Operative - Core file operations controller
 *
 * Unified file operations logic for OPFS-based file management.
 * Handles path navigation, file loading, clipboard operations, and events.
 */

import { observe, ref, affected } from "fest/object";
import type { FileEntry, EntryKind, ClipboardState } from "./types";

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

// Re-export types for backward compatibility
export type { FileEntry, EntryKind };

/** @deprecated Use FileEntry from types.ts instead */
export type FileEntryItem = FileEntry;

// ============================================================================
// HANDLE CACHE
// ============================================================================

const handleCache = new WeakMap<any, any>();

// ============================================================================
// FILE OPERATIVE CLASS
// ============================================================================

export interface FileOperativeOptions {
    /** Initial path */
    initialPath?: string;
    /** Enable extended menu actions (view, attach-workcenter) */
    extendedActions?: boolean;
    /** Host element for event dispatch */
    host?: HTMLElement | null;
}

export class FileOperative {
    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    #entries = ref<FileEntry[]>([]);
    #loading = ref(false);
    #error = ref("");
    #fsRoot: FileSystemDirectoryHandle | null = null;
    #dirProxy: any = null;
    #loadLock = false;
    #clipboard: ClipboardState | null = null;
    #subscribed: (() => void) | null = null;
    #loaderDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    // ========================================================================
    // PUBLIC STATE
    // ========================================================================

    /** Host element for event dispatch */
    public host: HTMLElement | null = null;

    /** Current path (reactive) */
    public pathRef = ref("/user/");

    /** Whether extended actions are enabled */
    public extendedActions: boolean = false;

    // ========================================================================
    // GETTERS / SETTERS
    // ========================================================================

    get path(): string { return this.pathRef.value; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value; }

    get entries() { return this.#entries; }
    get loading() { return this.#loading; }
    get error() { return this.#error; }

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(options: FileOperativeOptions = {}) {
        const { initialPath = "/user/", extendedActions = false, host = null } = options;

        this.#entries = ref<FileEntry[]>([]);
        this.pathRef = ref(initialPath);
        this.extendedActions = extendedActions;
        this.host = host;

        // Subscribe to path changes
        affected(this.pathRef, (path) => this.loadPath(path));

        // Get OPFS root
        navigator?.storage?.getDirectory?.()?.then?.((h) => {
            this.#fsRoot = h;
        });
    }

    // ========================================================================
    // ITEM ACTIONS
    // ========================================================================

    /**
     * Execute item action (navigate directory or open file)
     */
    itemAction(item: FileEntry): void {
        const detail = {
            path: (this.path || "/user/") + item?.name,
            item,
            originalEvent: null
        };

        // Dispatch open-item event (cancelable)
        const event = new CustomEvent("open-item", {
            detail,
            bubbles: true,
            composed: true,
            cancelable: true
        });
        this.host?.dispatchEvent(event);

        if (event.defaultPrevented) return;

        // Handle navigation or file open
        if (item?.kind === "directory") {
            // Ensure proper path formatting: ensure trailing slash
            const currentPath = this.path || "/user/";
            const cleanPath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
            const next = cleanPath + item?.name + "/";
            this.path = next;
        } else {
            const openEvent = new CustomEvent("open", {
                detail,
                bubbles: true,
                composed: true
            });
            this.host?.dispatchEvent(openEvent);
        }
    }

    // ========================================================================
    // PATH LOADING
    // ========================================================================

    /**
     * Load directory contents at path
     */
    async loadPath(path: string): Promise<this> {
        // Normalize path
        const normalizedPath = path?.endsWith?.("/") ? path : (path || "/user/") + "/";

        // Prevent concurrent loads
        if (this.#loadLock) {
            requestIdleCallback(() => this.loadPath(normalizedPath), { timeout: 1000 });
            return this;
        }
        this.#loadLock = true;

        try {
            this.#loading.value = true;
            this.#error.value = "";

            // Dispose previous directory proxy
            if (this.#dirProxy?.dispose) {
                this.#dirProxy.dispose();
            }

            // Open directory
            this.#dirProxy = openDirectory(this.#fsRoot, normalizedPath, { create: false });
            await this.#dirProxy;

            // Entry loader function
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

                            // @ts-ignore - using getOrInsertComputed for caching
                            return handleCache?.getOrInsertComputed?.(handle, async () => {
                                const kind: EntryKind = (handle as any)?.kind || (name?.endsWith?.("/") ? "directory" : "file");
                                const item: FileEntry = observe({ name, kind, handle } as FileEntry);

                                // Load file metadata
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
                )?.catch?.(console.warn.bind(console)))?.filter?.(($item: any) => $item != null) as FileEntry[];

                if (entries?.length != null && entries?.length >= 0) {
                    this.#entries.value = entries;
                }
            };

            // Debounced loader for reactive updates
            const debouncedLoader = ($map?: Map<string, any>) => {
                if (this.#loaderDebounceTimer) {
                    clearTimeout(this.#loaderDebounceTimer);
                }
                this.#loaderDebounceTimer = setTimeout(() => loader($map), 50);
            };

            // Unsubscribe from previous directory
            if (typeof this.#subscribed === "function") {
                this.#subscribed();
                this.#subscribed = null;
            }

            // Initial load
            await loader(await this.#dirProxy?.getMap?.() ?? [])?.catch?.(console.warn.bind(console));

            // Subscribe to directory changes
            this.#subscribed = affected((await this.#dirProxy?.getMap?.() ?? []), debouncedLoader);

        } catch (e: any) {
            this.#error.value = e?.message || String(e || "");
            console.warn(e);
        } finally {
            this.#loading.value = false;
            this.#loadLock = false;
        }

        return this;
    }

    // ========================================================================
    // ROW EVENT HANDLERS
    // ========================================================================

    onRowClick = (item: FileEntry, ev: MouseEvent): void => {
        ev.preventDefault();
        this.itemAction(item);
    };

    onRowDblClick = (item: FileEntry, ev: MouseEvent): void => {
        ev.preventDefault();
        this.itemAction(item);
    };

    onRowDragStart = (item: FileEntry, ev: DragEvent): void => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.effectAllowed = "copyMove";

        const abs = (this.path || "/user/") + (item?.name || "");
        ev.dataTransfer.setData("text/plain", abs);
        ev.dataTransfer.setData("text/uri-list", abs);

        if (item?.file) {
            ev.dataTransfer.setData(
                "DownloadURL",
                item.file.type + ":" + item.file.name + ":" + URL.createObjectURL(item.file)
            );
            ev.dataTransfer.items.add(item.file);
        }
    };

    // ========================================================================
    // MENU ACTIONS
    // ========================================================================

    /**
     * Handle context menu action
     */
    async onMenuAction(item: FileEntry | null, actionId: string, ev: MouseEvent): Promise<void> {
        try {
            const itemName = item?.name;
            if (!actionId) return;

            const abs = (this.path || "/user/") + (itemName || "");

            switch (actionId) {
                case "open":
                    this.itemAction(item as FileEntry);
                    break;

                case "view":
                    // Dispatch custom event for unified messaging
                    this.dispatchContextAction("view", item);
                    break;

                case "attach-workcenter":
                    // Dispatch custom event for unified messaging
                    this.dispatchContextAction("attach-workcenter", item);
                    break;

                case "download":
                    Promise.try(async () => {
                        if (item?.kind === "file") {
                            await downloadFile(await getFileHandle(this.#fsRoot!, abs, { create: false }));
                        } else {
                            await downloadFile(await getDirectoryHandle(this.#fsRoot!, abs, { create: false }));
                        }
                    }).catch(console.warn);
                    break;

                case "delete":
                    await remove(this.#fsRoot!, abs);
                    break;

                case "rename":
                    if (item?.kind === "file") {
                        const next = prompt("Rename to:", itemName);
                        if (next && next !== itemName) {
                            await this.renameFile(abs ?? "", next ?? "");
                        }
                    }
                    break;

                case "copyPath":
                    this.#clipboard = { items: [abs], cut: false };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { /* ignore */ }
                    break;

                case "copy":
                    this.#clipboard = { items: [abs], cut: false };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { /* ignore */ }
                    break;

                case "cut":
                    this.#clipboard = { items: [abs], cut: true };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { /* ignore */ }
                    break;

                default:
                    // Dispatch unknown actions as custom events
                    this.dispatchContextAction(actionId, item);
                    break;
            }
        } catch (e: any) {
            console.warn(e);
            this.#error.value = e?.message || String(e || "");
        }
    }

    /**
     * Dispatch context-action custom event
     */
    private dispatchContextAction(action: string, item: FileEntry | null): void {
        this.host?.dispatchEvent(new CustomEvent("context-action", {
            detail: { action, item },
            bubbles: true,
            composed: true
        }));
    }

    // ========================================================================
    // FILE OPERATIONS
    // ========================================================================

    /**
     * Rename file
     */
    protected async renameFile(oldPath: string, newName: string): Promise<void> {
        const fromHandle = await getFileHandle(this.#fsRoot!, oldPath, { create: false });
        const file = await fromHandle?.getFile?.();
        if (!file) return;

        await writeFile(this.#fsRoot!, this.path + newName, file);
        await remove(this.#fsRoot!, oldPath);
    }

    /**
     * Request file upload
     */
    async requestUpload(): Promise<void> {
        try {
            await uploadFile(this.path, null);
        } catch (e) {
            console.warn(e);
        }
    }

    /**
     * Request "use" action (placeholder for future implementation)
     */
    async requestUse(): Promise<void> {
        // TODO: implement use action
    }

    /**
     * Request paste from clipboard
     */
    async requestPaste(): Promise<void> {
        try {
            // 1. Try modern Async Clipboard API first (images, files)
            try {
                // @ts-ignore
                const clipboardItems = await navigator.clipboard.read();
                if (clipboardItems && clipboardItems.length > 0) {
                    await handleIncomingEntries(clipboardItems, this.path || "/user/");
                    return;
                }
            } catch {
                // Fallback or permission denied
            }

            // 2. Try System Clipboard Text
            let systemText = "";
            try {
                systemText = await navigator.clipboard?.readText?.();
            } catch { /* ignore */ }

            // 3. Check internal clipboard
            const internalItems = this.#clipboard?.items || [];

            // Handle system clipboard text
            if (systemText) {
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? systemText : ""
                }, this.path || "/user/");
                return;
            }

            // Handle internal clipboard
            if (internalItems.length > 0) {
                const txt = internalItems.join("\n");
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? txt : ""
                }, this.path || "/user/");

                // Handle cut operation
                if (this.#clipboard?.cut) {
                    for (const src of internalItems) {
                        await remove(this.#fsRoot!, src);
                    }
                    this.#clipboard = null;
                }
            }
        } catch (e) {
            console.warn(e);
        }
    }

    // ========================================================================
    // EVENT HANDLERS (for external binding)
    // ========================================================================

    /**
     * Handle paste event
     */
    onPaste(ev: ClipboardEvent): void {
        ev.preventDefault();

        // Try to read from event first
        if (ev.clipboardData || (ev as any).dataTransfer) {
            handleIncomingEntries(ev.clipboardData || (ev as any).dataTransfer, this.path || "/user/");
            return;
        }

        this.requestPaste();
    }

    /**
     * Handle copy event
     */
    onCopy(_ev: ClipboardEvent): void {
        // Not implemented: selection tracking required
    }

    /**
     * Handle drop event
     */
    async onDrop(ev: DragEvent): Promise<void> {
        ev.preventDefault();

        if ((ev as any).clipboardData || ev.dataTransfer) {
            handleIncomingEntries((ev as any).clipboardData || ev.dataTransfer, this.path || "/user/");
        }
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Dispose operative instance
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
// EXPORTS
// ============================================================================

export default FileOperative;
