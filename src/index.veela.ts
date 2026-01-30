/**
 * FL.UI with Veela Entry Point - Full veela.css integration
 * 
 * Use this entry point when you want full veela.css integration
 * with all advanced styling features.
 * 
 * Usage:
 * ```ts
 * import { ... } from "fest/fl-ui/veela";
 * ```
 */

import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

// @ts-ignore - Load styles with veela layers
import styles from "./index.scss?inline";

// Load veela-integrated styles
loadInlineStyle(styles);

// Export all UI components
export * from "./ui/index";
export const styled = preloadStyle(styles);

// Export services
export * from "./services/file-manager/FileManager";
export * from "./services/markdown-view/Markdown";
