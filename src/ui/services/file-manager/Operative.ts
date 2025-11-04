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
    provide
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
        if (item?.kind === "directory") {
            const next = (self.path?.endsWith?.("/") ? self.path : self.path + "/") + item?.name + "/";
            self.path = next;
        } else {
            const detail = { path: (self.path || "/user/") + item?.name, item };
            self.path = detail.path;
            self.dispatchEvent?.(new CustomEvent("open", { detail, bubbles: true, composed: true }));
        }
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
                                        if (item) {
                                            item.size = f?.size;
                                            item.lastModified = f?.lastModified;
                                            item.type = f?.type || item.type;
                                        }
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

    //
    protected async onMenuAction(item: FileEntryItem | null, actionId: string, ev: MouseEvent) {
        try {
            if (!actionId) return; const abs = (this.path || "/user/") + (item?.name || ""); switch (actionId) {
                case "open":
                    this.itemAction(item as FileEntryItem);
                    break;
                case "download":
                    Promise.try(async () => {
                        if (item?.kind === "file") {
                            await downloadFile(await this.#dirProxy?.getFileHandle?.(item?.name, { create: false }));
                        } else {
                            await downloadFile(await this.#dirProxy?.getDirectoryHandle?.(item?.name, { create: false }));
                        }
                    }).catch(console.warn);
                     break;
                case "delete":
                    await remove(this.#fsRoot, abs);
                    break;
                case "rename":
                    if (item?.kind === "file") {
                        const next = prompt("Rename to:", item?.name);
                        if (next && next !== item?.name) {
                            await this.renameFile(item?.name, next);
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
        const fromHandle = await this.#dirProxy?.getFileHandle?.(oldName, { create: false });
        const file = await fromHandle?.getFile?.();
        if (!file) return;
        const target = await this.#dirProxy?.getFileHandle?.(newName, { create: true }).catch(() => null);
        if (!target) {
            await writeFile(this.#fsRoot, (this.path || "/user/") + newName, file);
        } else {
            await writeFile(this.#fsRoot, (this.path || "/user/") + newName, file);
        }
        await remove(this.#fsRoot, (this.path || "/user/") + oldName);
    }

    //
    async requestUpload() {
        try {
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
    public onDrop(ev: DragEvent) {
        ev.preventDefault();
        const dt = ev.dataTransfer;
        if (!dt) return;
        const files = dt.files;
        const tasks: Promise<any>[] = [];
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            tasks.push(writeFile(this.#fsRoot, (this.path || "/user/") + f.name, f));
        }

        // URLs
        const uriList = dt.getData("text/uri-list") || dt.getData("text/plain");
        if (uriList) {
            const urls = uriList.split(/\r?\n/).filter(Boolean);
            for (const url of urls) {
                tasks.push(Promise.try(async () => {
                    const file = await provide(url);
                    if (file) await writeFile(this.#fsRoot, (this.path || "/user/") + file.name, file);
                }));
            }
        }
        Promise.allSettled(tasks).catch(console.warn.bind(console));
    }


}

export default FileOperative;
