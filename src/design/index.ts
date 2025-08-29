import { loadInlineStyle, preloadStyle } from "fest/dom";

/*
//@ts-ignore
import styles from "./index.scss?inline";
export const DesignStyles = preloadStyle(styles);

//@ts-ignore
import $fonts from "fonts/inter.css?inline";
loadInlineStyle($fonts);
loadInlineStyle(styles);
*/

//
export * from "./icons/Icon";
export * from "./base/UIElement";
export * from "./engine/ThemeEngine";
export * from "./engine/DynamicEngine";
export * from "./engine/ImagePicker";
export * from "./appearance/Desktop";
export * from "./appearance/Mobile";
