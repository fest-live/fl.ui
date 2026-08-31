/**
 * Shared safe Markdown rendering for view-level prose surfaces.
 *
 * FIND:safe-markdown-render
 * WHY: Rendering and sanitization must stay identical for markdown-view and
 * assistant output; raw structured model output is never safe HTML.
 */
import DOMPurify from "dompurify";
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";

const MATH_DELIMITER_PATTERN = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|(?<!\$)\$[^$\n]+\$|\\\([\s\S]*?\\\)/;
const FENCED_CODE_PATTERN = /(^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g;
const INLINE_CODE_PATTERN = /`[^`\n]+`/g;

export const MARKDOWN_SANITIZE_OPTIONS = {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "applet", "link", "meta", "base", "form", "noscript", "template"],
    FORBID_CONTENTS: ["script", "style", "iframe", "object", "embed", "applet", "noscript", "template"]
};

const maskCodeSegments = (markdown: string): { masked: string; restore: (value: string) => string } => {
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

    return {
        masked: maskInline(mask(markdown)),
        restore: (value: string): string =>
            value.replace(/__MD_MASK_(\d+)__/g, (_, index) => maskedValues[Number(index)] ?? "")
    };
};

let configured = false;

/** Install the shared MathML-aware marked hook exactly once per document realm. */
export const configureMarkdownRendering = (): void => {
    if (configured) return;
    configured = true;
    marked.use(markedKatex({
        throwOnError: false,
        nonStandard: true,
        output: "mathml",
        strict: false
    }) as unknown as MarkedExtension, {
        hooks: {
            preprocess: (markdown: string): string => {
                if (!MATH_DELIMITER_PATTERN.test(markdown)) return markdown;

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
            }
        }
    });
};

/** Parse Markdown synchronously and sanitize all generated or embedded HTML. */
export const renderSafeMarkdown = (markdown: string): string => {
    configureMarkdownRendering();
    const html = marked.parse(String(markdown || "")) as string;
    return DOMPurify.sanitize(html, MARKDOWN_SANITIZE_OPTIONS);
};

/** Sanitize raw HTML before a Markdown surface inserts it into the document. */
export const sanitizeMarkdownHtml = (html: string): string =>
    DOMPurify.sanitize(String(html || ""), MARKDOWN_SANITIZE_OPTIONS);
