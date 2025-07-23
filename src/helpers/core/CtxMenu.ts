import { H, Q, visibleRef } from "fest/lure";
import { makeInterruptTrigger, withInsetWithPointer } from "./Anchor";

//
export const itemClickHandle = (ev, ctxMenuDesc: any)=>{
    const id = Q(`[data-id]`, ev?.target, 0, "parent")?.getAttribute?.("data-id");
    const item = ctxMenuDesc?.items?.find?.((I: any)=>I?.id == id);
    item?.action?.(ctxMenuDesc?.openedWith?.initiator, item, ev);
    ctxMenuDesc?.openedWith?.close?.();
}

//
const visibleMap = new WeakMap();

// TODO: visible bindings
const getBoundVisibleRef = (menuElement: HTMLElement): any => { // @ts-ignore
    return visibleMap?.getOrInsertComputed?.(menuElement, ()=>visibleRef(menuElement, false));
}

//
export const bindMenuItemClickHandler = (menuElement: HTMLElement, menuDesc: any)=>{
    //const handler = (ev)=>{ itemClickHandle(ev, menuDesc); };
    //menuElement?.addEventListener?.("click", handler);
    //return ()=>menuElement?.removeEventListener?.("click", handler);
}

//
export const makeMenuHandler = (triggerElement: HTMLElement, placement: any, ctxMenuDesc: any, menuElement: HTMLElement = Q("ui-modal[type=\"contextmenu\"]", document.body))=>{
    return (ev)=>{
        const initiator  = ev?.target ?? triggerElement ?? document.elementFromPoint(ev?.clientX || 0, ev?.clientY || 0);
        const visibleRef = getBoundVisibleRef(menuElement);

        //
        if (initiator && visibleRef) {
            ev?.preventDefault?.();
            menuElement.innerHTML = ''; if (visibleRef != null) visibleRef.value = true;
            menuElement?.append?.(...(ctxMenuDesc?.items?.map?.(item=>H`<li data-id=${item?.id||""}><ui-icon icon=${item?.icon||""}></ui-icon><span>${item?.label||""}</span></li>`)?.filter?.((E)=>!!E)||[]));
            const where     = withInsetWithPointer?.(menuElement, placement?.(ev, initiator));
            const unbind    = bindMenuItemClickHandler(menuElement, ctxMenuDesc);
            if (ctxMenuDesc) ctxMenuDesc.openedWith = {
                initiator,
                element: menuElement,
                close() {
                    if (visibleRef != null) visibleRef.value = false;
                    console.log(visibleRef.value);
                    ctxMenuDesc.openedWith = null;
                    unbind?.(); where?.();
                }
            };
        }
    };
}

//
export const ctxMenuTrigger = (triggerElement: HTMLElement, ctxMenuDesc: any, menuElement: HTMLElement = Q("ui-modal[type=\"contextmenu\"]", document.body))=>{
    const evHandler = makeMenuHandler(triggerElement, (ev)=>[ev?.clientX, ev?.clientY], ctxMenuDesc, menuElement);
    const untrigger = makeInterruptTrigger?.(menuElement, (ev)=>{
        ctxMenuDesc?.openedWith?.close?.()
    }, [ "click", /*"pointerdown","contextmenu",*/ "scroll"]);

    //
    triggerElement?.addEventListener?.("contextmenu", evHandler);
    return ()=>{ untrigger?.(); triggerElement?.removeEventListener?.("contextmenu", evHandler); };
}
