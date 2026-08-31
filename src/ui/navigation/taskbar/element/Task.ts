/* Taskbar Item (Task) */
/*
 * Filename: Task.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/taskbar/element/Task.ts
 * Change date and time: 11.00.00_31.07.2026
 * Reason for changes: Letter fallback when Phosphor glyph is missing/blank.
 *   2026-07-31: read title/icon from getAttribute in render — class-field defaults
 *   ("Task" / "app-window") were clobbering setAttribute("Home"/"house") in $init,
 *   so mobile Home showed letter "U" (from String(undefined)→"undefined") instead of house.
 */
import UIElement from "fl-ui/base/UIElement";
import { preloadStyle } from "@fest-lib/style-lib";
import { H, property, defineElement } from "@fest-lib/lure";

// @ts-ignore
import styles from "veela-lib/ui/components/task.scss?inline";
const styled = preloadStyle(styles);

/** First letter for blank-glyph fallback — never String(undefined)→"U". */
const titleLetter = (title?: unknown): string => {
    let s = "";
    if (typeof title === "string") {
        s = title;
    } else if (title != null && typeof title === "object" && "value" in (title as object)) {
        const v = (title as { value?: unknown }).value;
        s = v == null ? "" : String(v);
    } else if (title != null && typeof title !== "object") {
        s = String(title);
    }
    // WHY: String(undefined) === "undefined" → letter "U" looked like a broken Home icon.
    if (!s || s === "undefined" || s === "null" || s === "[object Object]") s = "";
    const ch = s.trim().charAt(0);
    return ch ? ch.toUpperCase() : "?";
};

const attrString = (el: HTMLElement, name: string, fallback: string): string => {
    const raw = el.getAttribute(name);
    if (raw != null && String(raw).trim()) return String(raw).trim();
    return fallback;
};

//
// @ts-ignore
@defineElement("ui-task")
export class UITask extends UIElement {
    // WHY: no class-field defaults — they shadow setAttribute before $init and get written back.
    @property({ source: "attr" }) public title?: string;
    @property({ source: "attr" }) public icon?: string;

    //
    constructor() { super(); }
    styles = () => styled;
    render = function (this: UITask) {
        // INVARIANT: prefer content attributes (set before connect) over @property during inRender.
        const titleText = attrString(this, "title", "Task");
        const iconName = attrString(this, "icon", "app-window");
        const letter = titleLetter(titleText);
        return H`
            <div part="icon" class="task-icon c2-contrast c2-transparent" data-letter=${letter}>
                <span class="task-letter" part="letter" aria-hidden="true">${letter}</span>
                <ui-icon class="c2-contrast c2-transparent task-icon-glyph" part="glyph" icon=${iconName} icon-style="duotone"></ui-icon>
            </div>
            <div part="title" class="task-title c2-contrast c2-transparent">${titleText}</div>
        `;
    }
}
