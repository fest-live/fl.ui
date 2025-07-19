import { bindDraggable } from "fest/dom";
import { makeShiftTrigger } from "../controllers/Trigger";
import { bindCtrl, bindWith, handleStyleChange } from "fest/lure";
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
const convertValueToPointer = (input, value)=>{
    if (input?.type == "number" || input?.type == "range") {
        const min = parseFloat(input?.min || 0), max = parseFloat(input?.max || 0);
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
    return dec;
}

// "absolute"
const convertPointerToValue = (input, relateFromCorner, container)=>{
    const intoValue = relateFromCorner / (container?.offsetWidth || 1); // [0, 1]

    //
    if (input?.type == "number" || input?.type == "range") {
        const min = parseFloat(input?.min || 0), max = parseFloat(input?.max || 0);
        return intoValue * (max - min) + min;
    } else
    if (input?.type == "checkbox") {
        return intoValue > 0.5;
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
        return Math.max(Math.min(Math.round(intoValue), len - 1), 0);
    }
    return intoValue;
}



//
const getValueWithShift = (input, valueShift)=>{
    if (input?.type == "number" || input?.type == "range") {
        return input.valueAsNumber + valueShift;
    } else
    if (input?.type == "checkbox") {
        // valueShift 0 is centroid, so minus (left) to false, plus (right) to true
        return valueShift > 0 ? true : false;
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
        return Math.max(Math.min(nth + Math.round(valueShift), len - 1), 0);
    }
    return valueShift;
}

//
const setValue = (input, value)=>{
    if (input?.type == "number" || input?.type == "range") {
        if (value != input.valueAsNumber) { input.valueAsNumber = value; input?.dispatchEvent?.(new Event("change", { bubbles: true })); }
    } else
    if (input?.type == "checkbox") {
        if (value && input.chacked != value) { input?.click?.(); }
    } else
    if (input?.type == "radio") {
        const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
        const idx = Math.max(Math.min(Math.round(value), len - 1), 0);
        if (value != 0 && nth >= 0) { all[idx]?.click?.(); }
    }
}



// combined getValueWithShift with setValue
const setValueByShift = (input, valueShift) => {
    /*
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
    }*/

    //
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



// get into [0, 1]
const getClampedValue = (inp)=>{
    if (inp?.valueAsNumber != null) { return ((inp?.valueAsNumber || 0) - parseFloat(inp?.min || 0)) / ((parseFloat(inp?.max || 0) - parseFloat(inp?.min || 0)) || 1); } else
    if (inp?.checked != null && inp?.type == "checkbox") { return inp?.checked ? 1 : 0; } else
    if (inp?.type == "radio") {
        const all = [...inp?.parentNode?.querySelectorAll?.('input[type="radio"]')];
        const len = all?.length, nth = all?.indexOf?.(inp) ?? -1;
        if (nth >= 0) { return Math.max(Math.min(nth / (len - 1), 1), 0); }
    }
    return 0;
}

// reference of [0, 1]
const clampedValueRef = (inp)=>{
    const rf = numberRef(getClampedValue(inp));
    const ctr = (ev)=>{ rf.value = getClampedValue(ev?.target ?? inp); };
    bindCtrl?.(inp, ctr); return rf;
}

//
export const dragSlider = (container, handler, input)=>{ // @ts-ignore
    const correctOffset = (dragging)=>{ try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {}; return [0, 0]; };
    const customTrigger = (doGrab)=>handler?.addEventListener?.("pointerdown", makeShiftTrigger((ev)=>{correctOffset(dragging); doGrab?.(ev, handler)}));

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
