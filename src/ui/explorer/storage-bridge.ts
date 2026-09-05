/*
 * Filename: storage-bridge.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/storage-bridge.ts
 * FIND:file-markdown
 * Change date: 14.30.00_05.09.2026
 * Reason: storage:write / create-document for Capacitor Save.
 */

import { toExplorerStoragePath } from "./fs-backend";

export type StorageEntry = {
    name: string;
    kind: "file" | "directory";
    path?: string;
    size?: number;
    lastModified?: number;
};

export type AllFilesStatus = {
    allFilesAccess: boolean;
    runtimeGranted?: boolean;
    note?: string;
};

export type ExplorerStorageApi = {
    list?: (root: "sdcard" | "saf", path?: string) => Promise<StorageEntry[]>;
    pickSaf?: () => Promise<string>;
    allFilesStatus?: () => Promise<AllFilesStatus>;
    requestAllFiles?: () => Promise<boolean>;
};

let api: ExplorerStorageApi | null = null;

export const setExplorerStorageApi = (next: ExplorerStorageApi | null): void => {
    api = next;
};

const INVOKE_MS = 12_000;

const withTimeout = async <T>(task: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            task,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), ms);
            })
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

const capacitorInvoke = async (
    channel: string,
    payload: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
    const g = globalThis as {
        __CWS_BRIDGE_PLUGIN__?: { invoke?: Function };
        Capacitor?: { Plugins?: { CwsBridge?: { invoke?: Function } } };
    };
    const plugin = g.__CWS_BRIDGE_PLUGIN__ || g.Capacitor?.Plugins?.CwsBridge;
    if (typeof plugin?.invoke !== "function") return { ok: false, error: "no-bridge" };
    /* WHY: storage:read on the UI thread + Binder-sized data URLs never resolve — viewer stayed on Loading. */
    const r = await withTimeout(
        Promise.resolve(plugin.invoke({ channel, payload })) as Promise<Record<string, unknown> | null>,
        INVOKE_MS,
        { ok: false, error: "timeout" }
    );
    const echo = r?.echo && typeof r.echo === "object" ? (r.echo as Record<string, unknown>) : {};
    return { ...(r || {}), ...echo };
};

/**
 * WHY: Speed Dial / shortcuts store `file:///storage/emulated/0/…`, `/mnt/sdcard/…`,
 * or `sdcard/…`. CwsStorageHost only understands `/sdcard/` `/saf/`.
 */
export const toNativeStorageVirtualPath = (raw: string): string => {
    let s = String(raw || "").trim();
    if (!s) return "";
    try {
        s = decodeURIComponent(s);
    } catch {
        /* keep raw */
    }
    const mapped = toExplorerStoragePath(s, false);
    return /^\/(?:sdcard|saf)(?:\/|$)/i.test(mapped) ? mapped : "";
};

const parseNativeStoragePath = (
    virtualPath: string
): { root: "sdcard" | "saf"; rel: string } | null => {
    const raw = toNativeStorageVirtualPath(virtualPath) || String(virtualPath || "").trim();
    if (!raw) return null;
    const root: "sdcard" | "saf" | "" =
        raw === "/saf" || raw.startsWith("/saf/")
            ? "saf"
            : raw === "/sdcard" || raw.startsWith("/sdcard/")
              ? "sdcard"
              : "";
    if (!root) return null;
    if (raw === `/${root}`) return { root, rel: "/" };
    const prefix = root === "saf" ? "/saf/" : "/sdcard/";
    const rel = raw.startsWith(prefix) ? raw.slice(prefix.length - 1) : raw;
    return { root, rel: rel || "/" };
};

export const isNativeStorageAvailable = (): boolean => {
    if (api?.list) return true;
    try {
        const c = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        return typeof c?.isNativePlatform === "function" && c.isNativePlatform();
    } catch {
        return false;
    }
};

export const listNativeStorage = async (
    root: "sdcard" | "saf",
    path = "/"
): Promise<StorageEntry[]> => {
    if (api?.list) return api.list(root, path);
    const echo = await capacitorInvoke("storage:list", { root, path });
    const rows = (echo.entries || echo.files) as StorageEntry[] | undefined;
    return Array.isArray(rows) ? rows : [];
};

