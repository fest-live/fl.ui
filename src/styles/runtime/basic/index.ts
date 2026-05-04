/**
 * Veela CSS - Core Runtime Loader
 *
 * Provides the shared foundation styles for all veela variants.
 * Use this when you only need the essential normalize and layout utilities.
 *
 * @example
 * ```ts
 * import { loadCoreStyles } from "fest/veela/core";
 * await loadCoreStyles();
 * ```
 */

import { loadAsAdopted } from "fest/dom"; //@ts-ignore
import styles from "./index.scss?inline";

/**
 * Load core veela styles (normalize + layout + states)
 */
export async function loadBasicStyles(): Promise<void> {
    try {
        await loadAsAdopted(styles);
        console.log("[Veela/Core] Core styles loaded");
    } catch (e) {
        console.warn("[Veela/Core] Failed to load core styles:", e);
    }
}

export default loadBasicStyles;
