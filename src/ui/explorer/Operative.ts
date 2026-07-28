/*
 * Filename: Operative.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/Operative.ts
 * Change date and time: 01.20.00_29.07.2026
 * Reason for changes: Serialize path loads so OPFS listings refresh after drop/paste/upload.
 */

import { observe, iterated, ref, affected } from "fest/object";
import { isUserScopePath } from "fest/core";

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
    copyFromOneHandlerToAnother,
    attachFile,
    provide,
    readFile,
    uploadDirectory,
    handleIncomingEntries
} from "fest/lure";

//
export type EntryKind = "file" | "directory";
export interface FileEntryItem {
    name: string;
    kind: EntryKind;
    type?: string;
    size?: number;
    lastModified?: number;
    handle?: any;
    file?: File;
}

//
const handleCache = new WeakMap<any, any>();
const waitForClipboardFrame = (): Promise<void> =>
    new Promise((resolve) => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
            return;
        }
        if (typeof MessageChannel !== "undefined") {
            const channel = new MessageChannel();
            channel.port1.onmessage = () => resolve();
            channel.port2.postMessage(undefined);
            return;
        }
        if (typeof setTimeout === "function") {
            setTimeout(() => resolve(), 16);
            return;
        }
        if (typeof queueMicrotask === "function") {
            queueMicrotask(() => resolve());
            return;
        }
        resolve();
    });

/**
 * Accept File objects from the page, an iframe, or a WebView realm.
 * `instanceof File` is not reliable across those realms.
 */
const isFileLike = (value: any): value is File =>
    Boolean(
        value &&
        typeof value === "object" &&
        typeof value.name === "string" &&
        typeof value.size === "number" &&
        (typeof value.arrayBuffer === "function" || typeof value.stream === "function")
    );

const ASSETS_ROOT = "/assets/";
const ASSET_SEED_PATHS = [
    "/assets/crossword.css",
    "/assets/icons/",
    "/assets/imgs/",
    "/assets/wallpapers/"
];
const ASSET_ICON_STYLES = ["thin", "light", "regular", "bold", "fill", "duotone"];
const ASSET_ICON_FALLBACK_NAMES = [
    "copy",
    "clipboard",
    "trash",
    "folder",
    "folder-open",
    "download",
    "upload",
    "arrow-up",
    "arrow-clockwise",
    "code",
    "eye",
    "gear",
    "printer",
    "file-doc",
    "file-text",
    "lightning",
    "pencil",
    "clock-counter-clockwise",
];

const normalizeDirectoryPath = (input?: string): string => {
    const value = (input || "/").trim() || "/";
    const withLeading = value.startsWith("/") ? value : `/${value}`;
    return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
};

const isAssetsPath = (path?: string): boolean => normalizeDirectoryPath(path).startsWith(ASSETS_ROOT);
const isVirtualRootPath = (path?: string): boolean => normalizeDirectoryPath(path) === "/";
const isReadonlyPath = (path?: string): boolean => isAssetsPath(path) || isVirtualRootPath(path);
const isIconsPath = (path?: string): boolean => normalizeDirectoryPath(path).startsWith("/assets/icons/");
const isUserPath = (path?: string): boolean => isUserScopePath(normalizeDirectoryPath(path));

/**
 * External ingress may target the virtual root, which is redirected to `/user/`.
 * Keep this predicate shared with the context-menu layer so Paste visibility
 * cannot drift from the actual drop/paste acceptance rules.
 */
export const canReceiveIncomingPath = (path?: string): boolean => {
    const normalized = normalizeDirectoryPath(path);
    return isVirtualRootPath(normalized) || isUserPath(normalized);
};

const buildVirtualAssetPaths = (path: string): string[] => {
    const target = normalizeDirectoryPath(path);
    const paths = new Set<string>();
    if (!isIconsPath(target)) return [];

    // Always expose icon roots/styles even when nothing is cached yet.
    paths.add("/assets/icons/");
    paths.add("/assets/icons/phosphor/");
    paths.add("/assets/icons/duotone/");
    for (const style of ASSET_ICON_STYLES) {
        paths.add(`/assets/icons/phosphor/${style}/`);
        paths.add(`/assets/icons/${style}/`);
    }

    const addIconFiles = (base: string) => {
        for (const iconName of ASSET_ICON_FALLBACK_NAMES) {
            paths.add(`${base}${iconName}.svg`);
        }
    };

    if (target === "/assets/icons/" || target === "/assets/icons/duotone/") {
        addIconFiles("/assets/icons/duotone/");
    }

    if (target.startsWith("/assets/icons/phosphor/")) {
        const parts = target.split("/").filter(Boolean);
        if (parts.length >= 4) {
            const style = parts[3];
            if (ASSET_ICON_STYLES.includes(style)) {
                addIconFiles(`/assets/icons/phosphor/${style}/`);
            }
        }
    }

    if (target.startsWith("/assets/icons/")) {
        const parts = target.split("/").filter(Boolean);
        if (parts.length >= 3) {
            const style = parts[2];
            if (ASSET_ICON_STYLES.includes(style)) {
                addIconFiles(`/assets/icons/${style}/`);
            }
        }
    }

    return Array.from(paths);
};

