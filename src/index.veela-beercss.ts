/**
 * FL.UI with Veela BeerCSS Entry Point
 *
 * Use this entry point for Beer CSS compatible styling.
 *
 * @example
 * ```ts
 * import { Button, Card } from "fest/fl-ui/veela-beercss";
 * ```
 *
 * @see https://www.beercss.com/ for Beer CSS documentation
 */

import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

// @ts-ignore
import coreStyles from "./index.core.scss?inline";

// Load basic core styles (as Beer CSS base)
loadInlineStyle(coreStyles);

// Load veela-beercss runtime asynchronously
(async () => {
    try {
        const { loadBeerCssStyles } = await import("fest/veela/runtime/beercss/index");
        await loadBeerCssStyles();
    } catch {
        console.warn("[FL.UI] Could not load veela-beercss runtime");
    }
})();

// Export all UI components
export * from "./ui/index";
export const styled = preloadStyle(coreStyles);

// Export services
export * from "./services/file-manager/FileManager";
export * from "./services/markdown-view/Markdown";
