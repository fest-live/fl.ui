/**
 * FL.UI with Veela Advanced Entry Point
 *
 * Use this entry point for full-featured styling with veela-advanced.
 * This is the same as the default entry point.
 *
 * @example
 * ```ts
 * import { Button, Card } from "fest/fl-ui/veela-advanced";
 * ```
 */

import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

// @ts-ignore - Load styles with veela layers
import styles from "./index.scss?inline";

// Load veela-advanced integrated styles
loadInlineStyle(styles);

// Load veela-advanced runtime asynchronously
(async () => {
    try {
        const { loadAdvancedStyles } = await import("fest/veela/runtime/advanced/index");
        await loadAdvancedStyles();
    } catch {
        console.warn("[FL.UI] Could not load veela-advanced runtime");
    }
})();

// Export all UI components
export * from "./ui/index";
export const styled = preloadStyle(styles);

// Export services
export * from "./services/file-manager/FileManager";
export * from "./services/markdown-view/Markdown";
