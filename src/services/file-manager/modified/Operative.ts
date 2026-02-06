import { observe, iterated, ref, affected } from "fest/object";

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

//
export class FileOperative {
    // refs/state
    #entries = ref<FileEntryItem[]>([]);
    #loading = ref(false);
    #error = ref("");
    #fsRoot: any = null;
    #dirProxy: any = null;
    #loadLock = false;
    #clipboard: { items: string[]; cut?: boolean } | null = null;
    #subscribed: any = null;
    #loaderDebounceTimer: any = null;

    //
    public host: HTMLElement | null = null;

    //
    public pathRef = ref("/user/");

    //
    get path() { return this.pathRef.value; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value; }
    get entries() { return this.#entries; }

    //
    constructor() {
        this.#entries = ref<FileEntryItem[]>([]);
        this.pathRef ??= ref("/user/");

        //
        affected(this.pathRef, (path) => this.loadPath(path));
        navigator?.storage?.getDirectory?.()?.then?.((h)=>this.#fsRoot = h);
    }

    //
    itemAction(item: FileEntryItem) {
        const self: any = this;

        //
        const detail = { path: (self.path || "/user/") + item?.name, item, originalEvent: null };
        const event = new CustomEvent("open-item", { detail, bubbles: true, composed: true, cancelable: true });
        this.host?.dispatchEvent(event);
        if (event.defaultPrevented) return;

        //
        if (item?.kind === "directory") {
            const next = (self.path?.endsWith?.("/") ? self.path : self.path + "/") + item?.name + "/";
            self.path = next;
        } else {
            const openEvent = new CustomEvent("open", { detail, bubbles: true, composed: true });
            this.host?.dispatchEvent(openEvent);
        }
    }

    //
    async requestUse() {
        // TODO: implement
    }

    //
    async loadPath(path: string) {
        const self: any = this;

        //
        if (this.#loadLock) { return requestIdleCallback(() => this.loadPath(path), { timeout: 1000 }); };
        this.#loadLock = true;

        //
        try {
            this.#loading.value = true;
            this.#error.value = "";
            const rel = path; // openDirectory can consume absolute-like parts (it filters Booleans)

            //
            if (this.#dirProxy?.dispose) { this.#dirProxy.dispose(); }
            this.#dirProxy = openDirectory(this.#fsRoot, rel, { create: false }); await this.#dirProxy;

            //
            const loader = async ($map?: Map<string, any>)=>{
                const $entries = $map instanceof Map ? $map?.entries?.() : null;
                const handleMap = await Promise.all($entries ? Array.from($entries) : (await Array.fromAsync(await this.#dirProxy?.entries?.() ?? [])));

                //
                const entries = (await Promise.all(handleMap?.map?.(async ($pair: any, index: number) => {
                    return Promise.try(async () => {
                        const [name, handle] = $pair as any; // @ts-ignore
                        return handleCache?.getOrInsertComputed?.(handle, async () => {
                            const kind: EntryKind = handle?.kind || (name?.endsWith?.("/") ? "directory" : "file");
                            const item: any = observe({ name, kind, handle });

                            //
                            if (kind === "file") {
                                item.type = getMimeTypeByFilename?.(name);
                                Promise.try(async () => {
                                    try {
                                        const f = await handle?.getFile?.();
                                        item.file = f;
                                        item.size = f?.size;
                                        item.lastModified = f?.lastModified;
                                        item.type = f?.type || item.type;
                                    } catch { }
                                }).catch?.(console.warn.bind(console));
                            }

                            //
                            return item;
                        });
                    })?.catch?.(console.warn.bind(console));
                }))?.catch?.(console.warn.bind(console)))?.filter?.(($item: any) => $item != null);

                //
                if (entries?.length != null && entries?.length >= 0) { this.#entries.value = entries; };
            };

            //
            const debouncedLoader = ($map?: Map<string, any>) => {
                if (this.#loaderDebounceTimer) { clearTimeout(this.#loaderDebounceTimer); }
                this.#loaderDebounceTimer = setTimeout(() => loader($map), 50);
            };

            //
            if (typeof this.#subscribed == "function") { this.#subscribed?.(); this.#subscribed = null; }
            await loader(await this.#dirProxy?.getMap?.() ?? [])?.catch?.(console.warn.bind(console));
            this.#subscribed = affected((await this.#dirProxy?.getMap?.() ?? []), debouncedLoader);
        } catch (e: any) {
            this.#error.value = e?.message || String(e || "");
            console.warn(e);
        } finally {
            this.#loading.value = false;
            this.#loadLock = false;
        }

        //
        this.#loadLock = false;
        return this;
    }

    //
    protected onRowClick = (item: FileEntryItem, ev: MouseEvent) => { ev.preventDefault(); this.itemAction(item); };
    protected onRowDblClick = (item: FileEntryItem, ev: MouseEvent) => { ev.preventDefault(); this.itemAction(item); };
    protected onRowDragStart = (item: FileEntryItem, ev: DragEvent) => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.effectAllowed = "copyMove";

        //
        const abs = (this.path || "/user/") + (item?.name || "");
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
            if (!actionId) return; const abs = (this.path || "/user/") + (itemName || ""); switch (actionId) {
                case "open":
                    this.itemAction(item as FileEntryItem);
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
                        if (item?.kind === "file") {
                            await downloadFile(await getFileHandle(this.#fsRoot, abs, { create: false }));
                        } else {
                            await downloadFile(await getDirectoryHandle(this.#fsRoot, abs, { create: false }));
                        }
                    }).catch(console.warn);
                     break;
                case "delete":
                    await remove(this.#fsRoot, abs);
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
                    try { await navigator.clipboard?.writeText?.(abs); } catch { }
                    break;
                case "copy":
                    this.#clipboard = { items: [abs], cut: false };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { }
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
        try {
            if ((window as any)?.showDirectoryPicker) {
                /*const confirmed = confirm("Upload directory?");
                if (confirmed) {
                    await uploadDirectory(this.path, null);
                    return;
                }*/
            }
            await uploadFile(this.path, null);
        } catch (e) { console.warn(e); }
    }

    //
    async requestPaste() {
        try {
            // 1. Try modern Async Clipboard API first (images, files)
            try {
                // @ts-ignore
                const clipboardItems = await navigator.clipboard.read();
                if (clipboardItems && clipboardItems.length > 0) {
                     await handleIncomingEntries(clipboardItems, this.path || "/user/");
                     return;
                }
            } catch (e) {
                // Fallback or permission denied
            }

            // 2. Try System Clipboard Text
            let systemText = "";
            try {
                systemText = await navigator.clipboard?.readText?.();
            } catch { }

            // 3. Check internal clipboard
            const internalItems = this.#clipboard?.items || [];

            // Determine sources: Prefer internal if valid and no system text override (simple heuristic)
            // Actually, unified handling:
            if (systemText) {
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? systemText : ""
                }, this.path || "/user/");
                return;
            }

            if (internalItems.length > 0) {
                const txt = internalItems.join("\n");
                await handleIncomingEntries({
                    getData: (type: string) => type === "text/plain" ? txt : ""
                }, this.path || "/user/");

                if (this.#clipboard?.cut) {
                    for (const src of internalItems) {
                         await remove(this.#fsRoot, src);
                    }
                    this.#clipboard = null;
                }
            }
        } catch (e) { console.warn(e); }
    }

    //
    public onPaste(ev: ClipboardEvent) {
        ev.preventDefault();

        // Try to read from event first
        if (ev.clipboardData || (ev as any).dataTransfer) {
            handleIncomingEntries(ev.clipboardData || (ev as any).dataTransfer, this.path || "/user/");
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
        ev.preventDefault();

        //
        if ((ev as any).clipboardData || (ev as any).dataTransfer) {
            handleIncomingEntries((ev as any).clipboardData || (ev as any).dataTransfer, this.path || "/user/");
            return;
        }
    }

}

export default FileOperative;
