/**
 * FL.UI with Veela Basic Entry Point
 *
 * Use this entry point for lightweight styling with veela-basic.
 *
 * @example
 * ```ts
 * import { Button, Card } from "fest/fl-ui/veela-basic";
 * ```
 */

import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

// @ts-ignore
import coreStyles from "./index.core.scss?inline";

// Load basic core styles (veela-basic variant)
loadInlineStyle(coreStyles);

// Load veela-basic runtime asynchronously
(async () => {
    try {
        const { loadBasicStyles } = await import("fest/veela/runtime/basic/index");
        await loadBasicStyles();
    } catch {
        console.warn("[FL.UI] Could not load veela-basic runtime");
    }
})();

// Export all UI components
export * from "./ui/index";
export const styled = preloadStyle(coreStyles);

// Export services
export * from "./services/file-manager/FileManager";
export * from "./services/markdown-view/Markdown";
