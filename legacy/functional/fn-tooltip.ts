import { ref, booleanRef, stringRef } from "u2re/object";
import { WRef, observeContentBox } from "u2re/dom";

//
const ROOT = document.documentElement;
export const handleByPointer = (cb, root = ROOT)=>{
    let pointerId = -1;
    const rst = (ev)=>{ pointerId = -1; };
    const tgi = (ev)=>{ if (pointerId < 0) pointerId = ev.pointerId; if (pointerId == ev.pointerId) { cb?.(ev); } };
    root.addEventListener("pointerup", rst);
    root.addEventListener("pointercancel", rst);
    root.addEventListener("pointermove", tgi);
    return ()=>{
        root.removeEventListener("pointerup", rst);
        root.removeEventListener("pointercancel", rst);
        root.removeEventListener("pointermove", tgi);
    }
}

//
export const handleForFixPosition = (container, cb, root = window)=>{
    const ptu = (ev)=>cb?.(ev);
    container.addEventListener("scroll", ptu);
    root.addEventListener("resize", ptu);
    const obs = observeContentBox(container, ptu);
    return ()=>{
        container.removeEventListener("scroll", ptu);
        root.removeEventListener("resize", ptu);
        obs?.disconnect?.();
    }
}

//
export const pointerRef = ()=>{
    const coordinate = [ ref(0), ref(0) ];
    coordinate.push(WRef(handleByPointer((ev)=>{ coordinate[0].value = ev.clientX; coordinate[1].value = ev.clientY; })));
    coordinate[Symbol.dispose] = coordinate[2]?.deref?.() ?? coordinate[2];
    return coordinate;
}

//
export const visibleBySelectorRef = (selector)=>{
    const visRef = booleanRef(false);
    visRef[Symbol.dispose] = handleByPointer((ev)=>{
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        visRef.value = target?.matches?.(selector) ?? false;
    });
    return visRef;
}

//
export const showAttributeRef = (attribute = "data-tooltip")=>{
    const valRef = stringRef("");
    valRef[Symbol.dispose] = handleByPointer((ev)=>{
        const target: any = document.elementFromPoint(ev.clientX, ev.clientY);
        valRef.value = target?.getAttribute?.(attribute)?.(`[${attribute}]`) ?? "";
    });
    return valRef;
}

//
//! TODO: My final promise...
//! - area out trigger (unflag)
//! - area outer click/action trigger (unflag)
//! - area dynamicly updated by events (getBoundingClientRect or some sort of)
