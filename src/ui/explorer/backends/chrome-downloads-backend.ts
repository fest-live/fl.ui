/*
 * Filename: chrome-downloads-backend.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/backends/chrome-downloads-backend.ts
 * FIND:explorer
 * Change date: 13.48.00_27.08.2026
 * Reason: CRX `chrome.downloads` as a read-only `/downloads/` FsBackend.
 */

import { type FileEntryLike, type FsBackend } from "../fs-backend.ts";

export const DOWNLOADS_ROOT = "/downloads/";

type ChromeDownloadItem = {
    id?: number;
    filename?: string;
    url?: string;
    exists?: boolean;
    state?: string;
};

type ChromeDownloadsApi = {
    search?: (query: Record<string, unknown>) => Promise<ChromeDownloadItem[]>;
    show?: (id: number) => void;
    open?: (id: number) => Promise<void> | void;
};

const fileNameOf = (item: ChromeDownloadItem): string => {
    const raw = String(item.filename || item.url || "").trim();
    if (!raw) return `download-${item.id ?? "0"}`;
    const parts = raw.split(/[/\\]/).filter(Boolean);
    return parts[parts.length - 1] || raw;
};

export const createChromeDownloadsBackend = (downloads: ChromeDownloadsApi | null | undefined): FsBackend | null => {
    if (typeof downloads?.search !== "function") return null;
    return {
        root: DOWNLOADS_ROOT,
        writable: false,
        async list() {
            const rows = await downloads.search!({});
            return (Array.isArray(rows) ? rows : [])
                .filter((item) => item && item.exists !== false && String(item.state || "") !== "interrupted")
                .map((item): FileEntryLike => {
                    const id = String(item.id ?? fileNameOf(item));
                    return {
                        name: fileNameOf(item),
                        kind: "file",
                        path: `${DOWNLOADS_ROOT}${id}`
                    };
                });
        }
    };
};

export const revealChromeDownload = (downloads: ChromeDownloadsApi | null | undefined, id: number): void => {
    if (typeof downloads?.show === "function") downloads.show(id);
};
