import { setStyleProperty, bindDraggable } from "fest/dom";
import { makeShiftTrigger } from "../controllers/Trigger";
import { bindCtrl, bindWith, handleStyleChange } from "fest/lure";
import { computed, conditional, numberRef, ref } from "fest/object";

//
export const boolDepIconRef = (cnd)=> conditional(cnd, "badge-check", "badge");
export const indicationRef = (ref)=> computed(ref, (v)=>(parseFloat(v) || 0)?.toLocaleString?.('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
}));

// get into [0, 1]
const getStyleValue = (inp)=>{
    if (inp?.valueAsNumber != null) { return ((inp?.valueAsNumber || 0) - parseFloat(inp?.min || 0)) / ((parseFloat(inp?.max || 0) - parseFloat(inp?.min || 0)) || 1); } else
    if (inp?.checked != null && inp?.type == "checkbox") { return inp?.checked ? 1 : 0; } else
    if (inp?.type == "radio") {
        const all = [...inp?.parentNode?.querySelectorAll?.('input[type="radio"]')];
        const len = all?.length, nth = all?.indexOf?.(inp) ?? -1;
        if (nth >= 0) { return Math.max(Math.min(nth / (len - 1), 1), 0); }
    }
    return 0;
}

// get value shift
const computeRelateFromValueFromShift = (input, shift, container)=>{
    // relative pointer coordinate info [0, 1]
    const dec = (shift?.[0]?.value || 0) / (container?.offsetWidth || 1);

    // compute value shift
    if (input?.type == "number" || input?.type == "range"){
        const max = (parseFloat(input?.max || 0) - parseFloat(input?.min || 0));
        return dec * max;
    } else
    if (input?.type == "checkbox") { return Math.sign(shift?.[0]?.value); } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length;
        const max = Math.max(len - 1, 0);
        return dec * max;
    }

    // get value shift
    return shift?.[0]?.value;
}

// set value from shifting value
const setValueByShift = (input, valueShift) => {
    if (input?.type == "number" || input?.type == "range") {
        if (valueShift != 0) { input.valueAsNumber += valueShift; input?.dispatchEvent?.(new Event("change", { bubbles: true })); }
    } else
    if (input?.type == "checkbox") {
        if (valueShift > 0 && !input?.checked || valueShift < 0 &&  input?.checked) { input?.click?.(); }
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
        const idx = Math.max(Math.min(nth + Math.round(valueShift), len - 1), 0);
        if (valueShift != 0 && nth >= 0) { all[idx]?.click?.(); };
    }
}

// from pointer coordinate from container
const setInto = (input, relateFromCorner, container)=>{
    const intoValue = relateFromCorner / (container?.offsetWidth || 1); // [0, 1]

    //
    if (input?.type == "number" || input?.type == "range") {
        const min = parseFloat(input?.min || 0), max = parseFloat(input?.max || 0);
        if (intoValue != 0) { input.valueAsNumber = intoValue * (max - min) + min; input?.dispatchEvent?.(new Event("change", { bubbles: true })); }
    } else
    if (input?.type == "checkbox") {
        if (intoValue > 0 && !input?.checked || intoValue < 0 &&  input?.checked) { input?.click?.(); }
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
        const idx = Math.max(Math.min(nth + Math.round(intoValue), len - 1), 0);
        if (intoValue != 0 && nth >= 0) { all[idx]?.click?.(); }
    }
}

// TODO: support animation
const resolveDragging = (input, dragging, container) => {
    // in case of input is HTMLInputElement
    const valueShift = computeRelateFromValueFromShift(input, dragging, container);
    setValueByShift(input, valueShift);

    // reset dragging coordinate
    try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
    return [0, 0];
};

// reference of [0, 1]
const styleValueRef = (inp)=>{
    const rf = numberRef(getStyleValue(inp));
    const ctr = (ev)=>{ rf.value = getStyleValue(ev?.target ?? inp); }
    bindCtrl?.(inp, ctr); return rf;
}

//
export const dragSlider = (container, handler, input)=>{ // @ts-ignore
    const correctOffset = (dragging)=>{
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        return [0, 0];
    };

    //
    const dragging = [ ref(0), ref(0) ];
    const customTrigger = (doGrab)=>handler?.addEventListener?.("pointerdown", makeShiftTrigger((ev)=>{correctOffset(dragging); doGrab?.(ev, handler)}));

    //
    handler?.addEventListener?.("click", (ev)=>{ if (input?.type == "checkbox" || input?.type == "radio") { input?.click?.(); } });
    handler?.addEventListener?.("pointerdown", (ev)=>{
        const relateFromCorner = (ev?.layerX || 0) - (handler?.offsetLeft || 0);
        setInto(input, relateFromCorner, container);
    });

    //
    bindWith?.(handler, "--drag-x", dragging?.[0], handleStyleChange);
    bindWith?.(handler, "--relate", computed(dragging?.[0], (v)=>computeRelateFromValueFromShift(input, dragging, container)), handleStyleChange); // [0, 1]
    bindWith?.(handler, "--value", styleValueRef(input), handleStyleChange); // from [0, 1]
    return bindDraggable(customTrigger, resolveDragging, dragging);
};
