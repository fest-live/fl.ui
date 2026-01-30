/**
 * FL.UI - UI Components Library
 * 
 * This is the default entry point that uses veela.css for styling.
 * 
 * For veela-independent usage, import from:
 * - `fest/fl-ui/core` - Uses fl.ui's built-in mixins (no veela)
 * 
 * For explicit veela integration:
 * - `fest/fl-ui/veela` - Full veela.css integration
 * 
 * Style Configuration:
 * The library supports pluggable style systems. You can:
 * 1. Use the default veela-integrated styles
 * 2. Import from /core for framework-agnostic basic styles
 * 3. Provide your own styles by not importing any entry point
 *    and manually importing components + your CSS framework
 */

import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

//@ts-ignore
import styles from "./index.scss?inline";

// Configuration for style loading
export interface FlUIConfig {
    /** Whether to load styles automatically (default: true) */
    loadStyles?: boolean;
    /** Whether to use veela styles (default: true, false uses core styles) */
    useVeela?: boolean;
}

// Default config
const defaultConfig: FlUIConfig = {
    loadStyles: true,
    useVeela: true
};

// Store config for components to access
let _config = { ...defaultConfig };

/**
 * Configure fl.ui style behavior
 * Call this before importing any components if you want to customize
 */
export function configureFlUI(config: Partial<FlUIConfig>) {
    _config = { ..._config, ...config };
}

/**
 * Get current fl.ui configuration
 */
export function getFlUIConfig(): FlUIConfig {
    return { ..._config };
}

// Load styles by default (backwards compatible)
loadInlineStyle(styles);

//
export * from "./ui/index";
export const styled = preloadStyle(styles);

//
export * from "./services/file-manager/FileManager";
export * from "./services/markdown-view/Markdown";
