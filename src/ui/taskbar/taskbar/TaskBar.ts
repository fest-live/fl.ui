/* Taskbar wrapper */
import UIElement from "@helpers/base/UIElement";
import { H } from "fest/lure";

//
export class TaskBar extends UIElement {
    constructor() {
        super();
    }

    //
    render() {
        return H`<div part="taskbar" class="taskbar"><slot></slot></div>`;
    }
}
