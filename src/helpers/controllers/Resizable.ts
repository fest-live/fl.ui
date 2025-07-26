import { fixedClientZoom, getBoundingOrientRect, bindDraggable, clamp, bbh, bbw, cbh, cbw, ROOT, type InteractStatus } from "fest/dom";
import { makeShiftTrigger, doObserve } from "./Trigger";

//
import {  E  } from "fest/lure";
import { numberRef } from "fest/object";

//
export class ResizeHandler {
    #holder: HTMLElement;
    #resizing = [{value: 0}, {value: 0}];

    // @ts-ignore
    get #parent() { return this.#holder.offsetParent ?? this.#holder?.host ?? ROOT; }

    //
    constructor(holder, options?: any) {
        if (!holder) { throw Error("Element is null..."); }
        doObserve(this.#holder = holder, this.#parent); this.#resizing = [numberRef(0), numberRef(0)];
        if (options) this.resizable(options);
    }

    //
    limitResize(real, virtual, holder, container) {
        const box        = getBoundingOrientRect(holder) || holder?.getBoundingClientRect?.();
        const widthDiff  = cbw(container) - (bbw(holder) - (this.#resizing[0].value || 0) + ((box.left || 0) * fixedClientZoom(this.#holder)));
        const heightDiff = cbh(container) - (bbh(holder) - (this.#resizing[1].value || 0) + ((box.top  || 0) * fixedClientZoom(this.#holder)));

        // if relative of un-resized to edge corner max-size
        // discount of dragging offset!
        real[0] = clamp(0, virtual[0], widthDiff);
        real[1] = clamp(0, virtual[1], heightDiff);
        return real;
    }

    //
    resizable(options) {
        const handler  = options.handler ?? this.#holder, status: InteractStatus = { pointerId: -1 };
        const resizing = this.#resizing, weak = new WeakRef(this.#holder), self_w = new WeakRef(this);

        //
        const dragResolve = (dragging) => weak?.deref?.()?.style.removeProperty("will-change");
        const binding  = (grabAction)=>handler.addEventListener("pointerdown", (ev)=>makeShiftTrigger(grabAction, this.#holder)?.(ev));
        const initDrag = ()=>{
            const starting = [resizing[0].value || 0, resizing[1].value || 0];
            const holder = weak?.deref?.() as any;
            const parent = holder?.offsetParent ?? holder?.host ?? ROOT;
            self_w?.deref?.()?.limitResize?.(starting, starting, holder, parent)
        };

        //
        E(this.#holder, { style: { "--resize-x": this.#resizing[0], "--resize-y": this.#resizing[1] } });
        return bindDraggable(binding, dragResolve, resizing, initDrag);
    }
}

//
export default ResizeHandler;
