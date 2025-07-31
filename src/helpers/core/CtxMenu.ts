import { H, Q, visibleRef } from "fest/lure";
import { boundingBoxRef, makeInterruptTrigger, withInsetWithPointer } from "./Anchor";
import { addEvent, removeEvent } from "fest/dom";

//
export const itemClickHandle = (ev, ctxMenuDesc: any)=>{
    const id = Q(`[data-id]`, ev?.target, 0, "parent")?.getAttribute?.("data-id");
    const item = ctxMenuDesc?.items?.find?.((I: any)=>I?.id == id);
    item?.action?.(ctxMenuDesc?.openedWith?.initiator, item, ev);
    ctxMenuDesc?.openedWith?.close?.();

    //
    const visibleRef = getBoundVisibleRef(ctxMenuDesc?.openedWith?.element);
    if (visibleRef != null) visibleRef.value = false;
}

//
const visibleMap = new WeakMap();

// TODO: visible bindings
const getBoundVisibleRef = (menuElement: HTMLElement): any => {
    if (menuElement == null) return; // @ts-ignore
    return visibleMap?.getOrInsertComputed?.(menuElement, ()=>visibleRef(menuElement, false));
}

//
export const bindMenuItemClickHandler = (menuElement: HTMLElement, menuDesc: any)=>{
    const handler = (ev)=>{ itemClickHandle(ev, menuDesc); };
    addEvent(menuElement, "click", handler);
    return ()=>removeEvent(menuElement, "click", handler);
}

//
export const makeMenuHandler = (triggerElement: HTMLElement, placement: any, ctxMenuDesc: any, menuElement: HTMLElement = Q("ui-modal[type=\"contextmenu\"]", document.body))=>{
    return (ev)=>{ // @ts-ignore
        if (menuElement?.contains?.(ev?.target) || ev?.target == (menuElement?.element ?? menuElement)) {
            ev?.preventDefault?.(); return;
        }

        //
        const initiator  = ev?.target ?? triggerElement ?? document.elementFromPoint(ev?.clientX || 0, ev?.clientY || 0);
        const visibleRef = getBoundVisibleRef(menuElement);

        //
        if (visibleRef?.value && ev?.type != "contextmenu") {
            visibleRef.value = false;
            ctxMenuDesc?.openedWith?.close?.();
        } else
        if (initiator && visibleRef) {
            ev?.preventDefault?.();

            // TODO: use reactive mapped ctx-menu element
            menuElement.innerHTML = ''; if (visibleRef != null) visibleRef.value = true;
            menuElement?.append?.(...(ctxMenuDesc?.items?.map?.((section, sIdx)=>{
                const items = section?.map?.((item, iIdx)=>H`<li data-id=${item?.id||""}><ui-icon icon=${item?.icon||""}></ui-icon><span>${item?.label||""}</span></li>`);
                const separator = (section?.length > 1 && sIdx != (ctxMenuDesc?.items?.length - 1)) ? H`<li class="ctx-menu-separator"></li>` : null;
                return [ ...items, separator ];
            })?.flat()?.filter?.((E)=>!!E)||[]));

            //
            const where     = withInsetWithPointer?.(menuElement, placement?.(ev, initiator));
            const unbind    = bindMenuItemClickHandler(menuElement, ctxMenuDesc);

            //
            if (ctxMenuDesc) ctxMenuDesc.openedWith = {
                initiator,
                element: menuElement,
                close() {
                    if (visibleRef != null) visibleRef.value = false;
                    ctxMenuDesc.openedWith = null;
                    unbind?.(); where?.();
                }
            };
        }
    };
}

// use cursor as anchor based on contextmenu
export const ctxMenuTrigger = (triggerElement: HTMLElement, ctxMenuDesc: any, menuElement: HTMLElement = Q("ui-modal[type=\"contextmenu\"]", document.body))=>{
    const evHandler = makeMenuHandler(triggerElement, (ev)=>[ev?.clientX, ev?.clientY, 200], ctxMenuDesc, menuElement);
    const untrigger = makeInterruptTrigger?.(menuElement, (ev)=>{ // @ts-ignore
        if (!(menuElement?.contains?.(ev?.target) || ev?.target == (triggerElement?.element ?? triggerElement)) || !ev?.target) {
            ctxMenuDesc?.openedWith?.close?.();
            const visibleRef = getBoundVisibleRef(menuElement);
            if (visibleRef != null) visibleRef.value = false;
        }
    }, [ "click", "pointerdown", "scroll" ]);

    //
    addEvent(triggerElement, "contextmenu", evHandler);
    return ()=>{ untrigger?.(); removeEvent(triggerElement, "contextmenu", evHandler); };
}

// bit same as contextmenu, but different by anchor and trigger (from element drop-down)
export const dropMenuTrigger = (triggerElement: HTMLElement, ctxMenuDesc: any, menuElement: HTMLElement = Q("ui-modal[type=\"menulist\"]", document.body))=>{
    const anchorElement = triggerElement;
    const evHandler = makeMenuHandler(triggerElement, (ev)=>boundingBoxRef(anchorElement)?.slice?.(0, 3), ctxMenuDesc, menuElement);
    const untrigger = makeInterruptTrigger?.(menuElement, (ev)=>{ // @ts-ignore
        if (!(menuElement?.contains?.(ev?.target) || ev?.target == (triggerElement?.element ?? triggerElement)) || !ev?.target) {
            ctxMenuDesc?.openedWith?.close?.();
            const visibleRef = getBoundVisibleRef(menuElement);
            if (visibleRef != null) visibleRef.value = false;
        }
    }, [ "click", "pointerdown", "scroll" ]);

    //
    addEvent(triggerElement, "click", evHandler);
    return ()=>{ untrigger?.(); removeEvent(triggerElement, "click", evHandler); };
}