//
export class FileOperative {
    // refs/state
    #entries = ref<FileEntryItem[]>([]);
    #loading = ref(false);
    #error = ref("");
    #fsRoot: any = null;
    #dirProxy: any = null;
    #loadLock = false;
    /** Coalesce overlapping loadPath calls onto the latest requested path. */
    #pendingLoadPath: any = null;
    #loadWaiters: Array<(value: this) => void> = [];
    #clipboard: { items: string[]; cut?: boolean } | null = null;
    #subscribed: any = null;
    #loaderDebounceTimer: any = null;
    #readonly = ref(false);

    //
    public host: HTMLElement | null = null;
    public pathRef = ref("/");

    //
    get path() { return this.pathRef?.value || "/"; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value || "/"; }
    get entries() { return this.#entries; }
    get readonly() { return this.#readonly?.value === true; }

    //
    constructor() {
        this.#entries = ref<FileEntryItem[]>([]);
        this.pathRef ??= ref("/");

        //
        affected(this.pathRef, (path) => {
            this.#readonly.value = isReadonlyPath(path || "/");
            this.loadPath(path || "/");
        });
        navigator?.storage?.getDirectory?.()?.then?.((h) => {
            this.#fsRoot = h;
            void this.refreshList(this.path || "/");
        });
    }

    private async listAssetEntries(path: string): Promise<FileEntryItem[]> {
        const target = normalizeDirectoryPath(path);
        const knownPaths = new Set<string>(ASSET_SEED_PATHS);
        for (const virtualPath of buildVirtualAssetPaths(target)) {
            knownPaths.add(virtualPath);
        }

        try {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                try {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    for (const req of requests) {
                        const pathname = new URL(req.url).pathname;
                        if (pathname.startsWith(ASSETS_ROOT)) {
                            knownPaths.add(pathname);
                        }
                    }
                } catch {
                    // Ignore per-cache listing failures.
                }
            }
        } catch {
            // Cache API may be unavailable in some contexts.
        }

        const dirs = new Set<string>();
        const files: string[] = [];
        for (const full of knownPaths) {
            const normalized = full.startsWith("/") ? full : `/${full}`;
            if (!normalized.startsWith(target)) continue;
            const remainder = normalized.slice(target.length);
            if (!remainder) continue;
            const [firstSegment, ...rest] = remainder.split("/").filter(Boolean);
            if (!firstSegment) continue;
            if (rest.length > 0 || normalized.endsWith("/")) {
                dirs.add(firstSegment);
            } else {
                files.push(firstSegment);
            }
        }

        const directoryEntries = Array.from(dirs)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => observe({ name, kind: "directory" as const }));

        const uniqueFiles = Array.from(new Set(files)).filter((name) => !dirs.has(name));
        const fileEntries = uniqueFiles
            .sort((a, b) => a.localeCompare(b))
            .map((name) => {
                const item: any = observe({ name, kind: "file" as const });
                item.type = getMimeTypeByFilename?.(name);
                return item;
            });

        return [...directoryEntries, ...fileEntries];
    }

    private listVirtualRootEntries(): FileEntryItem[] {
        return [
            observe({ name: "user", kind: "directory" as const }),
            observe({ name: "assets", kind: "directory" as const }),
        ];
    }