const dataUrlToFile = async (dataUrl: string, name: string, mime: string): Promise<File | null> => {
    const src = String(dataUrl || "").trim();
    if (!src) return null;
    const fileName = name || "file";
    const fallbackType = mime || "application/octet-stream";
    /* WHY: Capacitor WebView COEP blocks fetch(data:) — decode bytes here. */
    if (src.startsWith("data:")) {
        const comma = src.indexOf(",");
        if (comma < 0) return null;
        const meta = src.slice(5, comma);
        const payload = src.slice(comma + 1);
        const type = meta.split(";")[0] || fallbackType;
        try {
            if (/;base64/i.test(meta)) {
                const bin = atob(payload);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new File([bytes], fileName, { type });
            }
            return new File([decodeURIComponent(payload)], fileName, { type });
        } catch {
            return null;
        }
    }
    if (/^[A-Za-z0-9+/=\s]+$/.test(src) && src.length > 16) {
        try {
            const bin = atob(src.replace(/\s/g, ""));
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return new File([bytes], fileName, { type: fallbackType });
        } catch {
            /* not raw base64 */
        }
    }
    try {
        const blob = await (await fetch(src)).blob();
        return new File([blob], fileName, { type: blob.type || fallbackType });
    } catch {
        return null;
    }
};

/** Read one `/sdcard/` or `/saf/` file through CwsBridge (`storage:read`). */
export const readNativeStorageFile = async (
    virtualPath: string,
    opts?: { requestAccess?: boolean }
): Promise<File | null> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return null;
    const readOnce = async (): Promise<{ file: File | null; error: string }> => {
        const echo = await capacitorInvoke("storage:read", { root: parsed.root, path: parsed.rel });
        const name = String(echo.name || virtualPath.split("/").filter(Boolean).pop() || "file");
        const mime = String(echo.mime || echo.mimeType || "application/octet-stream");
        const error = String(echo.error || "");
        const text = String(echo.text || echo.content || "");
        if (text) {
            return { file: new File([text], name, { type: mime || "text/markdown" }), error };
        }
        const data = String(echo.data || echo.dataUrl || "");
        if (data) {
            return { file: await dataUrlToFile(data, name, mime), error };
        }
        return { file: null, error };
    };
    let got = await readOnce();
    if (got.file) return got.file;
    /* WHY: Opening Settings mid-await pauses the WebView — Document path bar stayed on Loading. */
    if (opts?.requestAccess === false) return null;
    if (parsed.root === "sdcard") {
        const denied = /all-files-required|permission|EACCES|denied|timeout/i.test(got.error);
        const status = await getAllFilesStatus();
        if (denied || !status.allFilesAccess) {
            await requestAllFilesAccess();
            got = await readOnce();
        }
    }
    return got.file;
};

/** content:// or file:// for Document ACTION_VIEW — do not read bytes. */
export const resolveNativeStorageUri = async (virtualPath: string): Promise<string> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return "";
    const echo = await capacitorInvoke("storage:uri", { root: parsed.root, path: parsed.rel });
    return String(echo.uri || echo.url || "").trim();
};

/** Put `/sdcard/` `/saf/` image on the Android clipboard (ClipData URI). */
export const copyNativeStorageImage = async (virtualPath: string): Promise<boolean> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return false;
    const echo = await capacitorInvoke("storage:copy-image", { root: parsed.root, path: parsed.rel });
    return echo.copied === true || echo.ok === true;
};

/** Bytes (data URL) → cache FileProvider URI → system clipboard. */
export const writeNativeClipboardImage = async (
    dataUrl: string,
    mimeType = "image/png",
    name = "image.png"
): Promise<boolean> => {
    const data = String(dataUrl || "").trim();
    if (!data) return false;
    const echo = await capacitorInvoke("clipboard:write-local-image", {
        data,
        mimeType: String(mimeType || "image/png"),
        name: String(name || "image.png")
    });
    return echo.copied === true || echo.ok === true;
};

const writeEchoOk = (echo: Record<string, unknown>): boolean =>
    echo.written === true || echo.ok === true;

/** Write UTF-8 text to `/sdcard/` or `/saf/` (creates parents + file). */
export const writeNativeStorageFile = async (
    virtualPath: string,
    content: string,
    opts?: { mimeType?: string; requestAccess?: boolean }
): Promise<boolean> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return false;
    const payload = {
        root: parsed.root,
        path: parsed.rel,
        text: String(content ?? ""),
        mimeType: String(opts?.mimeType || "text/markdown")
    };
    const echo = await capacitorInvoke("storage:write", payload);
    if (writeEchoOk(echo)) return true;
    if (opts?.requestAccess === false) return false;
    if (parsed.root === "sdcard") {
        const denied = /all-files-required|permission|EACCES|denied/i.test(String(echo.error || ""));
        if (denied) {
            await requestAllFilesAccess();
            const again = await capacitorInvoke("storage:write", payload);
            return writeEchoOk(again);
        }
    }
    return false;
};

