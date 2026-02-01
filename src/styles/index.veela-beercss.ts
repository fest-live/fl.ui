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

//
import { loadVeelaVariant } from "fest/veela";

// @ts-ignore
import coreStyles from "./index.core.scss?inline";

//
export const loader = async () => {
    // Load basic core styles (as Beer CSS base)
    await loadInlineStyle(coreStyles);
    try {
        await loadVeelaVariant("beercss");
    } catch {
        console.warn("[FL.UI] Could not load veela-beercss runtime");
    }
};

//
export default loader;
