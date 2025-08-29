import { initialize, loadInlineStyle, preloadStyle } from "fest/dom";

//@ts-ignore
import styles from "./index.scss?inline";

//
initialize();
loadInlineStyle(styles);

//
export * from "./ui/index";
export * from "./design/index";
export const styled = preloadStyle(styles);
