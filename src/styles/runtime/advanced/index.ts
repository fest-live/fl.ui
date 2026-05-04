/**
 * Veela CSS - Advanced Runtime Loader
 *
 * Provides full-featured styling with advanced components and effects.
 * Inherits core foundation + adds comprehensive component library.
 *
 * @example
 * ```ts
 * import { loadAdvancedStyles } from "fest/veela/advanced";
 * await loadAdvancedStyles();
 * ```
 */

import { loadAsAdopted } from "fest/dom";

import advancedStyles from "./index.scss?inline";

/**
 * Load advanced veela styles
 */
export async function loadAdvancedStyles(): Promise<void> {
    try {
        if (advancedStyles) {
            await loadAsAdopted(advancedStyles);
            console.log("[Veela/Advanced] Advanced styles loaded");
        }
    } catch (e) {
        console.warn("[Veela/Advanced] Failed to load advanced styles:", e);
    }
}

// Re-export core utilities
export * from "../basic/index";

export default loadAdvancedStyles;
