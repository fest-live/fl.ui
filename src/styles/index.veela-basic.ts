/**
 * FL.UI with Veela Basic Entry Point
 *
 * Use this entry point for lightweight styling with veela-basic.
 *
 * @example
 * ```ts
 * import { Button, Card } from "fest/fl-ui/veela-basic";
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
        await loadVeelaVariant("basic");
    } catch {
        console.warn("[FL.UI] Could not load veela-basic runtime");
    }
};

//
export default loader;
