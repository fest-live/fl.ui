import { loadInlineStyle, preloadStyle } from "fest/dom";

//@ts-ignore
import $fonts from "fonts/inter.css?inline";
loadInlineStyle($fonts);

//@ts-ignore
import styles from "./scss/index.scss?inline";
preloadStyle(styles);

//
export * from "./ui/workspace/statusbar/StatusBar";
export * from "./ui/workspace/grid/GridBox";
export * from "./ui/workspace/grid/OrientBox";
export * from "./ui/navigation/appearance/Desktop";
export * from "./ui/navigation/appearance/Mobile";
export * from "./ui/navigation/taskbar/bar/TaskBar";
export * from "./ui/navigation/taskbar/task/Task";
export * from "./ui/components/icons/Icon";
export * from "./ui/components/scrollframe/ScrollFrame";
export * from "./ui/services/file-manager/FileManager";
