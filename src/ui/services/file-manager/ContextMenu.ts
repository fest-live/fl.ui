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
    const ctxMenu = H`<ul class="grid-rows c2-surface round-decor ctx-menu ux-anchor"></ul>`;
    hasContextMenu = ctxMenu;
    document.body.append(ctxMenu);
    return ctxMenu;
}

//
const _LOG_ = (ev: any) => {
    console.log(ev);
    return ev;
}

//
export const createItemCtxMenu = async (fileManager: any, onMenuAction: (item: FileEntryItem | null | undefined, actionId: string, ev: MouseEvent) => Promise<void>, entries: FileEntryItem[]) => {
    const ctxMenuDesc = {
        openedWith: null,
        items: [
            makeFileActionOps(),
            makeFileSystemOps(),
        ],
        defaultAction: (initiator: HTMLElement, menuItem: any, ev: MouseEvent) => {
            const rowFromCompose = Array.from(ev?.composedPath?.() || []).find((element: any) => element?.classList?.contains?.("row")) ?? initiator;
            onMenuAction?.(entries?.find?.(item => (item?.name === (rowFromCompose as any)?.getAttribute?.("data-id"))), menuItem?.id, ev);
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