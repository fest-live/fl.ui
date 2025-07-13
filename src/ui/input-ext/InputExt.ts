import { setStyleProperty, bindDraggable } from "fest/dom";
import { makeShiftTrigger } from "../../controllers/Trigger";
import { bindWith, handleStyleChange } from "fest/lure";
import { computed, conditional, ref } from "fest/object";


//
export const boolDepIconRef = (cnd)=> conditional(cnd, "badge-check", "badge");
export const indicationRef = (ref)=> computed(ref, (v)=>(parseFloat(v) || 0)?.toLocaleString?.('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
}));


//
export const dragSlider = (container, handler, input)=>{ // @ts-ignore
    const correctOffset = (dragging)=>{

        // reset dragging offset
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        return [0, 0];
    };

    //
    const computeRelation = ()=>{
        if (input?.type == "number" || input?.type == "range")
            {const range = (parseFloat(input?.max || 0) - parseFloat(input?.min || 0));
            return ((dragging?.[0]?.value || 0) / (container?.offsetWidth || 1)) * range; } else
        if (input?.type == "checkbox") { return Math.sign(dragging?.[0]?.value); } else
        if (input?.type == "radio") {
            const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length;
            return ((dragging?.[0]?.value || 0) / (container?.offsetWidth || 1)) * Math.max(len - 1, 0);
        }
        return dragging?.[0]?.value;
    }

    // TODO: support animation
    const resolveDragging = (dragging) => {
        // in case of input is HTMLInputElement
        const relate = computeRelation();

        //
        if (input?.type == "number" || input?.type == "range") {
            if (relate != 0) { input.valueAsNumber += relate; input?.dispatchEvent?.(new Event("change", { bubbles: true })); }
        } else
        if (input?.type == "checkbox") {
            if (relate > 0 && !input?.checked || relate < 0 &&  input?.checked) { input?.click?.(); }
        } else
        if (input?.type == "radio") {
            const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
            if (relate != 0 && nth >= 0) { all[Math.max(Math.min(nth + Math.round(relate), len - 1), 0)]?.click?.(); };
        }

        // reset dragging coordinate
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        return [0, 0];
    };

    //
    const dragging = [ ref(0), ref(0) ];
    const customTrigger = (doGrab)=>handler?.addEventListener?.("pointerdown", makeShiftTrigger((ev)=>{correctOffset(dragging); doGrab?.(ev, handler)}));
    const handleValue = (ev)=>{
        const inp = ev?.target ?? input;

        //! css related:
        // --value: progress(var(--input-value, 0), attr(min type(<number>), 0), attr(max type(<number>), 1))

        if (inp?.valueAsNumber != null) { setStyleProperty(handler, "--value", ((inp?.valueAsNumber || 0) - parseFloat(inp?.min || 0)) / ((parseFloat(inp?.max || 0) - parseFloat(inp?.min || 0)) || 1)); } else
        if (inp?.checked != null && inp?.type == "checkbox") { setStyleProperty(handler, "--value", inp?.checked ? 1 : 0); } else
        if (inp?.type == "radio") {
            const all = [...inp?.parentNode?.querySelectorAll?.('input[type="radio"]')];
            const len = all?.length, nth = all?.indexOf?.(inp) ?? -1;
            if (nth >= 0) { setStyleProperty(handler, "--value", Math.max(Math.min(nth / (len - 1), 1), 0)); }
        }
    }

    //
    handler?.addEventListener?.("click", (ev)=>{ if (input?.type == "checkbox" || input?.type == "radio") { input?.click?.(); } });
    bindWith?.(handler, "--drag-x", dragging?.[0], handleStyleChange);
    bindWith?.(handler, "--relate", computed(dragging?.[0], (v)=>computeRelation()), handleStyleChange);
    container?.addEventListener?.("click", handleValue);
    container?.addEventListener?.("input", handleValue);
    container?.addEventListener?.("change", handleValue);
    return bindDraggable(customTrigger, resolveDragging, dragging);
};