/** Overwrite a remembered `content://` / `file://` from ACTION_CREATE_DOCUMENT. */
export const writeNativeStorageUri = async (uri: string, content: string): Promise<boolean> => {
    const target = String(uri || "").trim();
    if (!target) return false;
    const echo = await capacitorInvoke("storage:write-uri", {
        uri: target,
        text: String(content ?? "")
    });
    return writeEchoOk(echo);
};

export type NativeCreateDocumentResult = {
    ok: boolean;
    cancelled?: boolean;
    uri?: string;
};

const nativeBridgePlugin = (): { invoke?: Function } | null => {
    const g = globalThis as {
        __CWS_BRIDGE_PLUGIN__?: { invoke?: Function };
        Capacitor?: { Plugins?: { CwsBridge?: { invoke?: Function } } };
    };
    return g.__CWS_BRIDGE_PLUGIN__ || g.Capacitor?.Plugins?.CwsBridge || null;
};

/** WHY: Android MimeTypeMap maps `.ts` → `video/mp2t`. CREATE_DOCUMENT then
 * treats TypeScript as MPEG-TS or rewrites the extension. Octet-stream keeps the name. */
export const saveDocumentMimeForName = (filename: string, fallback = "text/markdown"): string => {
    const n = String(filename || "").trim().toLowerCase();
    if (/\.(tsx?|mts|cts|jsx?|mjs|cjs|css|scss|sass|less|vue|svelte|json|xml|ya?ml|sh|bash|py|rs|go|java|kt)$/.test(n)) {
        return "application/octet-stream";
    }
    if (n.endsWith(".md") || n.endsWith(".markdown")) return "text/markdown";
    if (n.endsWith(".txt") || n.endsWith(".log") || n.endsWith(".csv")) return "text/plain";
    if (n.endsWith(".html") || n.endsWith(".htm")) return "text/html";
    if (n.endsWith(".svg")) return "image/svg+xml";
    return fallback;
};

const mimeFromSavePickerOptions = (options?: {
    suggestedName?: string;
    types?: Array<{ accept?: Record<string, string[]> }>;
}): string => {
    const name = String(options?.suggestedName || "").trim();
    const fromName = saveDocumentMimeForName(name, "");
    if (fromName) return fromName;
    const accept = options?.types?.[0]?.accept;
    if (accept && typeof accept === "object") {
        const first = Object.keys(accept).find((key) => key && key !== "*/*" && !key.startsWith("video/"));
        if (first) return first;
    }
    return "text/markdown";
};

const invokeCreateDocument = async (
    filename: string,
    content: string,
    mimeType: string
): Promise<NativeCreateDocumentResult> => {
    const plugin = nativeBridgePlugin();
    if (typeof plugin?.invoke !== "function") return { ok: false };
    const r = (await Promise.resolve(plugin.invoke({
        channel: "storage:create-document",
        payload: { name: filename, text: String(content ?? ""), mimeType }
    })) as { ok?: boolean; error?: string; echo?: { uri?: string; written?: boolean; error?: string; ok?: boolean } } | null);
    const echo = (r?.echo || {}) as Record<string, unknown>;
    const err = String(echo.error || r?.error || "");
    if (/cancel/i.test(err)) return { ok: false, cancelled: true };
    const uri = String(echo.uri || echo.url || "").trim();
    if (uri && content && echo.written !== true) {
        if (await writeNativeStorageUri(uri, content)) return { ok: true, uri };
    }
    const ok = r?.ok !== false && (echo.written === true || echo.ok === true || Boolean(uri));
    return ok ? { ok: true, uri: uri || undefined } : { ok: false };
};

type NativeSaveHandle = FileSystemFileHandle & { __cwsNativeUri?: string };

