/*
 * Filename: entry-sort.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/entry-sort.ts
 * FIND:explorer
 * Change date and time: 22.30.00_29.08.2026
 * Reason for changes: Explorer list sort — name, date, type, size, kind.
 */

export const EXPLORER_SORT_EVENT = "cwsp:explorer-sort-change";
const STORAGE_KEY = "cwsp-explorer-sort";

export type ExplorerSortBy = "name" | "date" | "type" | "size" | "kind";
export type SortDirection = "asc" | "desc";

export type ExplorerSortPrefs = {
    sortBy: ExplorerSortBy;
    sortDir: SortDirection;
    foldersFirst: boolean;
};

export const EXPLORER_SORT_OPTIONS: Array<[ExplorerSortBy, string]> = [
    ["name", "Name"],
    ["date", "Date modified"],
    ["type", "Type"],
    ["size", "Size"],
    ["kind", "Kind (file / folder)"]
];

const SORT_SET = new Set<ExplorerSortBy>(EXPLORER_SORT_OPTIONS.map(([v]) => v));

export type SortableEntry = {
    name?: string;
    kind?: string;
    type?: string;
    size?: number;
    lastModified?: number;
    file?: { type?: string; size?: number; lastModified?: number };
};

export const normalizeExplorerSortBy = (raw: unknown, fallback: ExplorerSortBy = "name"): ExplorerSortBy => {
    const v = String(raw || "")
        .trim()
        .toLowerCase();
    if (v === "modified" || v === "mtime" || v === "updated") return "date";
    if (v === "mime" || v === "ext" || v === "extension") return "type";
    if (v === "bytes" || v === "length") return "size";
    if (v === "folder" || v === "folders") return "kind";
    return SORT_SET.has(v as ExplorerSortBy) ? (v as ExplorerSortBy) : fallback;
};

export const normalizeSortDir = (raw: unknown, fallback: SortDirection = "asc"): SortDirection => {
    const v = String(raw || "")
        .trim()
        .toLowerCase();
    if (v === "desc" || v === "descending" || v === "newest" || v === "z-a") return "desc";
    if (v === "asc" || v === "ascending" || v === "oldest" || v === "a-z") return "asc";
    return fallback;
};

export const defaultDirForExplorerSort = (sortBy: ExplorerSortBy): SortDirection =>
    sortBy === "date" || sortBy === "size" ? "desc" : "asc";

export const peekExplorerSort = (): ExplorerSortPrefs => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<ExplorerSortPrefs>;
            const sortBy = normalizeExplorerSortBy(parsed.sortBy);
            return {
                sortBy,
                sortDir: normalizeSortDir(parsed.sortDir, defaultDirForExplorerSort(sortBy)),
                foldersFirst: parsed.foldersFirst !== false
            };
        }
    } catch {
        /* private mode */
    }
    return { sortBy: "name", sortDir: "asc", foldersFirst: true };
};

export const writeExplorerSort = (prefs: Partial<ExplorerSortPrefs>): ExplorerSortPrefs => {
    const cur = peekExplorerSort();
    const sortBy = prefs.sortBy != null ? normalizeExplorerSortBy(prefs.sortBy, cur.sortBy) : cur.sortBy;
    const next: ExplorerSortPrefs = {
        sortBy,
        sortDir:
            prefs.sortDir != null ? normalizeSortDir(prefs.sortDir, defaultDirForExplorerSort(sortBy)) : cur.sortDir,
        foldersFirst: prefs.foldersFirst != null ? Boolean(prefs.foldersFirst) : cur.foldersFirst
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        /* quota */
    }
    try {
        window.dispatchEvent(new CustomEvent(EXPLORER_SORT_EVENT, { detail: next }));
    } catch {
        /* no window */
    }
    return next;
};

const cmpStr = (a: string, b: string): number =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) || a.localeCompare(b);

const cmpNum = (a: number, b: number): number => (a === b ? 0 : a < b ? -1 : 1);

const extOf = (name: string): string => {
    const n = String(name || "").trim();
    const cut = n.lastIndexOf(".");
    return cut > 0 ? n.slice(cut + 1).toLowerCase() : "";
};

const typeOf = (item: SortableEntry): string => {
    const mime = String(item.type || item.file?.type || "")
        .trim()
        .toLowerCase();
    if (mime) return mime;
    return extOf(String(item.name || ""));
};

const kindOf = (item: SortableEntry): string => {
    const k = String(item.kind || "").toLowerCase();
    return k === "directory" || k === "folder" ? "directory" : "file";
};

const mtimeOf = (item: SortableEntry): number =>
    Number(item.lastModified || item.file?.lastModified || 0) || 0;

const sizeOf = (item: SortableEntry): number => Number(item.size ?? item.file?.size ?? 0) || 0;

export const sortExplorerEntries = <T extends SortableEntry>(entries: T[], prefs: ExplorerSortPrefs): T[] => {
    const dir = prefs.sortDir === "desc" ? -1 : 1;
    return [...entries].sort((left, right) => {
        if (prefs.foldersFirst) {
            const folders = Number(kindOf(left) === "file") - Number(kindOf(right) === "file");
            if (folders) return folders;
        }
        let n = 0;
        if (prefs.sortBy === "date") n = cmpNum(mtimeOf(left), mtimeOf(right));
        else if (prefs.sortBy === "type") n = cmpStr(typeOf(left), typeOf(right));
        else if (prefs.sortBy === "size") n = cmpNum(sizeOf(left), sizeOf(right));
        else if (prefs.sortBy === "kind") n = cmpStr(kindOf(left), kindOf(right));
        else n = cmpStr(String(left.name || ""), String(right.name || ""));
        if (!n) n = cmpStr(String(left.name || ""), String(right.name || ""));
        return n * dir;
    });
};
