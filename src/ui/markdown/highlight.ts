/**
 * highlight.js paint layer for fenced code, textarea, and contenteditable hosts.
 *
 * FIND:code-highlight
 * TAG:code-highlight,safe-markdown-render
 * WHY: Source stays plain text (selectable). Overlay is highlight.js HTML + optional
 * line gutter, positioned with lure anchors. Language comes from `data-language`
 * (markdown fence) or `language-*`.
 * AI-READ: Import overlay via `./code-overlay` (same folder). A `../../../../lur.e`
 * specifier 500s under Vite `preserveSymlinks` when this file is loaded as
 * `fest/fl-ui/ui/markdown/highlight.ts`.
 */
import { attachCodeOverlay, type CodeOverlayHandle } from "./code-overlay";
import { CODE_LANGUAGE_ATTR, normalizeFenceLanguage } from "./render";

export { CODE_LANGUAGE_ATTR, normalizeFenceLanguage };

const attached = new WeakMap<HTMLElement, CodeOverlayHandle & { updatePaint: () => Promise<void> }>();

type HljsLike = {
    getLanguage(name: string): unknown;
    highlight(code: string, options: { language: string; ignoreIllegals: boolean }): { value: string; language?: string };
    highlightAuto(code: string): { value: string; language?: string };
};

let hljsPromise: Promise<HljsLike | null> | null = null;

const loadHljs = (): Promise<HljsLike | null> => {
    if (hljsPromise) return hljsPromise;
    hljsPromise = import("highlight.js/lib/common")
        .then((mod) => (mod.default ?? mod) as HljsLike)
        .catch((error) => {
            console.warn("[code-highlight] highlight.js failed to load", error);
            return null;
        });
    return hljsPromise;
};

const FILENAME_LANGUAGE: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    mts: "typescript",
    cts: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    css: "css",
    scss: "scss",
    html: "xml",
    htm: "xml",
    svg: "xml",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    sh: "bash",
    bash: "bash",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
};

