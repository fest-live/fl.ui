import { initialize, loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";

//@ts-ignore
import styles from "./index.scss?inline";

//
initialize();
loadInlineStyle(styles);

//
export * from "./ui/index";
export * from "./design/index";
export const styled = preloadStyle(styles);
