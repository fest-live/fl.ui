// @ts-ignore
import styles from "fest/veela/scss/runtime/basic/markdown/markdown.scss?inline&compress";
import DOMPurify from 'dompurify';
import { marked, type MarkedExtension } from "marked";
import { E, H, provide } from "fest/lure";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";
import { loadInlineStyle } from "fest/dom";

//
import markedKatex from "marked-katex-extension";

const MATH_DELIMITER_PATTERN = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|(?<!\$)\$[^$\n]+\$|\\\([\s\S]*?\\\)/;
const FENCED_CODE_PATTERN = /(^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g;
const INLINE_CODE_PATTERN = /`[^`\n]+`/g;
const SANITIZE_OPTIONS = {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "applet", "link", "meta", "base", "form", "noscript", "template"],
    FORBID_CONTENTS: ["script", "style", "iframe", "object", "embed", "applet", "noscript", "template"]
};

function maskCodeSegments(markdown: string): { masked: string; restore: (value: string) => string } {
    const maskedValues: string[] = [];
    const tokenPrefix = "__MD_MASK_";
    const tokenSuffix = "__";

    const mask = (value: string): string => value.replace(FENCED_CODE_PATTERN, (segment) => {
        const token = `${tokenPrefix}${maskedValues.length}${tokenSuffix}`;
        maskedValues.push(segment);
        return token;
    });

    const maskInline = (value: string): string => value.replace(INLINE_CODE_PATTERN, (segment) => {
        const token = `${tokenPrefix}${maskedValues.length}${tokenSuffix}`;
        maskedValues.push(segment);
        return token;
    });

    const masked = maskInline(mask(markdown));

    return {
        masked,
        restore: (value: string): string => value.replace(/__MD_MASK_(\d+)__/g, (_, index) => maskedValues[Number(index)] ?? "")
    };
}

// Configure marked with KaTeX extension for HTML output with proper delimiters
marked?.use?.(markedKatex({
    throwOnError: false,
    nonStandard: true,
    output: "mathml",
    strict: false,
}) as unknown as MarkedExtension,
{
    hooks: {
        preprocess: (markdown: string): string => {
            if (!MATH_DELIMITER_PATTERN.test(markdown)) {
                return markdown;
            }

            const { masked, restore } = maskCodeSegments(markdown);
            const katexNode = document.createElement("div");
            katexNode.textContent = masked;
            renderMathInElement(katexNode, {
                throwOnError: false,
                nonStandard: true,
                output: "mathml",
                strict: false,
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "\\[", right: "\\]", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false }
                ]
            });

            return restore(katexNode.innerHTML);
        },
    },
});

//
const waitForClipboardFrame = (): Promise<void> =>
    new Promise((resolve) => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
            return;
        }
        if (typeof MessageChannel !== "undefined") {
            const channel = new MessageChannel();
            channel.port1.onmessage = () => resolve();
            channel.port2.postMessage(undefined);
            return;
        }
        if (typeof setTimeout === "function") {
            setTimeout(() => resolve(), 16);
            return;
        }
        if (typeof queueMicrotask === "function") {
            queueMicrotask(() => resolve());
            return;
        }
        resolve();
    });

/**
 * Unified Markdown View Web Component
 *
 * Combines the best features from both Markdown.ts and MarkdownViewer.ts:
 * - Web Component API with src attribute support
 * - Enhanced caching with OPFS support
 * - Better error handling
 * - Optional UI features via attributes
 */
export class MarkdownView extends HTMLElement {
    static observedAttributes = ["src", "content", "show-actions", "show-title", "title"];

    #view: HTMLElement | null = null;
    #content: string = "";
    #showActions: boolean = false;
    #showTitle: boolean = false;
    #title: string = "Markdown Viewer";

    constructor() {
        super();
        this.createShadowRoot();
    }

    connectedCallback() {
        this.style.setProperty("pointer-events", "auto");
        this.style.setProperty("touch-action", "manipulation");
        this.style.setProperty("user-select", "text");

        // Load initial content
        const src = this.getAttribute("src");
        const content = this.getAttribute("content");
        if (content) {
            this.setContent(content);
        } else if (src) {
            this.renderMarkdown(src);
        } else {
            // Try to load from cache
            this.loadFromCache().then(cached => {
                if (cached) {
                    this.setContent(cached);
                }
            }).catch(console.warn.bind(console));
        }
    }

    /**
     * Set content directly
     */
    async setContent(content: string): Promise<void> {
        this.#content = content || "";
        await this.writeToCache(this.#content).catch(console.warn.bind(console));
        return this.setHTML(await marked.parse((this.#content || "")?.trim?.() || "")).catch(console.warn.bind(console));
    }

    /**
     * Get current content
     */
    getContent(): string {
        return this.#content;
    }

    /**
     * Set HTML content in the view
     */
    async setHTML(doc: string | Promise<string> = ""): Promise<void> {
        const view = this.#view;
        if (view) {
            const html = await doc;
            const sanitized = DOMPurify?.sanitize?.((html || "")?.trim?.() || "", SANITIZE_OPTIONS) || "";
            view.innerHTML = sanitized || view?.innerHTML || "";
        }
        document.dispatchEvent(new CustomEvent("ext-ready", {}));
    }

    /**
     * Load content from cache (supports both localStorage and OPFS)
     */
    async loadFromCache(): Promise<string | null> {
        try {
            // Try OPFS first if available
            if (navigator?.storage) {
                try {
                    const cachedFile = await provide("/user/cache/last.md");
                    if (cachedFile) {
                        const text = await cachedFile.text?.();
                        if (text) return text;
                    }
                } catch (error) {
                    // Fall back to localStorage
                }
            }
            // Fallback to localStorage
            return localStorage.getItem("$cached-md$");
        } catch (error) {
            console.warn('[MarkdownView] Failed to load from cache:', error);
            return null;
        }
    }

    /**
     * Write content to cache (supports both localStorage and OPFS)
     */
    async writeToCache(content: string | File | Blob): Promise<void> {
        if (typeof content !== "string") {
            // Convert File/Blob to string
            content = await content.text();
        }

        try {
            // Try OPFS first if available
            if (navigator?.storage) {
                try {
                    const forWrite = await provide("/user/cache/last.md", true);
                    if (forWrite?.write) {
                        await forWrite.write(content);
                        await forWrite.close?.();
                        return;
                    }
                } catch (error) {
                    // Fall back to localStorage
                }
            }
            // Fallback to localStorage
            localStorage.setItem("$cached-md$", content);
        } catch (error) {
            console.warn("[MarkdownView] Failed to write to cache:", error);
        }
    }

    /**
     * Render markdown from file path, URL, or content
     */
    async renderMarkdown(file: string | File | Blob | Response): Promise<void> {
        const renderMarkdownText = async (text: string): Promise<void> => {
            await this.writeToCache(text).catch(console.warn.bind(console));
            return this.setContent(text).catch(console.warn.bind(console));
        };

        // If no file provided, try cache
        if (!file) {
            const cached = await this.loadFromCache();
            if (cached) {
                return this.renderMarkdown(cached).catch(console.warn.bind(console));
            }
            return;
        }

        // Handle string (URL or path)
        if (typeof file === "string") {
            const fileStr = file.trim();

            // Check if it's a URL or path that needs fetching
            if (URL.canParse(fileStr) ||
                fileStr.startsWith("blob:") ||
                fileStr.startsWith("/user/") ||
                fileStr.startsWith("./") ||
                fileStr.startsWith("../")) {
                try {
                    const fetched = await provide(fileStr);
                    if (fetched) {
                        const text = await fetched.text?.();
                        if (text) {
                            return renderMarkdownText(text).catch(console.warn.bind(console));
                        }
                    }
                } catch (error) {
                    console.warn('[MarkdownView] Failed to fetch file:', error);
                    // If it looks like direct content, try rendering it
                    if (!fileStr.includes('\n') && fileStr.length < 100) {
                        // Probably a URL/path that failed, don't render as content
                        return;
                    }
                }
            }

            // Treat as direct markdown content
            return renderMarkdownText(fileStr).catch(console.warn.bind(console));
        }

        // Handle File, Blob, or Response
        if (file instanceof File || file instanceof Blob || file instanceof Response) {
            try {
                const text = await file.text();
                return renderMarkdownText(text).catch(console.warn.bind(console));
            } catch (error) {
                console.error('[MarkdownView] Error reading file:', error);
            }
        }
    }

    /**
     * Handle attribute changes
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue === newValue) return;

        switch (name) {
            case "src":
                if (newValue) {
                    this.renderMarkdown(newValue).catch(console.warn.bind(console));
                }
                break;
            case "content":
                if (newValue) {
                    this.setContent(newValue).catch(console.warn.bind(console));
                }
                break;
            case "show-actions":
                this.#showActions = newValue !== null;
                break;
            case "show-title":
                this.#showTitle = newValue !== null;
                break;
            case "title":
                this.#title = newValue || "Markdown Viewer";
                break;
        }
    }

    /**
     * Create shadow root with markdown view
     */
    createShadowRoot(): void {
        const shadowRoot = this.attachShadow({ mode: "open" });
        // Constructable adopted sheets reject @import (veela markdown bundle); inline <style> in shadow is OK.
        loadInlineStyle(styles, shadowRoot);
        shadowRoot.append(this.#view = E("div.markdown-body", { dataset: { print: "" } })?.element);
    }
}

// Register the custom element
customElements.define("md-view", MarkdownView);

/**
 * Factory function for creating MarkdownView instances programmatically
 * Provides a class-based API similar to MarkdownViewer for backwards compatibility
 */
export interface MarkdownViewerOptions {
    content?: string;
    title?: string;
    showTitle?: boolean;
    showActions?: boolean;
    onCopy?: (content: string) => void;
    onDownload?: (content: string) => void;
    onPrint?: (content: string) => void;
    onOpen?: () => void;
    onAttachToWorkCenter?: (content: string) => void;
}

export class MarkdownViewer {
    private options: MarkdownViewerOptions;
    private element: MarkdownView | null = null;
    private content: string = "";

    constructor(options: MarkdownViewerOptions = {}) {
        this.options = {
            content: "",
            title: "Markdown Viewer",
            showTitle: true,
            showActions: true,
            ...options
        };
        this.content = this.options.content || "";
    }

    /**
     * Render the markdown viewer
     */
    render(): HTMLElement {
        // Create a container div
        const container = H`<div class="markdown-viewer-container">
            ${this.options.showTitle ? H`<div class="viewer-header">
                <h3>${this.options.title}</h3>
                ${this.options.showActions ? H`<div class="viewer-actions">
                    <button class="btn btn-icon" data-action="open" title="Open markdown file" aria-label="Open markdown file">
                        <ui-icon icon="folder-open" size="20" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Open</span>
                    </button>
                    <button class="btn btn-icon" data-action="copy" title="Copy content" aria-label="Copy content">
                        <ui-icon icon="copy" size="20" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Copy</span>
                    </button>
                    <button class="btn btn-icon" data-action="download" title="Download as markdown" aria-label="Download as markdown">
                        <ui-icon icon="download" size="20" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Download</span>
                    </button>
                    <button class="btn btn-icon" data-action="print" title="Print content" aria-label="Print content">
                        <ui-icon icon="printer" size="20" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Print</span>
                    </button>
                </div>` : ''}
            </div>` : ''}
            <div class="viewer-content">
                <md-view content="${this.content}"></md-view>
            </div>
        </div>` as HTMLElement;

        // Get the md-view element
        this.element = container.querySelector('md-view') as MarkdownView;

        // Set up event listeners
        if (this.options.showActions) {
            container.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const btn = target?.closest?.('[data-action]') as HTMLElement | null;
                const action = btn?.getAttribute('data-action');

                switch (action) {
                    case 'open':
                        this.options.onOpen?.();
                        break;
                    case 'copy':
                        this.copyContent();
                        break;
                    case 'download':
                        this.downloadContent();
                        break;
                    case 'print':
                        this.printContent();
                        break;
                }
            });
        }

        return container;
    }

    /**
     * Set content to display
     */
    setContent(content: string): void {
        this.content = content;
        if (this.element) {
            this.element.setContent(content);
        }
    }

    /**
     * Get current content
     */
    getContent(): string {
        return this.content;
    }

    /**
     * Copy content to clipboard
     */
    async copyContent(): Promise<void> {
        try {
            await waitForClipboardFrame();
            await navigator.clipboard.writeText(this.content);
            this.options.onCopy?.(this.content);
        } catch (error) {
            console.warn('Failed to copy content:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.content;
            document.body.append(textArea);
            textArea.select();
            textArea.remove();
            this.options.onCopy?.(this.content);
        }
    }

    /**
     * Download content as markdown file
     */
    downloadContent(): void {
        const blob = new Blob([this.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `markdown-content-${new Date().toISOString().split('T')[0]}.md`;
        document.body.append(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
        this.options.onDownload?.(this.content);
    }

    /**
     * Print content
     */
    printContent(): void {
        try {
            const viewElement = this.element?.shadowRoot?.querySelector('.markdown-body') as HTMLElement;
            if (!viewElement) {
                console.error('[MarkdownViewer] Could not find markdown content for printing');
                return;
            }

            // Try to use the server-side print route first
            const printUrl = new URL('/print', globalThis.location.origin);
            printUrl.searchParams.set('content', viewElement.innerHTML);
            printUrl.searchParams.set('title', this.options.title || 'Markdown Content');

            // Open print URL in new window
            const printWindow = globalThis.open(printUrl.toString(), '_blank', 'width=800,height=600');
            if (!printWindow) {
                console.warn('[MarkdownViewer] Failed to open print window - popup blocked?');
                // Fallback: trigger browser print dialog
                globalThis.print();
                return;
            }

            this.options.onPrint?.(this.content);
        } catch (error) {
            console.error('[MarkdownViewer] Error printing content:', error);
            // Fallback to browser print
            globalThis.print();
        }
    }
}

/**
 * Create a markdown viewer instance
 */
export function createMarkdownViewer(options?: MarkdownViewerOptions): MarkdownViewer {
    return new MarkdownViewer(options);
}
