/**
 * Selection & junction mixins live in `fest/dom` (`ui-junction-select`, drag, resize).
 * Two temporary anchor points (pointer down + move) drive the marquee; use
 * `junction-select:*` events or read `detail.box` on end.
 */
export {
    junctionToBox,
    JUNCTION_SELECT_EVENTS,
    JUNCTION_DRAG_EVENTS,
    JUNCTION_RESIZE_EVENTS,
    type JunctionPoint2D
} from "fest/dom";
