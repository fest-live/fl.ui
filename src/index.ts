/**
 * FL.UI - UI Components Library
 *
 * Default stylesheet scopes native control chrome to `.btn` and omits host-wide
 * `input` / `select` / `textarea` overrides. For legacy document-wide styling, set
 * `configureFlUI({ includeGlobalNativeControlStyles: true })` before importing components,
 * or call `loadFlUIGlobalNativeControlStyles()` after bootstrap.
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
 * import { Button, Card } from "@fest-lib/fl-ui";
 *
 * // With specific variant
 * import { Button } from "@fest-lib/fl-ui/veela-basic";
 * ```
 */

import { loadInlineStyle } from "@fest-lib/style-lib";

// ============================================================================
// CONFIGURATION
// ============================================================================

export type FlUIStyleVariant = "veela-basic" | "veela-advanced";

export interface FlUIConfig {
    /** Whether to load styles automatically (default: true) */
    loadStyles?: boolean;
    /**
     * When true, also loads host-wide rules for native `button` and bare `input`/`select`/`textarea`.
     * Default false so fl-ui does not restyle the whole document.
     */
    includeGlobalNativeControlStyles?: boolean;
    /** Style variant to use (default: "veela-advanced") */
    styleVariant?: FlUIStyleVariant;
}

const defaultConfig: FlUIConfig = {
    loadStyles: true,
    includeGlobalNativeControlStyles: false,
    styleVariant: "veela-basic"
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

import { loader, loadFlUIGlobalNativeControlStyles } from "./styles";

//
(async () => {
    const cfg = getFlUIConfig();
    if (cfg.loadStyles === false) return;
    await loader({ includeGlobalNativeControls: cfg.includeGlobalNativeControlStyles === true });
    // Inline <style> only: bundled SCSS often still contains @import, which
    // CSSStyleSheet.replaceSync() rejects (constructable sheets limitation).
    await loadInlineStyle(styles);
})()?.catch?.(() => undefined);

export { loadFlUIGlobalNativeControlStyles };

//
export * from "./ui/index";
