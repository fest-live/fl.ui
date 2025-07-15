import { ref, booleanRef, stringRef, makeReactive, addToCallChain } from "fest/object";
import { WRef, observeContentBox } from "fest/dom";

//
const ROOT = document.documentElement;
const SELECTOR = "ui-modal[type=\"contextmenu\"], ui-button, ui-taskbar, ui-navbar, ui-statusbar, button, label, input, ui-longtext, ui-focustext, ui-row-select, ui-row-button, .u2-input, .ui-input";

//
export const handleByPointer = (cb, root = ROOT)=>{
    let pointerId = -1;
    const rst = (ev)=>{ pointerId = -1; };
    const tgi = (ev)=>{ if (pointerId < 0) pointerId = ev.pointerId; if (pointerId == ev.pointerId) { cb?.(ev); } };
    root.addEventListener("pointerup", rst);
    root.addEventListener("pointercancel", rst);
    root.addEventListener("pointermove", tgi);
    const wr = new WeakRef(root);
    return ()=>{
        const root = wr?.deref?.();
        root?.removeEventListener?.("pointerup", rst);
        root?.removeEventListener?.("pointercancel", rst);
        root?.removeEventListener?.("pointermove", tgi);
    }
}

//
export const handleForFixPosition = (container, cb, root = window)=>{
    const ptu = (ev)=>cb?.(ev);
    container?.addEventListener?.("scroll", ptu);
    root?.addEventListener?.("resize", ptu);
    const obs = observeContentBox(container, ptu);
    const wr  = new WeakRef(root), wc = new WeakRef(container);
    return ()=>{
        wc?.deref?.()?.removeEventListener?.("scroll", ptu);
        wr?.deref?.()?.removeEventListener?.("resize", ptu);
        obs?.disconnect?.();
    }
}

//
export const pointerRef = ()=>{
    const coordinate = [ ref(0), ref(0) ];
    coordinate.push(WRef(handleByPointer((ev)=>{ coordinate[0].value = ev.clientX; coordinate[1].value = ev.clientY; })));
    if (coordinate[2]?.deref?.() ?? coordinate[2]) { addToCallChain(coordinate, Symbol.dispose, coordinate[2]?.deref?.() ?? coordinate[2]); }
    return coordinate;
}

//
export const visibleBySelectorRef = (selector)=>{
    const visRef = booleanRef(false), usub = handleByPointer((ev)=>{
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        visRef.value = target?.matches?.(selector) ?? false;
    });
    if (usub) addToCallChain(visRef, Symbol.dispose, usub); return visRef;
}

//
export const showAttributeRef = (attribute = "data-tooltip")=>{
    const valRef = stringRef(""), usub = handleByPointer((ev)=>{
        const target: any = document.elementFromPoint(ev.clientX, ev.clientY);
        valRef.value = target?.getAttribute?.(attribute)?.(`[${attribute}]`) ?? "";
    });
    if (usub) addToCallChain(valRef, Symbol.dispose, usub); return valRef;
}

//
//! TODO: My final promise...
//! - area out trigger (unflag)
//! - area outer click/action trigger (unflag)
//! - area dynamicly updated by events (getBoundingClientRect or some sort of)

//
type RefBool = { value: boolean };
interface TriggerOptions {
    root?: any;
    selector?: string;     // селектор, внутри которого клик не считается "dispose"
    closeEvents?: string[]; // дополнительные события для "dispose"
    mouseLeaveDelay?: number; // задержка для mouseleave
}

//
const $set = (rv, key, val)=>{ if (rv?.deref?.() != null) { return (rv.deref()[key] = val); }; }

//
export function makeInterruptTrigger(
    ref: RefBool, element: any = document.documentElement,
    closeEvents: string[] = ["pointerdown", "click", "contextmenu", "scroll"]
) {
    const wr = new WeakRef(ref);
    const close = () => { $set(wr, "value", false); }, open = () => { $set(wr, "value", true); };
    closeEvents.forEach(event => element.addEventListener(event, close));
    addToCallChain(ref, Symbol.dispose, ()=>closeEvents.forEach(event => element.removeEventListener(event, close)));
    return ref;
}


//
export function makeClickOutsideTrigger(ref: RefBool, element: any, options: TriggerOptions = {}) {
    const {
        root = document.documentElement,
        closeEvents = ["scroll", "click"],
        mouseLeaveDelay = 100
    } = options;

    //
    let mouseLeaveTimer: any = null;
    function isOutside(target: any) {
        if (element && (element?.contains?.(target?.element ?? target) || element?.querySelector?.(target?.selector || ""))) return false;
        return true;
    }

    //
    const wr = new WeakRef(ref);
    function onMouseLeave() { mouseLeaveTimer = setTimeout(() => { $set(wr, "value", false); }, mouseLeaveDelay); }
    function onMouseEnter() { if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer); }
    function onDisposeEvent() { $set(wr, "value", false); }
    function onPointerDown(ev: Event) {
        const t = ev.target as HTMLElement;
        if (isOutside(t)) $set(wr, "value", false);
    }

    //
    root?.addEventListener?.("pointerdown", onPointerDown);
    closeEvents.forEach(event => root?.addEventListener?.(event, onDisposeEvent));
    if (element) {
        element.addEventListener("mouseleave", onMouseLeave);
        element.addEventListener("mouseenter", onMouseEnter);
    }

    //
    const we = new WeakRef(element), rw = new WeakRef(root);

    //
    function destroy() {
        const root = rw?.deref?.();  root.removeEventListener("pointerdown", onPointerDown);
        closeEvents.forEach(event => root.removeEventListener(event, onDisposeEvent));
        const element = we?.deref?.();
        if (element) {
            element.removeEventListener("mouseleave", onMouseLeave);
            element.removeEventListener("mouseenter", onMouseEnter);
        }
    }

    //
    addToCallChain(ref, Symbol.dispose, destroy);
    return ref;
}

//
type Area = {
    left  : number;
    top   : number;
    right : number;
    bottom: number;
    width : number;
    height: number;
};

//
export function boundingBoxRef(anchor: HTMLElement, options?: {
    root?: HTMLElement,
    observeResize?: boolean,
    observeMutations?: boolean,
}) {
    const area: Area = makeReactive({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
    const { root = window, observeResize = true, observeMutations = false } = options || {};

    //
    function updateArea() {
        const rect  = anchor?.getBoundingClientRect?.() ?? {};
        area.top    = rect?.top;
        area.left   = rect?.left;
        area.right  = rect?.right;
        area.width  = rect?.width;
        area.bottom = rect?.bottom;
        area.height = rect?.height;
    }

    //
      root.addEventListener("scroll", updateArea, true);
    window.addEventListener("resize", updateArea);

    //
    let resizeObs: ResizeObserver | undefined;
    if (observeResize && "ResizeObserver" in window) {
        resizeObs = new ResizeObserver(updateArea);
        resizeObs.observe(anchor);
    }

    //
    let mutationObs: MutationObserver | undefined;
    if (observeMutations) {
        mutationObs = new MutationObserver(updateArea);
        mutationObs.observe(anchor, { attributes: true, childList: true, subtree: true });
    }

    //
    const wr = new WeakRef(root); updateArea();
    function destroy() {
        wr?.deref?.()?.removeEventListener?.("scroll", updateArea, true);
        window       ?.removeEventListener?.("resize", updateArea);
        resizeObs?.disconnect?.(); mutationObs?.disconnect?.();
    }

    //
    if (destroy) addToCallChain(area, Symbol.dispose, destroy);
    return area;
}
