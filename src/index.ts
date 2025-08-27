import { loadInlineStyle, preloadStyle } from "fest/dom";

//@ts-ignore
import $fonts from "fonts/inter.css?inline";
loadInlineStyle($fonts);

//@ts-ignore
import styles from "./scss/index.scss?inline";
export const styled = preloadStyle(styles);

//
loadInlineStyle(styles);

//
export * from "./ui/workspace/window/WindowFrame";
export * from "./ui/workspace/window/TaskStateReflect";
export * from "./ui/workspace/statusbar/StatusBar";
export * from "./ui/workspace/grid/GridBox";
export * from "./ui/workspace/grid/OrientBox";
export * from "./ui/workspace/grid/GridBind";

//
export * from "./ui/components/icons/Icon";
export * from "./ui/components/scrollframe/ScrollFrame";

//
export * from "./ui/components/tabbed-box/TabbedBox";
export * from "./ui/components/box-with-sidebar/BoxWithSidebar";

//
export * from "./ui/inputs/slider/Slider";
export * from "./ui/inputs/text/Text";

//
export * from "./ui/services/file-manager/FileManager";

//
export * from "./ui/navigation/appearance/Desktop";
export * from "./ui/navigation/appearance/Mobile";

//
export * from "./ui/navigation/taskbar/bar/TaskBar";
export * from "./ui/navigation/taskbar/bar/TaskInteraction";
export * from "./ui/navigation/taskbar/task/Task";
export * from "./ui/navigation/taskbar/task/TaskIndication";

//
export * from "./helpers/base/UIElement";
export * from "./helpers/controllers/Draggable";
export * from "./helpers/controllers/Resizable";

//
export * from "./helpers/core/Anchor";
export * from "./helpers/core/CtxMenu";
export * from "./helpers/core/Status";
export * from "./helpers/core/UIState";

//
export * from "./helpers/tasking/Tasks";
export * from "./helpers/tasking/Manager";

//
export * from "./helpers/design/ThemeEngine";
export * from "./helpers/design/DynamicEngine";
export * from "./helpers/design/ImagePicker";