const nativeFileHandle = (uri: string, name: string): NativeSaveHandle => {
    const chunks: BlobPart[] = [];
    const handle = {
        kind: "file" as const,
        name,
        __cwsNativeUri: uri,
        queryPermission: async () => "granted" as const,
        requestPermission: async () => "granted" as const,
        getFile: async () => new File([], name),
        createWritable: async () => ({
            write: async (chunk: BlobPart | { type?: string; data?: BlobPart }) => {
                const data = chunk && typeof chunk === "object" && "data" in chunk ? chunk.data : chunk;
                if (data != null && (typeof data === "string" || data instanceof Blob || ArrayBuffer.isView(data) || data instanceof ArrayBuffer)) {
                    chunks.push(data as BlobPart);
                }
            },
            close: async () => {
                const blob = new Blob(chunks);
                const text = await blob.text();
                chunks.length = 0;
                if (!(await writeNativeStorageUri(uri, text))) {
                    throw new DOMException("Write failed.", "InvalidStateError");
                }
            },
            abort: async () => {
                chunks.length = 0;
            }
        })
    };
    return handle as NativeSaveHandle;
};

/**
 * Capacitor stand-in for `showSaveFilePicker`: ACTION_CREATE_DOCUMENT, then write.
 * WHY: Android WebView has no FSA picker; this call waits on the system sheet (no 12s cap).
 */
export const createNativeStorageDocument = async (
    filename: string,
    content: string,
    mimeType = "text/markdown"
): Promise<NativeCreateDocumentResult> => {
    if (!isNativeStorageAvailable()) return { ok: false };
    const name = String(filename || "document.md").trim() || "document.md";
    return invokeCreateDocument(name, content, mimeType || saveDocumentMimeForName(name));
};

export const nativeUriFromSaveHandle = (handle: FileSystemFileHandle | null | undefined): string =>
    String((handle as NativeSaveHandle | null | undefined)?.__cwsNativeUri || "").trim();

/**
 * Overwrite WebView `showSaveFilePicker` (stub / NotAllowedError) with ACTION_CREATE_DOCUMENT.
 * INVARIANT: only on Capacitor; web/PWA/CRX keep the browser picker.
 */
export const installNativeShowSaveFilePicker = (): boolean => {
    if (!isNativeStorageAvailable()) return false;
    const g = globalThis as {
        showSaveFilePicker?: (opts?: Record<string, unknown>) => Promise<FileSystemFileHandle>;
        __CWS_NATIVE_SAVE_PICKER__?: boolean;
    };
    if (g.__CWS_NATIVE_SAVE_PICKER__ && typeof g.showSaveFilePicker === "function") return true;
    g.showSaveFilePicker = async (options?: Record<string, unknown>) => {
        const opts = (options || {}) as {
            suggestedName?: string;
            types?: Array<{ accept?: Record<string, string[]> }>;
        };
        const name = String(opts.suggestedName || "document.md").trim() || "document.md";
        const mime = mimeFromSavePickerOptions(opts);
        const created = await invokeCreateDocument(name, "", mime);
        if (created.cancelled) {
            throw new DOMException("The user aborted a request.", "AbortError");
        }
        if (!created.uri) {
            throw new DOMException("Could not create file.", "InvalidStateError");
        }
        return nativeFileHandle(created.uri, name);
    };
    g.__CWS_NATIVE_SAVE_PICKER__ = true;
    return true;
};

/** Delete a `/sdcard/` or `/saf/` file or folder through CwsBridge (`storage:delete`). */
export const removeNativeStorage = async (virtualPath: string): Promise<void> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) throw new Error("not native storage");
    const plugin = (globalThis as { Capacitor?: { Plugins?: { CwsBridge?: { invoke?: Function } } } })
        .Capacitor?.Plugins?.CwsBridge;
    if (typeof plugin?.invoke !== "function") throw new Error("no native storage");
    const r = (await plugin.invoke({
        channel: "storage:delete",
        payload: { root: parsed.root, path: parsed.rel }
    })) as { ok?: boolean; echo?: { deleted?: boolean; error?: string; ok?: boolean } };
    const echo = r?.echo || {};
    if (r?.ok === false || echo.deleted !== true) {
        throw new Error(String(echo.error || "delete failed"));
    }
};

/** ACTION_SEND chooser — Android share sheet, no JS byte hop. */
export const shareNativeStorageFile = async (
    virtualPath: string,
    opts: { mimeType?: string; title?: string } = {}
): Promise<boolean> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return false;
    const mimeType = String(opts.mimeType || "").trim();
    const title = String(opts.title || "Share").trim();
    const echo = await capacitorInvoke("storage:share", {
        root: parsed.root,
        path: parsed.rel,
        ...(mimeType ? { mimeType } : {}),
        ...(title ? { title } : {})
    });
    return echo.opened === true || echo.sent === true || echo.ok === true;
};

