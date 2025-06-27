import { setStyleProperty, bindDraggable } from "u2re/dom";
import { makeShiftTrigger } from "../../interface/Trigger";
import { ref, subscribe } from "u2re/object";

//
export const dragSlider = (container, handler, input)=>{ // @ts-ignore

    //
    const correctOffset = (dragging)=>{

        // reset dragging offset
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        return [0, 0];
    };

    // TODO: support animation
    const resolveDragging = (dragging) => {
        // in case of input is HTMLInputElement
        if (input?.type == "number" || input?.type == "range") {
            const vshift = ((dragging?.[0]?.value || 0) / (container?.offsetWidth || 1)) * (parseFloat(input?.max || 0) - parseFloat(input?.min || 0));
            if (vshift != 0) {
                input.valueAsNumber += vshift;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        } else
        if (input?.type == "checkbox") {
            if ((dragging?.[0]?.value || 0) != 0) {
                if (dragging?.[0]?.value > 0 && !input?.checked) { input?.click?.(); }
                if (dragging?.[0]?.value < 0 &&  input?.checked) { input?.click?.(); }
            }
        } else
        if (input?.type == "radio") {
            const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')];
            const len = all?.length, nth = all.indexOf(input);
            const vshift = Math.floor(((dragging?.[0]?.value || 0) / (container?.offsetWidth || 1)) * Math.max(len - 1, 0));
            if (vshift != 0 && nth >= 0) { all[Math.max(Math.min(nth + vshift, len - 1), 0)]?.click?.(); };
        }

        // reset dragging coordinate
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        return [0, 0];
    };

    //
    const dragging = [ ref(0), ref(0) ]; subscribe([dragging, "value"], (v)=>setStyleProperty(handler, "--drag-x", v));
    const customTrigger = (doGrab)=>handler.addEventListener("pointerdown", makeShiftTrigger((ev)=>{correctOffset(dragging); doGrab?.(ev, handler)}));
    const handleValue = (ev)=>{
        const inp = ev?.target ?? input;
        if (inp?.valueAsNumber != null) { setStyleProperty(handler, "--value", (inp?.valueAsNumber || 0) / ((parseFloat(inp?.max || 0) - parseFloat(inp?.min || 0)) || 1)); } else
        if (inp?.checked != null && inp?.type == "checkbox") { setStyleProperty(handler, "--value", inp?.checked ? 1 : 0); } else
        if (inp?.type == "radio") {
            const all = [...inp?.parentNode?.querySelectorAll?.('input[type="radio"]')];
            const len = all?.length, nth = all?.indexOf?.(inp) ?? -1;
            if (nth >= 0) { setStyleProperty(handler, "--value", Math.max(Math.min(nth / (len - 1), 1), 0)); }
        }
    }

    //
    container?.addEventListener?.("click", handleValue);
    container?.addEventListener?.("input", handleValue);
    container?.addEventListener?.("change", handleValue);
    handler?.addEventListener?.("click", (ev)=>{ if (input?.type == "checkbox" || input?.type == "radio") { input?.click?.(); } });

    //
    return bindDraggable(customTrigger, resolveDragging, dragging);
};
