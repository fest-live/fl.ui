/* Desktop Taskbar appearance styles DOM Mixin */
import { DOMMixin } from "@fest-lib/dom";
import { preloadStyle } from "@fest-lib/style-lib";

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
