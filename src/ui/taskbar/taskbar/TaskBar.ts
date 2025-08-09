/* Taskbar wrapper */
import UIElement from "@helpers/base/UIElement";
import { H, defineElement } from "fest/lure";

//
// @ts-ignore
@defineElement("ui-taskbar")
export class TaskBar extends UIElement {
    constructor() {
        super();
    }

    //
    render() {
        return H`<div part="taskbar" class="taskbar"><slot></slot></div>`;
    }
}