/** WHY: Viewer raw `</>` is a bare `<pre>`, not a fence — language comes from the file name. */
export const languageFromFilename = (pathOrName: string): string => {
    const base = String(pathOrName || "").split(/[?#]/)[0].split(/[/\\]/).pop() || "";
    const dot = base.lastIndexOf(".");
    const ext = dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
    return normalizeFenceLanguage(FILENAME_LANGUAGE[ext] || ext);
};

export const resolveCodeLanguage = (el: Element): string => {
    const direct =
        el.getAttribute(CODE_LANGUAGE_ATTR) ||
        el.getAttribute("data-lang") ||
        "";
    if (direct) return normalizeFenceLanguage(direct);
    const fromClass = String((el as HTMLElement).className || "").match(/(?:^|\s)language-([\w.+#-]+)/);
    if (fromClass?.[1]) return fromClass[1];
    const pre = el.closest("pre");
    return normalizeFenceLanguage(pre?.getAttribute(CODE_LANGUAGE_ATTR) || pre?.getAttribute("data-lang"));
};

export const stampCodeLanguage = (el: HTMLElement, language: string): void => {
    if (!language) return;
    el.setAttribute(CODE_LANGUAGE_ATTR, language);
    el.classList.add(`language-${language}`);
    const pre = el.closest("pre");
    if (pre && !pre.getAttribute(CODE_LANGUAGE_ATTR)) {
        pre.setAttribute(CODE_LANGUAGE_ATTR, language);
    }
};

const readHostText = (host: HTMLElement): string => {
    if (host instanceof HTMLTextAreaElement) return host.value;
    return host.textContent ?? "";
};

const countLines = (text: string): number => {
    if (!text) return 1;
    const parts = text.split("\n");
    return parts.at(-1) === "" ? Math.max(1, parts.length - 1) : parts.length;
};

const escapeHtml = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const highlightText = async (text: string, language: string): Promise<{ html: string; language: string }> => {
    const hljs = await loadHljs();
    if (!hljs) {
        return { html: escapeHtml(text), language };
    }
    if (language && hljs.getLanguage(language)) {
        const result = hljs.highlight(text, { language, ignoreIllegals: true });
        return { html: result.value, language };
    }
    const auto = hljs.highlightAuto(text);
    return { html: auto.value, language: auto.language || language || "" };
};

const isCapacitorNative = (): boolean => {
    try {
        const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform();
    } catch {
        return false;
    }
};

const buildOverlay = (lineCount: number, showGutter: boolean): { overlay: HTMLElement; paint: HTMLElement; gutter: HTMLElement | null } => {
    const overlay = document.createElement("div");
    overlay.className = "code-highlight-overlay";
    let gutter: HTMLElement | null = null;
    if (showGutter) {
        gutter = document.createElement("div");
        gutter.className = "code-highlight-overlay__gutter";
        gutter.textContent = Array.from({ length: lineCount }, (_, index) => String(index + 1)).join("\n");
        overlay.append(gutter);
    }
    const paint = document.createElement("div");
    paint.className = "code-highlight-overlay__paint";
    overlay.append(paint);
    return { overlay, paint, gutter };
};

export type AttachCodeHighlightOptions = {
    language?: string;
    lineNumbers?: boolean;
};

/**
 * Attach a highlight.js overlay to one code host.
 * Works for `pre > code`, `textarea`, and `contenteditable`.
 */
export const attachCodeHighlight = (
    host: HTMLElement,
    options: AttachCodeHighlightOptions = {},
): CodeOverlayHandle & { updatePaint: () => Promise<void> } => {
    attached.get(host)?.disconnect();

    const language = normalizeFenceLanguage(options.language || resolveCodeLanguage(host));
    stampCodeLanguage(host, language);

    const text = readHostText(host);
    const lineCount = countLines(text);
    const showGutter = options.lineNumbers !== false && lineCount > 1;
    const digits = String(lineCount).length;
    (host?.parentElement?.style ?? host.style)?.setProperty("--code-gutter", showGutter ? `calc(${digits} * 1ch + 0.75rem)` : "0px");
    host?.classList?.add("code-highlight-source");
    /* WHY: source `pre-wrap` vs overlay `pre` (or a narrower overlay) shifts selection by rows. */
    host.style.whiteSpace = "pre";
    host.style.wordBreak = "normal";
    host.style.overflowWrap = "normal";

    /* WHY: Capacitor WebView measures native selection on the transparent <code>
     * with different glyph widths than the overlay paint (Roboto vs mono). */
    const inplace = isCapacitorNative()
        && !(host instanceof HTMLTextAreaElement)
        && host.contentEditable !== "true";
    if (inplace) host.classList.add("code-highlight-inplace");

    const { overlay, paint, gutter } = buildOverlay(lineCount, showGutter);
    if (inplace) paint.remove();
    const handle = showGutter || !inplace
        ? attachCodeOverlay(host, overlay, {
            paint: inplace ? overlay : paint,
            scroller: host instanceof HTMLTextAreaElement ? host : host.closest("pre"),
        })
        : null;

    const updatePaint = async (): Promise<void> => {
        const next = readHostText(host);
        const nextLanguage = normalizeFenceLanguage(options.language || resolveCodeLanguage(host));
        const nextLines = countLines(next);
        const nextGutter = options.lineNumbers !== false && nextLines > 1;
        (host?.parentElement?.style ?? host.style)?.setProperty("--code-gutter", nextGutter ? `calc(${String(nextLines).length} * 1ch + 0.75rem)` : "0px");
        if (gutter) {
            gutter.textContent = Array.from({ length: nextLines }, (_, index) => String(index + 1)).join("\n");
            gutter.hidden = !nextGutter;
        }
        const painted = await highlightText(next, nextLanguage);
        if (painted.language && painted.language !== nextLanguage) {
            stampCodeLanguage(host, painted.language);
        }
        const target = inplace ? host : paint;
        target.innerHTML = painted.html;
        /* WHY: Unescaped `<tag>` in paint HTML becomes empty elements; source was
         * already made transparent → blank boxes. Keep glyphs if paint collapsed. */
        if (next && (target.textContent?.length ?? 0) < Math.max(1, Math.floor(next.length * 0.5))) {
            target.textContent = next;
        }
        host.classList.toggle("code-highlight-painted", !inplace && (paint.textContent?.length ?? 0) > 0);
        handle?.updateMetrics();
        handle?.syncScroll();
    };

    const onInput = (): void => {
        void updatePaint();
    };
    host.addEventListener("input", onInput);

    const wrapped = {
        overlay: handle?.overlay ?? overlay,
        paint: inplace ? host : paint,
        updateMetrics: handle?.updateMetrics ?? ((): void => undefined),
        syncScroll: handle?.syncScroll ?? ((): void => undefined),
        updatePaint,
        disconnect: (): void => {
            host.removeEventListener("input", onInput);
            host.classList.remove("code-highlight-painted", "code-highlight-inplace");
            if (inplace) host.textContent = host.textContent ?? "";
            handle?.disconnect();
            overlay.remove();
            attached.delete(host);
        },
    };
    attached.set(host, wrapped);
    void updatePaint();
    return wrapped;
};

const isCodeHost = (el: Element): el is HTMLElement =>
    el instanceof HTMLElement && el.matches("pre > code, textarea.code-highlight-source, [contenteditable].code-highlight-source");

/** Walk a rendered markdown/result tree and overlay every fenced `pre > code`. */
export const highlightCodeTree = (root: ParentNode | null | undefined): void => {
    if (!root || typeof document === "undefined") return;
    const codes = root.querySelectorAll("pre > code");
    for (const code of codes) {
        if (!(code instanceof HTMLElement)) continue;
        if (code.closest(".code-highlight-overlay")) continue;
        const overlay = code.nextElementSibling;
        if (overlay?.classList.contains("code-highlight-overlay")) continue;
        if (code.classList.contains("code-highlight-inplace") && attached.get(code)) continue;
        attached.get(code)?.disconnect();
        attachCodeHighlight(code);
    }
};

export const isCodeHighlightHost = isCodeHost;
