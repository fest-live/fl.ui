import { makeReactive, observe, ref, subscribe } from "fest/object";

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
    uploadDirectory
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
        subscribe(this.pathRef, (path) => this.loadPath(path));
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
        if (this.#loadLock) { return setTimeout(() => this.loadPath(path), 1000); };
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
                            const item: any = makeReactive({ name, kind, handle });

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
            this.#subscribed = subscribe((await this.#dirProxy?.getMap?.() ?? []), debouncedLoader);
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
            let sources: string[] = [];
            // try system clipboard
            try {
                const txt = await navigator.clipboard?.readText?.();
                if (txt && txt.startsWith("/user/")) sources = txt.split(/\n+/).map(s => s.trim()).filter(Boolean);
            } catch { }
            if (!sources?.length && this.#clipboard?.items?.length) sources = this.#clipboard.items;
            if (!sources?.length) return;

            // copy/move
            for (const src of sources) {
                const isDir = src.endsWith("/"); // write file now i unified
                await writeFile(this.#fsRoot, this.path + src, isDir ? await getDirectoryHandle(this.#fsRoot, src, { create: false }) : (await getFileHandle(this.#fsRoot, src, { create: false })));
                if (this.#clipboard?.cut) { await remove(this.#fsRoot, src); }
            }

            //
            this.#clipboard = null;
        } catch (e) { console.warn(e); }
    }

    //
    public async onDrop(ev: DragEvent) {
        ev.preventDefault();
        const dt = ev.dataTransfer;
        if (!dt) return;

        const tasks: Promise<any>[] = [];

        // 1. Handle standard files and directories via webkitGetAsEntry / getAsEntry
        const items = Array.from(dt.items || []);
        for (const item of items) {
            console.log(item);
            /*
            const entry = item.webkitGetAsEntry?.() || (item as any).getAsEntry?.();
            if (entry) {
                tasks.push(this.handleEntry(entry, (this.path || "/user/")));
                continue;
            }*/
            // Fallback for simple files if getAsEntry not supported/available
            /*if (item.kind === 'file') {
                const f = item.getAsFile();
                if (f) tasks.push(writeFile(this.#fsRoot, (this.path || "/user/") + f.name, f));
            } else*/
            if (item.kind === 'file') {
                // @ts-ignore
                const d = await (item as any)?.getAsFileSystemHandle?.();
                if (d instanceof FileSystemDirectoryHandle) {
                    const nwd = await getDirectoryHandle(this.#fsRoot, (this.path || "/user/") + ((item as any)?.name || (d as any)?.name)?.trim?.()?.replace?.(/\s+/g, '-'), { create: true });
                    if (nwd) tasks.push(copyFromOneHandlerToAnother(d as any, nwd as any, { create: true }));
                } else if (d instanceof FileSystemFileHandle) {
                    const file = await d.getFile();
                    tasks.push(writeFile(this.#fsRoot, (this.path || "/user/") + ((file as any)?.name || (file as any)?.name)?.trim?.()?.replace?.(/\s+/g, '-'), file as any));
                }
            }
        }

        // 2. Handle fallback files if items API was empty/failed
        if (tasks.length === 0 && dt.files.length > 0) {
            for (let i = 0; i < dt.files.length; i++) {
                const f = dt.files[i];
                tasks.push(writeFile(this.#fsRoot, (this.path || "/user/") + f.name, f));
            }
        }

        // 3. URLs
        const uriList = dt.getData("text/uri-list") || dt.getData("text/plain");
        if (uriList) {
            const urls = uriList.split(/\r?\n/).filter(Boolean);
            for (const url of urls) {
                // Skip if it looks like a local file path we might have already processed
                if (url.startsWith("file://")) continue;

                tasks.push(Promise.try(async () => {
                    const file = await provide(url);
                    if (file) await writeFile(this.#fsRoot, (this.path || "/user/") + file.name, file);
                }));
            }
        }
        Promise.allSettled(tasks).catch(console.warn.bind(console));
    }

    // Recursive entry handler
    private async handleEntry(entry: any, targetPath: string) {
        if (entry.isFile) {
            const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
            await writeFile(this.#fsRoot, targetPath + entry.name, file);
        } else if (entry.isDirectory) {
            const newDir = targetPath + entry.name + "/";
            // Ensure directory exists (writeFile handles parent dirs, but explicitly creating empty dirs is good)
            // Assuming writeFile/openDirectory logic handles creation implicitly or explicit mkdir needed
            // Here we just rely on writing files *into* it, or could explicitly create:
            await openDirectory(this.#fsRoot, newDir, { create: true });

            const reader = entry.createReader();
            const readEntries = async () => {
                const entries = await new Promise<any[]>((resolve, reject) => reader.readEntries(resolve, reject));
                if (entries.length > 0) {
                    await Promise.all(entries.map(e => this.handleEntry(e, newDir)));
                    await readEntries(); // Continue reading (readEntries might not return all at once)
                }
            };
            await readEntries();
        }
    }


}

export default FileOperative;
