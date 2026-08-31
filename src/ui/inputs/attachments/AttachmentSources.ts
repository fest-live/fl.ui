/**
 * Normalizes browser picker, drop, paste, and share payloads into attachment
 * candidates without deciding how a consuming view persists or displays them.
 *
 * FIND:attachment-sources
 * WHY: Browsers expose the same clipboard file through both `items` and
 * `files`; this module preserves real file order without duplicating it.
 */
export type AttachmentSource = "picker" | "drop" | "paste" | "share";

export type AttachmentCandidate =
    | { kind: "file"; file: File; source: AttachmentSource }
    | { kind: "url"; url: string; source: Exclude<AttachmentSource, "picker"> };

type DataTransferLike = Pick<DataTransfer, "files" | "items" | "getData">;

const isUsableUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const appendFile = (
    target: AttachmentCandidate[],
    seen: Set<File>,
    file: File | null,
    source: AttachmentSource
): void => {
    if (!file || seen.has(file)) return;
    seen.add(file);
    target.push({ kind: "file", file, source });
};

/** Convert a picker result into ordered file candidates. */
export const collectFileCandidates = (
    files: Iterable<File>,
    source: AttachmentSource = "picker"
): AttachmentCandidate[] => {
    const candidates: AttachmentCandidate[] = [];
    const seen = new Set<File>();
    for (const file of files) appendFile(candidates, seen, file, source);
    return candidates;
};

/**
 * Collect actual files and URI-list links from a browser transfer payload.
 * Text-only data is deliberately ignored so an editable composer keeps native
 * paste behavior and cursor selection semantics.
 */
export const collectAttachmentCandidates = (
    data: DataTransferLike | null | undefined,
    source: Exclude<AttachmentSource, "picker">
): AttachmentCandidate[] => {
    if (!data) return [];

    const candidates: AttachmentCandidate[] = [];
    const seen = new Set<File>();

    for (const item of Array.from(data.items || [])) {
        if (item.kind !== "file") continue;
        appendFile(candidates, seen, item.getAsFile?.() ?? null, source);
    }
    for (const file of Array.from(data.files || [])) {
        appendFile(candidates, seen, file, source);
    }

    const urls = String(data.getData?.("text/uri-list") || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && isUsableUrl(line));
    const seenUrls = new Set<string>();
    for (const url of urls) {
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        candidates.push({ kind: "url", url, source });
    }

    return candidates;
};
