/* Desktop Taskbar appearance styles DOM Mixin */
import { DOMMixin } from "fest/dom";
import { preloadStyle } from "fest/dom";

//
// @ts-ignore
import styles from "./Mobile.scss?inline";
const styled = preloadStyle(styles);

//
export class MobileTaskbar extends DOMMixin {
    element?: HTMLElement|any|null;

    //
    constructor() {
        super("mobile-taskbar");
    }

    //
    connect(element: HTMLElement|any|null = null) {
        if (element) { this.element = element; }
        if (this.element) { this.element.classList.add("mobile-taskbar"); }
        return this;
    }

    //
    disconnect(element: HTMLElement|any|null = null) {
        if (element) { this.element = null; }
        return this;
    }
}
