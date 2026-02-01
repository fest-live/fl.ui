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
let hasContextMenu = null;
const makeContextMenu = () => {
    if (hasContextMenu) return hasContextMenu;
    const ctxMenu = H`<ul class="grid-rows round-decor ctx-menu ux-anchor" style="position: fixed; z-index: 99999;" data-hidden></ul>`;
    hasContextMenu = ctxMenu;
    // Append to .basic-app element instead of document.body to inherit theme variables
    const basicApp = document.querySelector('.basic-app') as HTMLElement;
    (basicApp || document.body).append(ctxMenu);
    return ctxMenu;
}

//
const _LOG_ = (ev: any) => {
    console.log(ev);
    return ev;
}

//
export const createItemCtxMenu = async (fileManager: any, onMenuAction: (item: FileEntryItem | null | undefined, actionId: string, ev: MouseEvent) => Promise<void>, entries: {value: FileEntryItem[]}) => {
    const ctxMenuDesc = {
        openedWith: null,
        items: [
            makeFileActionOps(),
            makeFileSystemOps(),
        ],
        defaultAction: (initiator: HTMLElement, menuItem: any, ev: MouseEvent) => {
            const rowFromCompose = Array.from(ev?.composedPath?.() || []).find((element: any) => element?.classList?.contains?.(".row")) || MOCElement(initiator, ".row");
            requestAnimationFrame(() => onMenuAction?.(((entries?.value ?? entries) as FileEntryItem[])?.find?.(item => (item?.name === (rowFromCompose as any)?.getAttribute?.("data-id"))), menuItem?.id, ev));
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