/** Absolute `/storage/emulated/0/…` or SAF `content://` URI. */
export const resolveNativeStorageRealPath = async (virtualPath: string): Promise<string> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return "";
    const echo = await capacitorInvoke("storage:realpath", { root: parsed.root, path: parsed.rel });
    return String(echo.path || echo.uri || echo.url || "").trim();
};

/**
 * WHY: Capacitor Explorer must open `/sdcard/` / `/saf/` in one native hop
 * (FileProvider + SEND/VIEW). Reading bytes in JS then hopping URI often never launches.
 */
export const openNativeStorageFile = async (
    virtualPath: string,
    opts: { chooser?: boolean; packageName?: string; mimeType?: string; title?: string } = {}
): Promise<boolean> => {
    const parsed = parseNativeStoragePath(virtualPath);
    if (!parsed) return false;
    const packageName = String(opts.packageName || "").trim();
    const mimeType = String(opts.mimeType || "").trim();
    const title = String(opts.title || (packageName ? "Open" : "Open with")).trim();
    const echo = await capacitorInvoke("storage:open", {
        root: parsed.root,
        path: parsed.rel,
        chooser: packageName ? opts.chooser === true : opts.chooser !== false,
        ...(packageName ? { packageName } : {}),
        ...(mimeType ? { mimeType } : {}),
        ...(title ? { title } : {})
    });
    if (echo.opened === true || echo.sent === true || echo.ok === true) return true;
    const err = String(echo.error || "");
    if (err === "all-files-required" || (parsed.root === "sdcard" && err === "not a file")) {
        const status = await getAllFilesStatus();
        if (!status.allFilesAccess) await requestAllFilesAccess();
    }
    return false;
};

/**
 * WHY: Document / Process do not import Explorer path-router, so `provide("/sdcard/…")`
 * had no backend and the viewer stayed empty.
 */
export const ensureNativeStorageProvide = async (): Promise<void> => {
    if (!isNativeStorageAvailable()) return;
    try {
        const { registerProvideBackend } = await import("@fest-lib/lure");
        const bind = (root: "/sdcard/" | "/saf/"): void => {
            registerProvideBackend({
                root,
                list: async (path) => {
                    const parsed = parseNativeStoragePath(String(path || root));
                    const rows = await listNativeStorage(
                        parsed?.root || (root === "/saf/" ? "saf" : "sdcard"),
                        parsed?.rel || "/"
                    );
                    const base = String(path || root).endsWith("/") ? String(path || root) : `${path || root}/`;
                    return rows
                        .filter((row) => row?.name)
                        .map((row) => ({
                            name: String(row.name),
                            kind: row.kind === "directory" ? "directory" : "file",
                            path: row.path || `${base}${row.name}${row.kind === "directory" ? "/" : ""}`
                        }));
                },
                readFile: (path) => readNativeStorageFile(path),
                writeFile: async (path, file) => {
                    const text = await file.text().catch(() => "");
                    return writeNativeStorageFile(path, text, { mimeType: file.type || "text/markdown" });
                }
            });
        };
        bind("/sdcard/");
        bind("/saf/");
    } catch {
        /* web / lure missing */
    }
};

export const pickSafTree = async (): Promise<string> => {
    if (api?.pickSaf) return api.pickSaf();
    const echo = await capacitorInvoke("storage:pick-saf", {});
    return String(echo.uri || echo.treeUri || "");
};

export const getAllFilesStatus = async (): Promise<AllFilesStatus> => {
    if (api?.allFilesStatus) return api.allFilesStatus();
    const echo = await capacitorInvoke("storage:all-files-status", {});
    return {
        allFilesAccess: echo.allFilesAccess === true,
        runtimeGranted: echo.runtimeGranted === true,
        note: echo.note ? String(echo.note) : undefined
    };
};

export const requestAllFilesAccess = async (): Promise<boolean> => {
    if (api?.requestAllFiles) return api.requestAllFiles();
    const echo = await capacitorInvoke("storage:all-files-request", {});
    return echo.ok === true || echo.opened === true;
};

export const canShowDirectoryPicker = (): boolean =>
    typeof (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";

export const pickBrowserDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
    const pick = (globalThis as { showDirectoryPicker?: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker;
    if (typeof pick !== "function") return null;
    try {
        return await pick({ mode: "readwrite" });
    } catch {
        return null;
    }
};
