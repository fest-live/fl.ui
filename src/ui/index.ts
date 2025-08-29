import { loadInlineStyle, preloadStyle, initialize } from "fest/dom";

/*
//@ts-ignore
import styles from "./index.scss?inline";
export const UIStyles = preloadStyle(styles);
loadInlineStyle(styles);
*/

//
export * from "./components/containers/window/WindowFrame";
export * from "./components/containers/tabbed-box/TabbedBox";
export * from "./components/containers/box-with-sidebar/BoxWithSidebar";

//
export * from "./components/containers/grid/Interact";
export * from "./components/containers/grid/GridBox";
export * from "./components/containers/orient/OrientBox";

//
export * from "./components/overlays/scrollframe/ScrollFrame";

//
export * from "./components/inputs/slider/Slider";
export * from "./components/inputs/text/Text";

//
export * from "./services/file-manager/FileManager";

//
export * from "./navigation/statusbar/StatusBar";
export * from "./navigation/taskbar/element/TaskBar";
export * from "./navigation/taskbar/element/Task";

//
export * from "./misc/TaskStateReflect";
export * from "./misc/TaskInteraction";
export * from "./misc/TaskIndication";
