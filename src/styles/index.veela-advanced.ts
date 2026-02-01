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

//
import { loadVeelaVariant } from "fest/veela";

// @ts-ignore
import coreStyles from "./index.core.scss?inline";

//
export const loader = async () => {
    const styled = await preloadStyle(coreStyles);
    // Load basic core styles (veela-basic variant)
    await loadInlineStyle(coreStyles);

    try {
        await loadVeelaVariant("advanced");
    } catch {
        console.warn("[FL.UI] Could not load veela-advanced runtime");
    }
};

//
export default loader;
