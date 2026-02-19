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
    try {
        await loadVeelaVariant("beercss");
    } catch {
        console.warn("[FL.UI] Could not load veela-beercss runtime");
    }

    // Keep fl.ui core styles after veela runtime so component styles can override base normalize.
    const styled = await preloadStyle(coreStyles);
    await loadInlineStyle(coreStyles);
};

//
export default loader;
