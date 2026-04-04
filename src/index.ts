/**
 * FL.UI - UI Components Library
 *
 * This is the default entry point that uses veela-advanced for styling.
 *
 * Entry points by style variant:
 * - `fest/fl-ui` - Default (veela-advanced)
 * - `fest/fl-ui/core` - Basic styles only (no veela)
 * - `fest/fl-ui/veela` - Alias for veela-advanced
 * - `fest/fl-ui/veela-basic` - Veela basic styles
 * - `fest/fl-ui/veela-advanced` - Veela advanced styles
 * - `fest/fl-ui/veela-beercss` - Beer CSS compatible styles
 *
 * @example
 * ```ts
 * // Default (veela-advanced)
 * import { Button, Card } from "fest/fl-ui";
 *
 * // With specific variant
 * import { Button } from "fest/fl-ui/veela-basic";
 * ```
 */

import { loadInlineStyle } from "fest/dom";

// ============================================================================
// CONFIGURATION
// ============================================================================

export type FlUIStyleVariant = "core" | "veela-basic" | "veela-advanced" | "veela-beercss";

export interface FlUIConfig {
    /** Whether to load styles automatically (default: true) */
    loadStyles?: boolean;
    /** Style variant to use (default: "veela-advanced") */
    styleVariant?: FlUIStyleVariant;
}

const defaultConfig: FlUIConfig = {
    loadStyles: true,
    styleVariant: "veela-advanced"
};

let _config = { ...defaultConfig };

/**
 * Configure fl.ui style behavior
 * Call this before importing any components if you want to customize
 */
export function configureFlUI(config: Partial<FlUIConfig>): void {
    _config = { ..._config, ...config };
}

/**
 * Get current fl.ui configuration
 */
export function getFlUIConfig(): FlUIConfig {
    return { ..._config };
}

//@ts-ignore
import styles from "./styles/index.scss?inline";

// ============================================================================
// EXPORTS
// ============================================================================

import { loader } from "./styles/index.veela";
export * from "./ui/index";

//
export * from "./services/file-manager";
export * from "./services/markdown-view/ts/Markdown";

//
(async () => {
    await loader();
    // Inline <style> only: bundled SCSS often still contains @import, which
    // CSSStyleSheet.replaceSync() rejects (constructable sheets limitation).
    await loadInlineStyle(styles);
})();
