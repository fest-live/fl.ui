/* Taskbar Item (Task) */
import UIElement from "@helpers/base/UIElement";
import { preloadStyle } from "fest/dom";
import { H, property } from "fest/lure";

// @ts-ignore
import styles from "./Task.scss?inline";
const styled = preloadStyle(styles);

//
// @ts-ignore
@defineElement("ui-task")
export class Task extends UIElement {
    @property({ source: "attr" }) title: string = "";
    @property({ source: "attr" }) icon: string = "window";

    //
    constructor() {
        super();
    }

    styles = () => styled?.cloneNode?.(true);

    //
    render() {
        return H`
            <div part="icon" class="task-icon"><ui-icon part="icon" icon="${this.icon}"></ui-icon></div>
            <div part="title" class="task-title">${this.title}</div>
        `;
    }
}