    private detachDirectoryObservers() {
        if (this.#loaderDebounceTimer) {
            clearTimeout(this.#loaderDebounceTimer);
            this.#loaderDebounceTimer = null;
        }
        if (typeof this.#subscribed === "function") {
            this.#subscribed();
            this.#subscribed = null;
        }
        if (this.#dirProxy?.dispose) {
            this.#dirProxy.dispose();
        }
        this.#dirProxy = null;
    }

    private async collectDirectoryEntries(): Promise<FileEntryItem[]> {
        const source = await this.#dirProxy?.entries?.();
        let pairs: any[] = [];
        if (Array.isArray(source)) {
            pairs = source;
        } else if (source && typeof (source as any)[Symbol.iterator] === "function") {
            pairs = Array.from(source as Iterable<any>);
        } else if (source && typeof (source as any)[Symbol.asyncIterator] === "function") {
            // Fallback for async iterators in non-proxy directory implementations.
            for await (const pair of source as AsyncIterable<any>) {
                pairs.push(pair);
            }
        }
        const entries = (await Promise.all(
            (pairs || []).map(async ($pair: any) => {
                try {
                    const [name, handle] = $pair as any;
                    if (!name || !handle) return null;
                    const build = async () => {
                        const kind: EntryKind = handle?.kind || (name?.endsWith?.("/") ? "directory" : "file");
                        const item: any = observe({ name, kind, handle });
                        if (kind === "file") {
                            item.type = getMimeTypeByFilename?.(name);
                            try {
                                const f = await handle?.getFile?.();
                                item.file = f;
                                item.size = f?.size;
                                item.lastModified = f?.lastModified;
                                item.type = f?.type || item.type;
                            } catch {}
                        }
                        return item;
                    };
                    // Prefer WeakMap cache when the runtime polyfill is present; otherwise build directly.
                    if (typeof handleCache?.getOrInsertComputed === "function") {
                        return await handleCache.getOrInsertComputed(handle, build);
                    }
                    return await build();
                } catch (error) {
                    console.warn(error);
                    return null;
                }
            })
        ))?.filter?.(($item: any) => $item != null);
        return entries || [];
    }

    private async getDirectoryHandleByPath(path: string, create = false): Promise<any> {
        const root = this.#fsRoot || await navigator?.storage?.getDirectory?.();
        if (!root) return null;
        const clean = normalizeDirectoryPath(path);
        const parts = clean.split("/").filter(Boolean);
        let current = root;
        for (const part of parts) {
            current = await current.getDirectoryHandle(part, { create });
        }
        return current;
    }

    private normalizeUserRelativePath(path: string): string {
        const normalized = normalizeDirectoryPath(path);
        if (normalized === "/user/") return "/";
        if (normalized.startsWith("/user/")) return normalized.slice("/user".length);
        return normalized;
    }

    private async getOpfsRootHandle(): Promise<any> {
        this.#fsRoot = this.#fsRoot || await navigator?.storage?.getDirectory?.();
        return this.#fsRoot;
    }

    private async getUserDirHandle(path: string, create = false): Promise<any> {
        const root = await this.getOpfsRootHandle();
        if (!root) return null;
        const rel = this.normalizeUserRelativePath(path);
        const parts = rel.split("/").filter(Boolean);
        let current = root;
        for (const part of parts) {
            current = await current.getDirectoryHandle(part, { create });
        }
        return current;
    }

    private async writeUserFile(file: File, destPath: string = this.path): Promise<void> {
        const dir = await this.getUserDirHandle(destPath, true);
        if (!dir) return;
        const safeName = (file?.name || `file-${Date.now()}`).trim().replace(/\s+/g, "-");
        const fileHandle = await dir.getFileHandle(safeName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
    }

    /**
     * Select files without assuming the File System Access constructors exist.
     * Some shells expose a `showOpenFilePicker` polyfill that throws while
     * evaluating `FileSystemHandle`; a normal file input is the safe fallback.
     */
    private async pickFilesForUpload(): Promise<File[]> {
        const picker = (globalThis as any)?.showOpenFilePicker;
        const hasNativePicker =
            typeof picker === "function"
            && typeof (globalThis as any)?.FileSystemHandle === "function";

        if (hasNativePicker) {
            const handles = await picker({ multiple: true }).catch(() => []);
            const files: File[] = [];
            for (const handle of handles || []) {
                const file = await handle?.getFile?.().catch?.(() => null);
                if (isFileLike(file)) files.push(file);
            }
            return files;
        }

        if (typeof document === "undefined") return [];
        return new Promise<File[]>((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.style.cssText = "position:fixed;inline-size:1px;block-size:1px;opacity:0;pointer-events:none;";

            let settled = false;
            const finish = (files: File[] = []) => {
                if (settled) return;
                settled = true;
                input.remove();
                resolve(files);
            };

            input.addEventListener("change", () => {
                finish(Array.from(input.files || []).filter(isFileLike));
            }, { once: true });
            input.addEventListener("cancel", () => finish(), { once: true });
            (document.body || document.documentElement).appendChild(input);
            input.click();
        });
    }

    /**
     * Resolve the only writable destinations for external file ingress.
     * The virtual root is a navigation scope, so root drops/pastes are stored
     * in `/user/` and then surfaced by navigating there.
     */
    private incomingDestinationPath(): string | null {
        const currentPath = normalizeDirectoryPath(this.path);
        if (canReceiveIncomingPath(currentPath) && isUserPath(currentPath)) return currentPath;
        if (isVirtualRootPath(currentPath)) return "/user/";
        return null;
    }

    /**
     * Capture directory-handle promises during the original drop event.
     *
     * WHY: Chromium exposes `getAsFileSystemHandle()` only during the same
     * event turn. Calling it after `extractFilesFromData()` has awaited, or
     * calling it from an insecure HTTP page, can terminate the renderer with
     * RESULT_CODE_KILLED_BAD_MESSAGE instead of throwing a normal exception.
     */
    private captureDirectoryHandlePromises(data: any): Promise<any>[] {
        if ((globalThis as any).isSecureContext !== true) return [];

        const promises: Promise<any>[] = [];
        for (const item of Array.from(data?.items ?? []) as any[]) {
            if (item?.kind !== "file" || typeof item?.getAsFileSystemHandle !== "function") continue;

            // Avoid the experimental API for ordinary files. The File object
            // path is handled by `extractFilesFromData()` and is more stable.
            let legacyEntry: any = null;
            try {
                legacyEntry = item.webkitGetAsEntry?.() ?? null;
            } catch { }
            if (legacyEntry && !legacyEntry.isDirectory) continue;

            if (!legacyEntry) {
                try {
                    if (isFileLike(item.getAsFile?.())) continue;
                } catch { }
            }

            // INVARIANT: invoke this before any async boundary in onDrop.
            try {
                promises.push(Promise.resolve(item.getAsFileSystemHandle()));
            } catch { }
        }
        return promises;
    }

    private async ingestIncomingData(
        data: any,
        destination: string,
        directoryHandlePromises: Promise<any>[] = []
    ): Promise<void> {
        const files = await this.extractFilesFromData(data);
        const directoryResults = await Promise.allSettled(directoryHandlePromises);
        const directories = directoryResults.flatMap((result) =>
            result.status === "fulfilled" && result.value?.kind === "directory"
                ? [result.value]
                : []
        );
        if (files.length > 0) {
            for (const file of files) {
                await this.writeUserFile(file, destination);
            }
        }

        for (const directory of directories) {
            const name = String(directory?.name || `folder-${Date.now()}`).trim().replace(/\s+/g, "-");
            const target = await getDirectoryHandle(this.#fsRoot, `${destination}${name}`, { create: true });
            if (target) await copyFromOneHandlerToAnother(directory, target, { create: true });
        }

        if (files.length > 0 || directories.length > 0) return;

        // Do not pass live DataTransfer items to the legacy helper: it calls
        // getAsFileSystemHandle() after an await and can recreate the Chromium
        // crash. URI text is safe to pass through a data-only facade.
        const transferItems = Array.from(data?.items ?? []);
        const getData = (type: string) => data?.getData?.(type) || "";
        const uriList = getData("text/uri-list");
        const plainText = getData("text/plain");
        if (transferItems.length > 0) {
            if (!uriList && !plainText) return;
            await handleIncomingEntries({ getData }, destination, this.#fsRoot);
            return;
        }

        await handleIncomingEntries(data, destination, this.#fsRoot);
    }

    private async finishIncoming(destination: string): Promise<void> {
        if (isVirtualRootPath(this.path)) this.path = destination;
        await this.refreshList(this.path);
    }

    /**
     * Imperative save API for shells/channels — writes into the OPFS-backed workspace folder.
     * Defaults to {@link FileOperative.path}; optional `destPath` overrides the parent directory.
     */
    async ingestFileIntoWorkspace(file: File, destPath?: string): Promise<void> {
        await this.writeUserFile(file, destPath ?? this.path);
    }

    private async removeUserEntry(absPath: string, recursive = true): Promise<boolean> {
        const root = await this.getOpfsRootHandle();
        if (!root) return false;
        const rel = this.normalizeUserRelativePath(absPath).replace(/\/+$/g, "");
        const parts = rel.split("/").filter(Boolean);
        if (!parts.length) return false;
        const name = parts.pop() as string;
        let dir = root;
        for (const part of parts) {
            dir = await dir.getDirectoryHandle(part, { create: false });
        }
        await dir.removeEntry(name, { recursive });
        return true;
    }

    private async renameUserFile(absPath: string, newName: string): Promise<void> {
        const root = await this.getOpfsRootHandle();
        if (!root) return;
        const rel = this.normalizeUserRelativePath(absPath).replace(/\/+$/g, "");
        const parts = rel.split("/").filter(Boolean);
        if (!parts.length) return;
        const oldName = parts.pop() as string;
        let dir = root;
        for (const part of parts) {
            dir = await dir.getDirectoryHandle(part, { create: false });
        }
        const oldHandle = await dir.getFileHandle(oldName, { create: false });
        const oldFile = await oldHandle.getFile();
        const safeName = (newName || "").trim().replace(/\s+/g, "-");
        if (!safeName || safeName === oldName) return;
        const newHandle = await dir.getFileHandle(safeName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(oldFile);
        await writable.close();
        await dir.removeEntry(oldName);
    }

    private async extractFilesFromData(data: any): Promise<File[]> {
        const files: File[] = [];
        const now = Date.now();
        const extByMime = (mime: string) => {
            const m = (mime || "").toLowerCase();
            if (m.includes("css")) return "css";
            if (m.includes("json")) return "json";
            if (m.includes("markdown")) return "md";
            if (m.includes("svg")) return "svg";
            if (m.includes("png")) return "png";
            if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
            if (m.includes("gif")) return "gif";
            if (m.includes("webp")) return "webp";
            if (m.includes("plain")) return "txt";
            return "bin";
        };

        const nativeFiles = Array.from(data?.files ?? []).filter(isFileLike);
        files.push(...nativeFiles);

        const items = Array.from(data?.items ?? []);
        for (const item of items as any[]) {
            if (item?.kind === "file" && typeof item?.getAsFile === "function") {
                const f = item.getAsFile();
                if (isFileLike(f)) files.push(f);
                continue;
            }
            const types = Array.from(item?.types ?? []);
            if (typeof item?.getType === "function" && types.length > 0) {
                const type = String(types[0] || "");
                try {
                    const blob = await item.getType(type);
                    if (!blob) continue;
                    const ext = extByMime(blob.type || type);
                    files.push(new File([blob], `clipboard-${now}-${files.length}.${ext}`, {
                        type: blob.type || type,
                        lastModified: now
                    }));
                } catch {}
            }
        }
        return files;
    }

    private async readEntriesFromDirectory(dir: any): Promise<FileEntryItem[]> {
        if (!dir) return [];
        const entries: FileEntryItem[] = [];
        for await (const [name, handle] of dir.entries()) {
            const kind: EntryKind = handle?.kind || (name?.endsWith?.("/") ? "directory" : "file");
            const item: any = observe({ name, kind, handle });
            if (kind === "file") {
                item.type = getMimeTypeByFilename?.(name);
                try {
                    const f = await handle?.getFile?.();
                    item.file = f;
                    item.size = f?.size;
                    item.lastModified = f?.lastModified;
                    item.type = f?.type || item.type;
                } catch {}
            }
            entries.push(item);
        }
        return entries;
    }

    private async listUserEntriesDirect(path: string, createIfMissing = false): Promise<FileEntryItem[]> {
        const normalized = normalizeDirectoryPath(path);
        const strippedPath = normalized.replace(/^\/user\/?/, "/");
        const legacyPath = normalized; // Legacy layout may physically contain "/user/*" in OPFS.

        const dirs: any[] = [];
        const tryPush = (dir: any) => {
            if (!dir) return;
            if (!dirs.includes(dir)) dirs.push(dir);
        };

        tryPush(await this.getDirectoryHandleByPath(strippedPath, false).catch(() => null));
        if (legacyPath !== strippedPath) {
            tryPush(await this.getDirectoryHandleByPath(legacyPath, false).catch(() => null));
        }

        if (!dirs.length && createIfMissing) {
            tryPush(await this.getDirectoryHandleByPath(strippedPath, true).catch(() => null));
        }

        const merged = new Map<string, FileEntryItem>();
        for (const dir of dirs) {
            const chunk = await this.readEntriesFromDirectory(dir);
            for (const entry of chunk) {
                if (!entry?.name) continue;
                const key = `${entry.kind}:${entry.name}`;
                if (!merged.has(key)) merged.set(key, entry);
            }
        }
        return Array.from(merged.values());
    }

    private applyEntries(entries: FileEntryItem[]) {
        const unique = new Map<string, FileEntryItem>();
        for (const entry of entries || []) {
            if (!entry || !entry.name) continue;
            const key = `${entry.kind}:${entry.name}`;
            if (!unique.has(key)) unique.set(key, entry);
        }
        (this.#entries as any).value = Array.from(unique.values());
        this.dispatchEvent(new CustomEvent("entries-updated", {
            detail: { path: this.path, count: unique.size },
            bubbles: true,
            composed: true
        }));
    }

    //
    async itemAction(item: FileEntryItem) {
        const self: any = this;
        const detail = { path: (self.path || "/") + item?.name, item, originalEvent: null };
        const event = new CustomEvent("open-item", { detail, bubbles: true, composed: true, cancelable: true });
        this.host?.dispatchEvent(event);
        if (event.defaultPrevented) return;

        //
        if (item?.kind === "directory") {
            const next = (self.path?.endsWith?.("/") ? self.path : self.path + "/") + item?.name + "/";
            self.path = next;
        } else {
            const abs = (self.path || "/") + (item?.name || "");
            if (!item?.file && isAssetsPath(abs)) {
                item.file = await provide(abs).catch(() => null);
                if (item.file) {
                    item.size = item.file.size;
                    item.lastModified = item.file.lastModified;
                    item.type = item.file.type || item.type;
                }
            }
            const openEvent = new CustomEvent("open", { detail, bubbles: true, composed: true });
            this.host?.dispatchEvent(openEvent);
        }
    }

    //
    async requestUse() {
        // TODO: implement
    }

    //
    async refreshList(path: any|string = this.path) {
        await this.loadPath(path);
        return this;
    }

    //
    async loadPath(path: any|string = this.path) {
        // INVARIANT: callers (drop/paste/upload/refresh) must await a completed
        // listing for the latest path. Overlapping loads coalesce onto the newest
        // request and resolve every waiter after that listing is applied.
        this.#pendingLoadPath = path;
        if (this.#loadLock) {
            return new Promise<this>((resolve) => {
                this.#loadWaiters.push(resolve);
            });
        }
        this.#loadLock = true;

        try {
            while (this.#pendingLoadPath != null) {
                const nextPath = this.#pendingLoadPath;
                this.#pendingLoadPath = null;
                await this.#loadPathNow(nextPath);
            }
        } finally {
            this.#loadLock = false;
            const waiters = this.#loadWaiters.splice(0, this.#loadWaiters.length);
            for (const resolve of waiters) resolve(this);
        }
        return this;
    }

    async #loadPathNow(path: any|string = this.path) {
        const self: any = this;

        try {
            this.#loading.value = true;
            this.#error.value = "";
            const rel = normalizeDirectoryPath(path?.value || path || this.path || "/");
            this.detachDirectoryObservers();
            if (isVirtualRootPath(rel)) {
                this.applyEntries(this.listVirtualRootEntries());
                return this;
            }
            if (isAssetsPath(rel)) {
                this.applyEntries(await this.listAssetEntries(rel));
                return this;
            }

            if (isUserPath(rel)) {
                const entries = await this.listUserEntriesDirect(rel, true);
                this.applyEntries(entries);
                return this;
            }

            //
            try {
                this.#dirProxy = openDirectory(this.#fsRoot, rel, { create: false });
                await this.#dirProxy;
            } catch (openErr) {
                // In /user scope we tolerate missing folders and create them on navigation.
                if (!isUserPath(rel)) throw openErr;
                this.#dirProxy = openDirectory(this.#fsRoot, rel, { create: true });
                await this.#dirProxy;
            }

            //
            const loader = async () => {
                const entries = await this.collectDirectoryEntries();
                if (entries?.length != null && entries?.length >= 0 && typeof entries?.length == "number") {
                    this.applyEntries(entries);
                }
            };

            //
            const debouncedLoader = () => {
                if (this.#loaderDebounceTimer) { clearTimeout(this.#loaderDebounceTimer); }
                this.#loaderDebounceTimer = setTimeout(() => loader(), 50);
            };

            //
            await loader()?.catch?.(console.warn.bind(console));
            this.#subscribed = affected((await this.#dirProxy?.getMap?.() ?? []), debouncedLoader);
        } catch (e: any) {
            this.#error.value = e?.message || String(e || "");
            // Never show stale rows from previous path on load failure.
            this.applyEntries([]);
            console.warn(e);
        } finally {
            this.#loading.value = false;
        }
        return this;
    }

    //
    protected onRowClick = (item: FileEntryItem, ev: MouseEvent) => { ev.preventDefault(); void this.itemAction(item); };
    protected onRowDblClick = (item: FileEntryItem, ev: MouseEvent) => { ev.preventDefault(); void this.itemAction(item); };
    protected onRowDragStart = (item: FileEntryItem, ev: DragEvent) => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.effectAllowed = "copyMove";

        //
        const abs = (this.path || "/") + (item?.name || "");
        ev.dataTransfer.setData("text/plain", abs);
        ev.dataTransfer.setData("text/uri-list", abs);
        if (item?.file) {
            ev.dataTransfer.setData("DownloadURL", item?.file?.type + ":" + item?.file?.name + ":" + URL.createObjectURL(item?.file as any));
            ev.dataTransfer.items.add(item?.file as any);
        }
    };

    //
    protected async onMenuAction(item: FileEntryItem | null, actionId: string, ev: MouseEvent) {
        try {
            const itemName = item?.name;
            if (!actionId) return; const abs = (this.path || "/") + (itemName || ""); switch (actionId) {
                case "delete":
                case "rename":
                case "movePath":
                    if (this.readonly || isReadonlyPath(abs)) {
                        this.dispatchEvent(new CustomEvent("readonly-blocked", {
                            detail: { action: actionId, path: abs },
                            bubbles: true,
                            composed: true
                        }));
                        break;
                    }
                    if (actionId === "delete") {
                        if (isUserPath(abs)) {
                            await this.removeUserEntry(abs, true);
                        } else {
                            await remove(this.#fsRoot, abs);
                        }
                        await this.refreshList(this.path);
                        break;
                    }
                    if (actionId === "rename") {
                        if (item?.kind === "file") {
                            const next = prompt("Rename to:", itemName);
                            if (next && next !== itemName) {
                                if (isUserPath(abs)) {
                                    await this.renameUserFile(abs ?? "", next ?? "");
                                } else {
                                    await this.renameFile(abs ?? "", next ?? "");
                                }
                                await this.refreshList(this.path);
                            }
                        }
                        break;
                    }
                    break;
                case "open":
                    await this.itemAction(item as FileEntryItem);
                    break;
                case "paste":
                    await this.requestPaste();
                    break;
                case "view":
                    // Dispatch custom event for unified messaging
                    this.dispatchEvent(new CustomEvent('context-action', {
                        detail: { action: 'view', item }
                    }));
                    break;
                case "attach-workcenter":
                    // Dispatch custom event for unified messaging
                    this.dispatchEvent(new CustomEvent('context-action', {
                        detail: { action: 'attach-workcenter', item }
                    }));
                    break;
                case "download":
                    Promise.try(async () => {
                        if (isAssetsPath(abs)) {
                            const file = await provide(abs);
                            if (file) await downloadFile(file);
                            return;
                        }
                        if (item?.kind === "file") {
                            await downloadFile(await getFileHandle(this.#fsRoot, abs, { create: false }));
                        } else {
                            await downloadFile(await getDirectoryHandle(this.#fsRoot, abs, { create: false }));
                        }
                    }).catch(console.warn);
                     break;
                case "copyPath":
                    this.#clipboard = { items: [abs], cut: false };
                    try {
                        await waitForClipboardFrame();
                        await navigator.clipboard?.writeText?.(abs);
                    } catch { }
                    break;
                case "copy":
                    this.#clipboard = { items: [abs], cut: false };
                    try {
                        await waitForClipboardFrame();
                        await navigator.clipboard?.writeText?.(abs);
                    } catch { }
                    break;
            }
        } catch (e: any) {
            console.warn(e);
            this.#error.value = e?.message || String(e || "");
        }
    }

    //
    protected async renameFile(oldName: string, newName: string) {
        const fromHandle = await getFileHandle(this.#fsRoot, oldName, { create: false });
        const file = await fromHandle?.getFile?.();
        if (!file) return;
        const target = await getFileHandle(this.#fsRoot, newName, { create: true }).catch(() => null);
        if (!target) {
            await writeFile(this.#fsRoot, this.path + newName, file);
        } else {
            await writeFile(this.#fsRoot, this.path + newName, file);
        }
        await remove(this.#fsRoot, this.path + oldName);
    }

    //
    async requestUpload() {
        // Read-only state is reactive and can still describe the previous `/`
        // frame when the toolbar is used immediately after navigation. Resolve
        // the current writable destination from the path itself so an upload
        // cannot be dropped by a stale flag.
        const destination = this.incomingDestinationPath();
        if (destination) {
            try {
                const files = await this.pickFilesForUpload();
                for (const file of files) {
                    await this.writeUserFile(file, destination);
                }
                await this.finishIncoming(destination);
            } catch (e) {
                console.warn(e);
            }
            return;
        }

        const currentPath = normalizeDirectoryPath(this.path);
        if (this.readonly || isReadonlyPath(currentPath)) return;
        try {
            await uploadFile(currentPath, null);
            await this.refreshList(currentPath);
        } catch (e) { console.warn(e); }
    }

    //
    async requestPaste() {
        const destination = this.incomingDestinationPath();
        if (!destination) return;
        try {
            // 1. Try modern Async Clipboard API first (images, files)
            try {
                // @ts-ignore
                await waitForClipboardFrame();
                const clipboardItems = await navigator.clipboard.read();
                if (clipboardItems && clipboardItems.length > 0) {
                    const files = await this.extractFilesFromData(clipboardItems);
                    if (files.length > 0) {
                        for (const file of files) {
                            await this.writeUserFile(file, destination);
                        }
                        await this.finishIncoming(destination);
                        return;
                    }
                }
            } catch (e) {
                // Fallback or permission denied
            }

            // 2. Try System Clipboard Text
            let systemText = "";
            try {
                await waitForClipboardFrame();
                systemText = await navigator.clipboard?.readText?.();
            } catch { }

            // 3. Check internal clipboard
            const internalItems = this.#clipboard?.items || [];

            // Determine sources: Prefer internal if valid and no system text override (simple heuristic)
            // Actually, unified handling:
            if (systemText) {
                // Preserve text paste behavior for non-file clipboard content.
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? systemText : ""
                }, destination, this.#fsRoot);
                await this.finishIncoming(destination);
                return;
            }

            if (internalItems.length > 0) {
                const txt = internalItems.join("\n");
                if (internalItems.every((x) => String(x || "").startsWith("/user/"))) {
                    for (const src of internalItems) {
                        const file = await readFile(this.#fsRoot, src).catch(() => null);
                        if (isFileLike(file)) {
                            await this.writeUserFile(file, destination);
                            if (this.#clipboard?.cut) await this.removeUserEntry(src, true).catch(() => null);
                        }
                    }
                    if (this.#clipboard?.cut) this.#clipboard = null;
                } else {
                    await handleIncomingEntries({
                        getData: (type: string) => type === "text/plain" ? txt : ""
                    }, destination, this.#fsRoot);
                }
                await this.finishIncoming(destination);
            }
        } catch (e) { console.warn(e); }
    }

    //
    public onPaste(ev: ClipboardEvent) {
        const destination = this.incomingDestinationPath();
        if (!destination) return;
        ev.preventDefault();

        // Try to read from event first
        if (ev.clipboardData || (ev as any).dataTransfer) {
            void Promise.try(async () => {
                const payload = ev.clipboardData || (ev as any).dataTransfer;
                await this.ingestIncomingData(payload, destination);
                await this.finishIncoming(destination);
            }).catch(console.warn);
            return;
        }

        //
        this.requestPaste();
    }

    //
    public onCopy(ev: ClipboardEvent) {
        // Not implemented selection tracking yet
    }

    //
    public async onDrop(ev: DragEvent) {
        const destination = this.incomingDestinationPath();
        if (!destination) return;
        ev.preventDefault();

        //
        if ((ev as any).clipboardData || (ev as any).dataTransfer) {
            const payload = (ev as any).clipboardData || (ev as any).dataTransfer;
            // Must happen synchronously in this event handler, before the
            // first await inside `ingestIncomingData()`.
            const directoryHandlePromises = this.captureDirectoryHandlePromises(payload);
            await this.ingestIncomingData(payload, destination, directoryHandlePromises);
            await this.finishIncoming(destination);
            return;
        }
    }

    //
    protected dispatchEvent(event: Event) {
        this.host?.dispatchEvent(event);
    }
}

export default FileOperative;
