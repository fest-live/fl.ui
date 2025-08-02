import { placeWithCursor, placeWithElement } from "../deprecated/ps-anchor.js";
import { addEvent, addEvents, removeEvents } from "fest/dom";

//
const hasClosest  = (el: HTMLElement, exact: HTMLElement) => { do { if (el === exact) { return true; }; el = el?.parentElement as HTMLElement; } while (el?.parentElement && el?.parentElement != exact); return (el === exact); }
const hideOnClick = ($ctxMenu, ev?, evt?: [any, any?], ROOT = document.documentElement)=>{
    const t = ev.target as HTMLElement, ctxMenu = $ctxMenu as HTMLElement, isVisible = ctxMenu.dataset.hidden == null;

    // prevent from immediate close
    requestAnimationFrame(()=>{
        const self = ctxMenu;//document.querySelector(ctx) as HTMLElement;
        const isOutside = !(hasClosest(t, self));
        const exception = false;//t?.closest?.(excSel) || t?.matches?.(excSel);
        if ((isVisible && ctxMenu.dataset.hidden == null) && (isOutside && !exception || (ev?.type == "click" && !document.activeElement?.matches?.("input"))))
            { closeContextMenu($ctxMenu, ev, evt, ROOT); };
    });
};

//
export const closeContextMenu = ($ctxMenu: any, ev?, evt?: [any, any?]|null, ROOT = document.documentElement)=>{
    const ctxMenu = $ctxMenu as HTMLElement;
    if (ctxMenu && ctxMenu.dataset.hidden == null) {
        ctxMenu.dataset.hidden = "";
        if (evt) {
            removeEvents(ROOT, {
                "m-dragstart": evt,
                "pointerdown": evt,
                "contextmenu": evt,
                "scroll"     : evt,
                "click"      : evt,
            });
        }
    };
};

//
export const openContextMenu = ($ctxMenu: any, ev?, evt?: [any, any?]|null, toggle: boolean = false, content?: (ctxMenu: any, initiator: any, event?: any)=>void, ROOT = document.documentElement)=>{
    const initiator = ev?.target, ctxMenu = $ctxMenu;
    if (ev?.type == "contextmenu") { placeWithCursor(ctxMenu, ev); };

    //
    ctxMenu.innerHTML = "";
    ctxMenu.initiator = initiator;
    ctxMenu.event = ev;
    content?.(ctxMenu, initiator, ev);

    //
    if (ctxMenu && (toggle && ctxMenu.dataset.hidden != null || !toggle)) {
        delete ctxMenu.dataset.hidden;

        //
        if (evt) {
            removeEvents(ROOT, {
                "m-dragstart": evt,
                "pointerdown": evt,
                "contextmenu": evt,
                "scroll"     : evt,
                "click"      : evt,
            });
        }

        //
        if (evt) {
            addEvents(ROOT, {
                "m-dragstart": evt,
                "pointerdown": evt,
                "contextmenu": evt,
                "scroll"     : evt,
                "click"      : evt,
            });
        }
    } else
    if (ctxMenu && ctxMenu.dataset.hidden == null) {
        closeContextMenu($ctxMenu, ev, evt, ROOT);
    }

    //
    return ctxMenu;
};

//
export const makeCtxMenuOpenable = ($ctxMenu: any, ROOT = document.documentElement)=>{
    const evt: [any, any] = [ (ev)=>hideOnClick(ev, $ctxMenu), {} ];
    addEvent(ROOT ??= document.documentElement, "contextmenu", (ev)=>openContextMenu?.($ctxMenu, ev, evt, false, ()=>{}, ROOT));
};

//
export const makeCtxMenuItems = (ctxMenu?: any, initiator?: any, content?: any[])=>content?.map?.((el: {
    icon: HTMLElement;
    content: string;
    callback: Function;
})=>{
    const li = document.createElement("ui-button-row"); if (!li.dataset.highlightHover) { li.dataset.highlightHover = "1"; }
    li.style.blockSize = "2.5rem";
    li.addEventListener("click", (e)=>el.callback?.(initiator, ctxMenu?.event ?? e));
    li.insertAdjacentHTML("beforeend", `<span style="grid-column: content;">${el.content||""}</span>`);
    if (el.icon) {
        el.icon.remove?.();
        el.icon.style.setProperty("grid-column", "icon");
        li.append(el.icon);
    }; // TODO? needs it or not?
    //ctxMenu?.append?.(li);
    return li;
})

//
export const openDropMenu = (button: any, ev?: any, $menu?: any)=>{
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    //
    const items = Array.from(button?.querySelectorAll?.("ui-select-row, ui-button-row"));
    const field = button?.querySelector?.("input[type=\"text\"]");
    const cloned = items?.map?.((el: any)=>{
        const clone: any = el?.matches("ui-button-row") ? el?.cloneNode?.(true) : document?.createElement?.("ui-button-row");
        if (el?.matches("ui-select-row"))
            { clone?.append(...Array.from(el?.querySelectorAll?.("*:not(input)")).map((n:any)=>n.cloneNode(true))); }

        //
        clone?.style?.removeProperty("display");
        clone?.addEventListener?.("click", (ev)=>{
            const input: any = el?.matches?.("input") ? el : el?.querySelector?.("input");
            if (input) { input?.click?.(); } else
            if (field) {
                field.value = el?.dataset?.value || el?.value || "";
                field?.dispatchEvent?.(new Event("change", { bubbles: true }));
            }
            closeContextMenu(menu);
        });
        return clone;
    });

    //
    const menu = openContextMenu?.($menu, ev, null, true, (menu, _)=>{ menu.append(...cloned); requestAnimationFrame(()=>placeWithElement?.(menu, button)); });
    return menu;
};
