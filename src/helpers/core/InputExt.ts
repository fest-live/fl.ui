import { bindDraggable, handleStyleChange } from "fest/dom";
import { makeShiftTrigger } from "../controllers/Trigger";
import { bindCtrl, bindWith } from "fest/lure";
import { computed, numberRef, conditional, ref } from "fest/object";

/* ***************************************************************************************** *
 * Here few version of value and coordinates                                                 *
 * #. [type]  : [components]:        , [relative_version], # commetary                       *
 * 1. value   : [value, min, max]    , value_shift       , # used for value                  *
 * 2. pointer : [x, y]               , pointer_shift     , # used from events                *
 * 3. inp_box : [offset, width, zoom],                   , # used for pointer                *
 * 4. clamped : [from 0 to 1]        ,                   , # used for styles, in conversions *
 * 5. dragging: [dx, dy]             ,                   , # relative from current offset    *
 * ***************************************************************************************** */

//
export const boolDepIconRef = (cnd)=> conditional(cnd, "badge-check", "badge");
export const indicationRef = (ref)=> computed(ref, (v)=>(parseFloat(v) || 0)?.toLocaleString?.('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
}));

// currently, unused
const convertValueToPointer = (input)=>{
    const $cmp = getInputValues(input);
    const [value, min, max] = $cmp;
    if (input?.type == "number" || input?.type == "range") {
        return (value - min) / (max - min);
    } else
    if (input?.type == "checkbox") {
        return value ? 1 : 0;
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
        return nth / (len - 1);
    }
    return value;
}

// "relative"
const convertPointerToValueShift = (input, shift, container)=>{
    // relative pointer coordinate info [0, 1]
    const dec = (shift?.[0]?.value || 0) / (container?.offsetWidth || 1);
    const $cmp = getInputValues(input), [_, min, max] = $cmp;

    // compute value shift
    if (input?.type == "checkbox") { return Math.sign(shift?.[0]?.value); } else
    if (input?.type == "range" || input?.type == "number") { return dec * (max - min); } else
    if (input?.type == "radio") { return Math.round(dec * max); }
    return dec;
}

// get correct value for input types
const correctValue = (input, val)=>{
    if (input?.type == "number" || input?.type == "range")
        { return val; } else
    if (input?.type == "checkbox")
        { return val > 0.5 ? true : false;
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length;
        return Math.max(Math.min(Math.round(val), len), 0);
    }
}

// "absolute"
const convertPointerToValue = (input, relateFromCorner, container)=>{
    const clamped = relateFromCorner / (container?.offsetWidth || 1); // [0, 1]
    const $cmp = getInputValues(input), [_, min, max] = $cmp;
    const val = clamped * (max - min) + min;
    return correctValue(input, val);
}

//
const getValueWithShift = (input, valueShift)=>{
    const $cmp = getInputValues(input);
    return correctValue(input, $cmp?.[0] + valueShift);
}

//
const setValue = (input, value)=>{
    const $cmp = getInputValues(input), [_, min, max] = $cmp;
    if (input?.type == "number" || input?.type == "range")
        { if (value != input.valueAsNumber) { input.valueAsNumber = value; input?.dispatchEvent?.(new Event("change", { bubbles: true })); } } else
    if (input?.type == "checkbox")
        { if (value && input.chacked != value) { input?.click?.(); } } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')];
        if (value != 0) { all[Math.max(Math.min(Math.round(value), max), min)]?.click?.(); }
    }
}



// combined getValueWithShift with setValue
const setValueByShift = (input, valueShift) => {
    return setValue(input, getValueWithShift(input, valueShift));
}

//
const setValueByPointer = (input, pointer, container)=>{
    return setValue(input, convertPointerToValue(input, pointer, container));
}



// TODO: support animation
const resolveDragging = (input, dragging, container) => {
    // in case of input is HTMLInputElement
    setValueByShift(input, convertPointerToValueShift(input, dragging, container));

    // reset dragging coordinate
    try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
    return [0, 0];
};

//
const getInputValues = (inp): [number, number, number] =>{
    if (inp?.valueAsNumber != null) { return [(inp?.valueAsNumber || 0), parseFloat(inp?.min || 0), parseFloat(inp?.max || 0)]; } else
    if (inp?.checked != null && inp?.type == "checkbox") { return [inp?.checked ? 1 : 0, 0, 1]; } else
    if (inp?.type == "radio") {
        const all = [...inp?.parentNode?.querySelectorAll?.('input[type="radio"]')];
        const len = all?.length, nth = all?.indexOf?.(inp) ?? -1;
        return [nth, 0, len-1];
    }
    return [0, 0, 0];
}

//
const progress = (value, min, max)=>{
    return (value - min) / (max - min);
}

// get into [0, 1]
const getClampedValue = (inp)=>{
    return progress(...getInputValues(inp));
}

// reference of [0, 1]
export const clampedValueRef = (inp)=>{
    const rf = numberRef(getClampedValue(inp));
    const ctr = (ev)=>{ rf.value = getClampedValue(ev?.target ?? inp); };
    bindCtrl?.(inp, ctr); return rf;
}

//
export const dragSlider = (container, handler, input)=>{ // @ts-ignore
    const correctOffset = (dragging)=>{ try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {}; return [0, 0]; };
    const customTrigger = (doGrab)=>handler?.addEventListener?.("pointerdown", makeShiftTrigger((ev)=>{ correctOffset(dragging); doGrab?.(ev, handler)}));

    //
    handler?.addEventListener?.("click", (ev)=>{ if (input?.type == "checkbox" || input?.type == "radio") { input?.click?.(); } });
    handler?.addEventListener?.("pointerdown", (ev)=>{ setValueByPointer(input, ev?.layerX || 0, container); }); // "absolute"

    //
    const dragging = [ ref(0), ref(0) ];
    bindWith?.(handler, "--drag-x", dragging?.[0], handleStyleChange);
    bindWith?.(handler, "--relate", computed(dragging?.[0], (v)=>convertPointerToValueShift(input, dragging, container)), handleStyleChange); // "relative"
    bindWith?.(handler, "--value", clampedValueRef(input), handleStyleChange); // from [0, 1]
    return bindDraggable(customTrigger, resolveDragging, dragging);
};
