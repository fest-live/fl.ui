import { electronAPI } from "./Config.js";
import { formatCss, formatHex, oklch, parse } from "culori";
import { addEvent, fixedClientZoom } from "fest/dom";
import { stringRef } from "fest/object";

//
const tacp = (color: string)=>{
    const p = parse?.(color);
    return (p?.alpha == null || p?.alpha > 0.1);
};

//
const setIdleInterval = (cb, timeout = 1000, ...args)=>{
    requestIdleCallback(async ()=>{
        if (!cb || (typeof cb != "function")) return;
        while (true) { // @ts-ignore
            await Promise.try(cb, ...args);
            await new Promise((r)=>setTimeout(r, timeout));
            await new Promise((r)=>requestIdleCallback(r, {timeout: 100}));
            await new Promise((r)=>requestAnimationFrame(r));
        }
    }, {timeout: 1000});
}

//
export const pickBgColor = (x, y, holder: HTMLElement | null = null)=>{
    // exclude any non-reasonable
    const opaque = Array.from(document.elementsFromPoint(x, y))?.filter?.((el: any)=>(
        ((el instanceof HTMLElement) && el != holder) &&
        (el?.dataset?.alpha != null ? parseFloat(el?.dataset?.alpha) > 0.01 : true) && // @ts-ignore
         el?.checkVisibility?.({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true }) &&
         el?.matches?.("[data-scheme]:not([data-hidden])") &&
        (el?.style?.getPropertyValue("display") != "none")
    ))
    .map((element) => {
        const computed = getComputedStyle?.(element);
        return {
            element,
            zIndex: parseInt(computed?.zIndex || "0", 10) || 0,
            color: (computed?.backgroundColor || "transparent")
        }})
    .sort((a, b) => Math.sign(b.zIndex - a.zIndex))
    .filter(({ color })=>(color != "transparent" && tacp(color)));

    //
    if (opaque?.[0]?.element instanceof HTMLElement) {
        return formatCss(opaque?.[0]?.color) || "transparent";
    }

    //
    return "transparent";
};

//
export const makeContrast = (color)=>{
    const cl = oklch(color);
    cl.l = Math.sign(0.5 - cl.l);
    cl.c *= 0.1;
    return formatCss(cl);
}

//
export const pickFromCenter = (holder)=>{
    // not able to using some mechanics
    const box = holder?.getBoundingClientRect();//getBoundingOrientBox(holder);
    if (box) {
        const Z = 0.5 * (fixedClientZoom?.() || 1);
        const xy: [number, number] = [(box.left + box.right) * Z, (box.top + box.bottom) * Z];
        return pickBgColor(...xy, holder);
    }
}

//
export const dynamicNativeFrame = (root = document.documentElement)=>{
    const media = root?.querySelector?.('meta[data-theme-color]');
    const color = pickBgColor(window.innerWidth - 64, 30);
    if ((media || window?.[electronAPI]) && root == document.documentElement) {
        media?.setAttribute?.("content", color);
        window?.[electronAPI]?.setThemeColor?.(formatHex(color), formatHex(makeContrast(color)));
    }
}

//
export const dynamicBgColors = (root = document.documentElement) => {
    root.querySelectorAll("[data-scheme=\"dynamic-transparent\"], [data-scheme=\"dynamic\"]").forEach((target)=>{
        if (target) { pickFromCenter(target); }
    });
};

//
export const dynamicTheme = (ROOT = document.documentElement)=>{
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ({}) => dynamicBgColors(ROOT));

    //
    const updater = ()=>{
        dynamicNativeFrame(ROOT);
        dynamicBgColors(ROOT);
    }

    //
    addEvent(ROOT, "u2-appear", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(ROOT, "u2-hidden", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(ROOT, "u2-theme-change", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(window, "load", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(document, "visibilitychange", ()=>requestIdleCallback(updater, {timeout: 100}));
    setIdleInterval(updater, 500);
}

//
export const currentColorFromPointRef = (x, y, ROOT = document.documentElement, timeout = 500)=>{
    const color = pickBgColor(x, y, ROOT);
    const rfc = stringRef(color);
    const updater = ()=>{
        const color = pickBgColor(x, y, ROOT);
        rfc.value = color;
    }

    //
    addEvent(ROOT, "u2-appear", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(ROOT, "u2-hidden", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(ROOT, "u2-theme-change", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(window, "load", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(document, "visibilitychange", ()=>requestIdleCallback(updater, {timeout: 100}));
    setIdleInterval(updater, timeout);
    return rfc;
}

//
export const currentColorFromCenterRef = (element: HTMLElement, ROOT = document.documentElement, timeout = 500)=>{
    const color = pickFromCenter(element);
    const rfc = stringRef(color);
    const updater = ()=>{
        const color = pickFromCenter(element);
        rfc.value = color;
    }

    //
    addEvent(ROOT, "u2-appear", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(ROOT, "u2-hidden", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(ROOT, "u2-theme-change", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(window, "load", ()=>requestIdleCallback(updater, {timeout: 100}));
    addEvent(document, "visibilitychange", ()=>requestIdleCallback(updater, {timeout: 100}));
    setIdleInterval(updater, timeout);
    return rfc;
}

//
export default dynamicTheme;
