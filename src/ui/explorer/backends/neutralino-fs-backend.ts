/*
 * Filename: neutralino-fs-backend.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/backends/neutralino-fs-backend.ts
 * FIND:explorer
 * Change date: 13.40.00_27.08.2026
 * Reason: Desktop Neutralino home tree as `/desktop/` FsBackend (CRX/Capacitor skip).
 */

import { normalizeVirtualPath, type FileEntryLike, type FsBackend } from "../fs-backend.js";

export const DESKTOP_ROOT = "/desktop/";

type NeutralinoDirEntry = {
    entry?: string;
    type?: string;
};

type NeutralinoFilesystem = {
    readDirectory?: (path: string) => Promise<NeutralinoDirEntry[]>;
    createDirectory?: (path: string) => Promise<void>;
    remove?: (path: string) => Promise<void>;
    move?: (source: string, dest: string) => Promise<void>;
    writeBinaryFile?: (path: string, data: ArrayBuffer | Uint8Array) => Promise<void>;
    writeFile?: (path: string, data: string) => Promise<void>;
};

type NeutralinoOs = {
    getPath?: (name: string) => Promise<string>;
};

const neu = (): { filesystem?: NeutralinoFilesystem; os?: NeutralinoOs } | null => {
    try {
        return ((globalThis as { Neutralino?: { filesystem?: NeutralinoFilesystem; os?: NeutralinoOs } })
            .Neutralino ?? null);
    } catch {
        return null;
    }
};

export const isNeutralinoFilesystemAvailable = (): boolean =>
    typeof neu()?.filesystem?.readDirectory === "function";

export const resolveNeutralinoHome = async (): Promise<string> => {
    const os = neu()?.os;
    if (typeof os?.getPath === "function") {
        for (const name of ["home", "documents"]) {
            try {
                const path = String(await os.getPath(name) || "").trim();
                if (path) return path;
            } catch {
                /* try next */
            }
        }
    }
    return "";
};

const joinNative = (home: string, rel: string): string => {
    const base = home.replace(/[/\\]+$/, "");
    const tail = rel.replace(/^[/\\]+/, "").replace(/[/\\]+$/, "");
    if (!tail) return base || home;
    const sep = base.includes("\\") ? "\\" : "/";
    return `${base}${sep}${tail.replace(/[/\\]+/g, sep)}`;
};

const virtualToNative = (home: string, virtualPath: string, asDirectory: boolean): string => {
    const v = normalizeVirtualPath(virtualPath, asDirectory);
    const rel = v.startsWith(DESKTOP_ROOT) ? v.slice(DESKTOP_ROOT.length) : v.replace(/^\/+/, "");
    return joinNative(home, rel);
};

export const createNeutralinoFsBackend = (homePath: string): FsBackend | null => {
    const fs = neu()?.filesystem;
    const home = String(homePath || "").trim();
    if (!home || typeof fs?.readDirectory !== "function") return null;

    return {
        root: DESKTOP_ROOT,
        writable: true,
        async list(path: string) {
            const native = virtualToNative(home, path, true);
            const rows = await fs.readDirectory!(native);
            const base = normalizeVirtualPath(path, true);
            return (Array.isArray(rows) ? rows : [])
                .map((row): FileEntryLike | null => {
                    const name = String(row?.entry || "").trim();
                    if (!name || name === "." || name === "..") return null;
                    const kind = String(row?.type || "").toUpperCase() === "DIRECTORY" ? "directory" : "file";
                    return {
                        name,
                        kind,
                        path: `${base}${name}${kind === "directory" ? "/" : ""}`
                    };
                })
                .filter((row): row is FileEntryLike => Boolean(row));
        },
        async mkdir(path: string, name: string) {
            if (typeof fs.createDirectory !== "function") {
                throw new Error("Neutralino filesystem.createDirectory unavailable");
            }
            const parent = virtualToNative(home, path, true);
            const sep = parent.includes("\\") ? "\\" : "/";
            await fs.createDirectory(`${parent}${sep}${name}`);
        },
        async remove(path: string) {
            if (typeof fs.remove !== "function") {
                throw new Error("Neutralino filesystem.remove unavailable");
            }
            await fs.remove(virtualToNative(home, path, false));
        },
        async rename(path: string, newName: string) {
            if (typeof fs.move !== "function") {
                throw new Error("Neutralino filesystem.move unavailable");
            }
            const from = virtualToNative(home, path, false);
            const parentVirt = normalizeVirtualPath(path, false).replace(/[^/]+$/, "");
            const dest = virtualToNative(home, `${parentVirt}${newName}`, false);
            await fs.move(from, dest);
        },
        async move(fromPath: string, toDirPath: string) {
            if (typeof fs.move !== "function") {
                throw new Error("Neutralino filesystem.move unavailable");
            }
            const from = virtualToNative(home, fromPath, false);
            const name = normalizeVirtualPath(fromPath, false).split("/").filter(Boolean).pop() || "";
            const dest = virtualToNative(home, `${normalizeVirtualPath(toDirPath, true)}${name}`, false);
            await fs.move(from, dest);
        },
        async writeFile(parentPath: string, file: File) {
            const dest = virtualToNative(home, `${normalizeVirtualPath(parentPath, true)}${file.name}`, false);
            const bytes = await file.arrayBuffer();
            if (typeof fs.writeBinaryFile === "function") {
                await fs.writeBinaryFile(dest, bytes);
                return;
            }
            if (typeof fs.writeFile === "function") {
                await fs.writeFile(dest, await file.text());
                return;
            }
            throw new Error("Neutralino filesystem write unavailable");
        }
    };
};
