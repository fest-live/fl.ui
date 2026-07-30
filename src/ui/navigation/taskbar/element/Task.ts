/* Taskbar Item (Task) */
/*
 * Filename: Task.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/taskbar/element/Task.ts
 * Change date and time: 18.05.00_30.07.2026
 * Reason for changes: Letter fallback when Phosphor glyph is missing/blank.
 */
import UIElement from "fl-ui/base/UIElement";
import { preloadStyle } from "fest/dom";
import { H, property, defineElement } from "fest/lure";

// @ts-ignore
import styles from "../scss/Task.scss?inline";
const styled = preloadStyle(styles);

const titleLetter = (title?: string): string => {
    const ch = String(title || "").trim().charAt(0);
    return ch ? ch.toUpperCase() : "?";
};

//
// @ts-ignore
@defineElement("ui-task")
export class UITask extends UIElement {
    @property({ source: "attr" }) public title?: string = "Task";
    @property({ source: "attr" }) public icon?: string = "app-window";

    //
    constructor() { super(); }
    styles = () => styled;
    render = function () {
        const letter = titleLetter(this.title);
        const iconName = String(this.icon || "").trim() || "app-window";
        return H`
            <div part="icon" class="task-icon c2-contrast c2-transparent" data-letter=${letter}>
                <span class="task-letter" part="letter" aria-hidden="true">${letter}</span>
                <ui-icon class="c2-contrast c2-transparent task-icon-glyph" part="glyph" icon=${iconName} icon-style="duotone"></ui-icon>
            </div>
            <div part="title" class="task-title c2-contrast c2-transparent">${this.title}</div>
        `;
    }
}
