import { loadInlineStyle, preloadStyle } from "fest/dom";

//@ts-ignore
import $fonts from "fonts/inter.css?inline";
loadInlineStyle($fonts);

//@ts-ignore
import styles from "./scss/index.scss?inline";
preloadStyle(styles);

//
export * from "./ui/scrollframe/ScrollFrame"
export * from "./ui/grid/GridBox"
export * from "./ui/grid/OrientBox"
export * from "./ui/inputs/slider/Slider"
export * from "./ui/inputs/text/Text"
