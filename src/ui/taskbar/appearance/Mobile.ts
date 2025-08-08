/* Desktop Taskbar appearance styles DOM Mixin */
import { DOMMixin } from "fest/dom";

/* Important: Here applies only visuals and layout, not logic */
/* However, can be used some advanced effects, which requires scripts to be executed */

//
export class MobileTaskbar extends DOMMixin {
    element?: HTMLElement|any|null = null;

    //
    constructor() {
        super("mobile-taskbar");
    }

    connect(element: HTMLElement|any|null = null) {
        if (element) { this.element = element; }

        //
        if (this.element) {
            this.element.classList.add("mobile-taskbar");
        }

        return this;
    }

    disconnect(element: HTMLElement|any|null = null) {
        if (element) { this.element = null; }
        return this;
    }
}
