import { getBoundingOrientRect, bindDraggable, setProperty, contentBoxWidth, contentBoxHeight, borderBoxWidth, borderBoxHeight } from "fest/dom";
import { makeShiftTrigger, doObserve } from "./Trigger";

//
import {  E  } from "fest/lure";
import { ref } from "fest/object";

//
export class DragHandler {
    #holder: HTMLElement;
    #dragging = [{value: 0}, {value: 0}];

    // @ts-ignore
    get #parent() { return this.#holder.offsetParent ?? this.#holder?.host ?? ROOT; }

    //
    constructor(holder, options?: any) {
        if (!holder) { throw Error("Element is null..."); }
        doObserve(this.#holder = holder, this.#parent); this.#dragging = [ref(0), ref(0)];
        if (options) this.draggable(options);
    }

    //
    draggable(options) {
        const handler = options.handler ?? this.#holder;
        const dragging = this.#dragging;

        //
        const weak        = new WeakRef(this.#holder);
        const binding     = (grabAction) => handler.addEventListener("pointerdown", makeShiftTrigger(grabAction, this.#holder));
        const dragResolve = (dragging)   => {
            const holder = weak?.deref?.() as any;
            holder?.style?.removeProperty?.("will-change");

            //
            setProperty(holder, "--drag-x", dragging[0].value = 0);
            setProperty(holder, "--drag-y", dragging[1].value = 0);

            //
            const box = getBoundingOrientRect(holder) || holder?.getBoundingClientRect?.();
            setProperty(holder, "--shift-x", (box?.left || 0) - (this.#parent?.[contentBoxWidth ] - this.#holder[borderBoxWidth ]) * 0.5);
            setProperty(holder, "--shift-y", (box?.top  || 0) - (this.#parent?.[contentBoxHeight] - this.#holder[borderBoxHeight]) * 0.5);
        }

        //
        E(this.#holder, { style: { "--drag-x": this.#dragging[0], "--drag-y": this.#dragging[1] } });
        return bindDraggable(binding, dragResolve, dragging);
    }
}

//
export default DragHandler;
