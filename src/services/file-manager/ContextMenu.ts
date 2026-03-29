import { MOCElement } from "fest/dom";
import type { FileEntryItem } from "./Operative";
import { ctxMenuTrigger, H } from "fest/lure";

//
const disconnectRegistry = new FinalizationRegistry((ctxMenu: HTMLElement) => {
    // utilize redundant ctx menu from DOM
    //ctxMenu?.remove?.();
});

//
const makeFileActionOps = () => {
    return [
        { id: "open", label: "Open", icon: "function" },
        { id: "view", label: "View", icon: "eye" },
        { id: "attach-workcenter", label: "Attach to Work Center", icon: "lightning" },
        { id: "pin-home", label: "Pin to Home Screen", icon: "push-pin-simple" },
        { id: "download", label: "Download", icon: "download" }
    ];
};

//
const makeFileSystemOps = () => {
    return [
        { id: "delete", label: "Delete", icon: "trash" },
        { id: "rename", label: "Rename", icon: "pencil" },
        { id: "copyPath", label: "Copy Path", icon: "copy" },
        { id: "movePath", label: "Move Path", icon: "hand-withdraw" }
    ];
};

//
const makeContextMenu = () => {
    const ctxMenu = H`<ul class="grid-rows round-decor ctx-menu ux-anchor" style="position: fixed; z-index: 99999;" data-hidden></ul>`;
    const overlay = document.querySelector('[data-app-layer="overlay"]') as HTMLElement | null;
    const basicApp = document.querySelector(".basic-app") as HTMLElement | null;
    (overlay || basicApp || document.body).append(ctxMenu);
    return ctxMenu;
};

//
export const createItemCtxMenu = async (fileManager: any, onMenuAction: (item: FileEntryItem | null | undefined, actionId: string, ev: MouseEvent) => Promise<void>, entries: {value: FileEntryItem[]}) => {
    const ctxMenuDesc = {
        openedWith: null,
        items: [
            makeFileActionOps(),
            makeFileSystemOps(),
        ],
        defaultAction: (initiator: HTMLElement, menuItem: any, ev: MouseEvent) => {
            const rowFromCompose = Array.from(ev?.composedPath?.() || []).find((element: any) => element?.classList?.contains?.("row")) || MOCElement(initiator, ".row");
            onMenuAction?.(((entries?.value ?? entries) as FileEntryItem[])?.find?.(item => (item?.name === (rowFromCompose as any)?.getAttribute?.("data-id"))), menuItem?.id, ev);
        }
    };

    //
    const initiatorElement = fileManager;

    //
    const ctxMenu = makeContextMenu();
    ctxMenuTrigger(initiatorElement as any, ctxMenuDesc, ctxMenu);
    disconnectRegistry.register(initiatorElement, ctxMenu);
    return ctxMenu;
}
