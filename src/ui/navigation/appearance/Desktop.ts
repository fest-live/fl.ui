/* Desktop Taskbar appearance styles DOM Mixin */
import { DOMMixin } from "fest/dom";
import { preloadStyle } from "fest/dom";

//
// @ts-ignore
import styles from "./Desktop.scss?inline";
const styled = preloadStyle(styles);

//
export class DesktopTaskbar extends DOMMixin {
    element?: HTMLElement|any|null;

    //
    constructor() {
        super("desktop-taskbar");
    }

    //
    connect(element: HTMLElement|any|null = null) {
        if (element) { this.element = element; }
        if (this.element) { this.element.classList.add("desktop-taskbar"); }
        return this;
    }

    //
    disconnect(element: HTMLElement|any|null = null) {
        if (element) { this.element = null; }
        return this;
    }
}
