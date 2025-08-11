/* Taskbar Item (Task) */
import UIElement from "@helpers/base/UIElement";
import { preloadStyle } from "fest/dom";
import { H, property, defineElement } from "fest/lure";

// @ts-ignore
import styles from "./Task.scss?inline";
const styled = preloadStyle(styles);

//
// @ts-ignore
@defineElement("ui-task")
export class UITask extends UIElement {
    @property({ source: "attr" }) public title?: string = "Task";
    @property({ source: "attr" }) public icon?: string = "github";

    //
    constructor() {
        super();
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function () {
        return H`
            <div part="icon" class="task-icon c2-contrast c2-transparent"><ui-icon class="c2-contrast c2-transparent" part="icon" icon="${this.icon}"></ui-icon></div>
            <div part="title" class="task-title c2-contrast c2-transparent">${this.title}</div>
        `;
    }
}
