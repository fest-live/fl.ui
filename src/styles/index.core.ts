/**
 * FL.UI Core Entry Point - No veela dependency
 *
 * Use this entry point when you want to use fl.ui without veela.css
 * This provides all UI components with basic styling that can be
 * customized with any CSS framework.
 *
 * Usage:
 * ```ts
 * import { ... } from "fest/fl-ui/core";
 * ```
 */

import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

// @ts-ignore
import styles from "./index.core.scss?inline";

//
export const loader = async () => {
    const styled = await preloadStyle(styles);
    await loadInlineStyle(styles);
};

//
export default loader;
