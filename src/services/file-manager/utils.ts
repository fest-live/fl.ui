/**
 * Shared utilities for file manager components
 *
 * Extracted common functionality from RsExplorer and FileManagerContent
 */

// ============================================================================
// ICON MAPPING
// ============================================================================

/**
 * Get icon name by MIME type
 */
export const iconByMime = (mime: string | undefined, def = "file"): string => {
    if (!mime) return def;
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "music";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "file-text";
    if (mime.includes("zip") || mime.includes("7z") || mime.includes("rar")) return "file-archive";
    if (mime.includes("json")) return "brackets-curly";
    if (mime.includes("csv")) return "file-spreadsheet";
    if (mime.includes("xml")) return "code";
    if (mime.startsWith("text/")) return "file-text";
    return def;
};

/**
 * Get icon name by file extension
 */
export const getFileIcon = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const iconMap: Record<string, string> = {
        // Documents
        md: "file-text",
        txt: "file-text",
        pdf: "file-pdf",
        doc: "file-doc",
        docx: "file-doc",

        // Images
        png: "file-image",
        jpg: "file-image",
        jpeg: "file-image",
        gif: "file-image",
        svg: "file-image",
        webp: "file-image",

        // Code
        js: "file-js",
        ts: "file-ts",
        jsx: "file-jsx",
        tsx: "file-tsx",
        html: "file-html",
        css: "file-css",
        scss: "file-css",
        json: "file-json",

        // Archives
        zip: "file-zip",
        tar: "file-zip",
        gz: "file-zip",
        rar: "file-zip",

        // Media
        mp3: "file-audio",
        wav: "file-audio",
        mp4: "file-video",
        mov: "file-video",
        webm: "file-video"
    };

    return iconMap[ext] || "file";
};

/**
 * Get icon for file entry item
 */
export const iconFor = (item: { kind?: string; type?: string; name?: string } | string, type?: string): string => {
    if (typeof item === "string") {
        return (item === "directory" ? "folder" : iconByMime(type || item || ""));
    }
    return item?.kind === "directory" ? "folder" : iconByMime(item?.type) || getFileIcon(item?.name || "");
};

// ============================================================================
// SIZE FORMATTING
// ============================================================================

const sizeCache = new Map<number, string>();

/**
 * Format file size with caching
 */
export const formatSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null) return "";

    if (sizeCache.has(bytes)) {
        return sizeCache.get(bytes)!;
    }

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    const formatted = `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    sizeCache.set(bytes, formatted);
    return formatted;
};

// ============================================================================
// DATE FORMATTING
// ============================================================================

const dateCache = new Map<number, string>();

/**
 * Format date with caching
 */
export const formatDate = (timestamp: number | Date | undefined): string => {
    if (timestamp === undefined || timestamp === null) return "";

    const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;
    if (dateCache.has(ts)) {
        return dateCache.get(ts)!;
    }

    const formatted = new Date(ts).toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "short"
    });
    dateCache.set(ts, formatted);
    return formatted;
};

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Get parent directory path
 */
export const getParentPath = (path: string): string => {
    const parts = path.replace(/\/+$/g, "").split("/").filter(Boolean);
    if (parts.length <= 1) return "/";
    return "/" + parts.slice(0, -1).join("/") + "/";
};

/**
 * Normalize path (ensure trailing slash for directories)
 */
export const normalizePath = (path: string, isDirectory: boolean = false): string => {
    if (isDirectory && !path.endsWith("/")) {
        return path + "/";
    }
    return path;
};
