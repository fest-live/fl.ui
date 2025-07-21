import { handleStyleChange } from "fest/dom";
import { H, Q, bindWith } from "fest/lure";
import { makeInterruptTrigger } from "./Anchor";

//
export const initiatorMap = new WeakMap<any, any>();
export const ctxMenuRegistry = new Map<string, { items: any[], openedWith: any }>();

// for context menu items
export const itemClickHandle = (ev, menu: HTMLElement, attribute = "data-ctx-menu")=>{
    const target = Q(`li[data-id]`, ev?.target, 0, "parent");
    if (target) {
        const id = target?.getAttribute?.("data-id");
        if (id) {
            const initiator = initiatorMap?.get?.(menu);
            const menuDesc = ctxMenuRegistry.get(initiator?.getAttribute?.(attribute || ""));
            const item = menuDesc?.items?.find?.((item: any)=>item?.id ==  id);
            item?.action?.(initiator, item, ev);
            menuDesc?.openedWith?.close?.();
        }
    }
}

//
export const withInsetWithPointer = (exists: HTMLElement, pRef)=>{
    const ubs = [
        bindWith(exists, "--client-x", pRef?.[0], handleStyleChange),
        bindWith(exists, "--client-y", pRef?.[1], handleStyleChange)
    ];
    return ()=>ubs?.forEach?.(ub=>ub?.());
}

//
export const bindMenuItemClickHandler = (menuElement: HTMLElement, attribute = "data-ctx-menu")=>{
    const handler = (ev)=>{ itemClickHandle(ev, menuElement, attribute); };
    menuElement?.addEventListener?.("click", handler);
    return ()=>menuElement?.removeEventListener?.("click", handler);
}

//
export const ctxMenuTrigger = (triggerElement: HTMLElement, visibleRef, menuElement: HTMLElement = Q("ui-modal[type=\"contextmenu\"]", document.body), attribute = "data-ctx-menu")=>{
    const evHandler = (ev)=>{
        const initiator = Q("["+attribute+"]", ev?.target ?? document.elementFromPoint(ev?.clientX, ev?.clientY), 0, "parent");
        if (initiator) { visibleRef.value = true; initiatorMap.set(menuElement, initiator); }
        const menu = ctxMenuRegistry.get(initiator?.getAttribute?.(attribute || "")); menuElement.innerHTML = '';
        menuElement?.append?.(...(menu?.items?.map(item=>H`<li data-id=${item?.id||""}><ui-icon icon=${item?.icon||""}></ui-icon><span>${item?.label||""}</span></li>`)||[]));

        // TODO: somehow resolve CTX menu position reference (more static version)
        const where = withInsetWithPointer(menuElement, [ev?.clientX, ev?.clientY]);
        if (menu) menu.openedWith = {
            initiator,
            element: menuElement,
            close() {
                where?.();
                initiatorMap?.delete?.(menu);
                visibleRef.value = false;
                menu.openedWith = null;
            }
        };
    };

    //
    triggerElement?.addEventListener?.("contextmenu", evHandler);
    makeInterruptTrigger?.(visibleRef, menuElement, ["pointerdown", "click", "contextmenu", "scroll"]);

    //
    const unbind = bindMenuItemClickHandler(menuElement, attribute);
    return ()=>{ triggerElement?.removeEventListener?.("contextmenu", evHandler); unbind?.(); };
}
