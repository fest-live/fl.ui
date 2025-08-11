/* Taskbar wrapper */
import UIElement from "@helpers/base/UIElement";
import { H, defineElement } from "fest/lure";

//
// @ts-ignore
import styles from "./TaskBar.scss?inline";
import { preloadStyle } from "fest/dom";
const styled = preloadStyle(styles);

//
// @ts-ignore
@defineElement("ui-taskbar")
export class TaskBar extends UIElement {
    constructor() {
        super();
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render() { return H`<div part="taskbar" class="taskbar"><slot></slot></div>`; }
}
