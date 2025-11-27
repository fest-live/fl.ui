import { loadInlineStyle, preloadStyle } from "fest/dom";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

//@ts-ignore
import styles from "./index.scss?inline";

//
//initialize();
loadInlineStyle(styles);

//
export * from "./ui/index";
export const styled = preloadStyle(styles);

//
export * from "./services/file-manager/FileManager";
export * from "./services/markdown-view/Markdown";
