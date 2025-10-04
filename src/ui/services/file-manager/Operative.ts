import { makeReactive, ref, subscribe } from "fest/object";

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
export class FileOperative {
    // refs/state
    #entries = makeReactive<FileEntryItem[]>([]);
    #loading = ref(false);
    #error = ref("");
    #fsRoot: any = null;
    #dirProxy: any = null;
    #loadLock = false;
    #clipboard: { items: string[]; cut?: boolean } | null = null;

    //
    public pathRef = ref("/user/");

    //
    get path() { return this.pathRef.value; }
    set path(value: string) { if (this.pathRef) this.pathRef.value = value; }
    get entries() { return this.#entries; }

    //
    constructor() {
        this.#entries = makeReactive<FileEntryItem[]>([]);
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
            const handleMap = await Promise.all(await Array.fromAsync(await this.#dirProxy?.entries?.() ?? []));

            //
            this.#entries.splice(0, this.#entries.length);
            await Promise.all(handleMap?.map?.(async ($pair: any) => {
                try {
                    const [name, handle] = $pair as any;
                    const kind: EntryKind = handle?.kind || (name?.endsWith?.("/") ? "directory" : "file");
                    const item: any = { name, kind, handle };
                    if (kind === "file") {
                        try {
                            const f = await handle?.getFile?.();
                            item.size = f?.size;
                            item.lastModified = f?.lastModified;
                            item.type = f?.type || getMimeTypeByFilename?.(name);;
                        } catch { }
                    }

                    //
                    this.#entries.push(item);
                } catch (e: any) {
                    console.warn(e);
                }
            }))?.catch?.(console.warn.bind(console));
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
                case "open": if (item?.kind === "file") { const detail = { path: abs, item }; (this as any).dispatchEvent?.(new CustomEvent("open", { detail, bubbles: true, composed: true })); } break;
                case "download": if (item?.kind === "file") { Promise.try(async () => { const fh = await this.#dirProxy?.getFileHandle?.(item?.name, { create: false }); const file = await fh?.getFile?.(); if (file) await downloadFile(file); }).catch(console.warn); } break;
                case "delete":
                    await remove(this.#fsRoot, abs);
                    await this.loadPath(this.path);
                    break;
                case "rename":
                    if (item?.kind === "file") {
                        const next = prompt("Rename to:", item?.name);
                        if (next && next !== item?.name) {
                            await this.renameFile(item?.name, next);
                            await this.loadPath(this.path);
                        }
                    }
                    break;
                case "copy":
                    this.#clipboard = { items: [abs], cut: false };
                    try { await navigator.clipboard?.writeText?.(abs); } catch { }
                    break;
                case "move":
                    this.#clipboard = { items: [abs], cut: true };
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
            await this.loadPath(this.path);
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

            const toDir = await getDirectoryHandle(this.#fsRoot, this.path, { create: true });
            for (const src of sources) {
                // fallback: detect via getHandler not exported; instead derive by trailing slash
                const isDir = src.endsWith("/");
                if (isDir) {
                    const fromDir = await getDirectoryHandle(this.#fsRoot, src, { create: false });
                    await copyFromOneHandlerToAnother(fromDir as any, toDir as any);
                } else {
                    const fromFile = await getFileHandle(this.#fsRoot, src, { create: false });
                    const toFile = await toDir?.getFileHandle?.(src.split("/").pop() || "file", { create: true });
                    await copyFromOneHandlerToAnother(fromFile as any, toFile as any);
                }
                if (this.#clipboard?.cut) { await remove(this.#fsRoot, src); }
            }
            this.#clipboard = null;
            await this.loadPath(this.path);
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
        Promise.allSettled(tasks).then(() => this.loadPath(this.path)).catch(console.warn);
    }


}

export default FileOperative;
