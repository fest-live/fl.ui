/**
 * Context Menu for File Manager
 *
 * Unified context menu with configurable menu items.
 * Supports both basic and extended menu configurations.
 */

import { MOCElement } from "fest/dom";
import { ctxMenuTrigger, H } from "fest/lure";
import type { FileEntry, MenuItemConfig, ContextMenuConfig } from "./types";

// ============================================================================
// FINALIZATION REGISTRY
// ============================================================================

const disconnectRegistry = new FinalizationRegistry((ctxMenu: HTMLElement) => {
    // Clean up redundant context menu from DOM when element is garbage collected
    // Note: Currently disabled to allow menu reuse
    // ctxMenu?.remove?.();
});

// ============================================================================
// DEFAULT MENU CONFIGURATIONS
// ============================================================================

/**
 * Default file action operations
 */
export const DEFAULT_FILE_ACTIONS: MenuItemConfig[] = [
    { id: "open", label: "Open", icon: "function" },
    { id: "download", label: "Download", icon: "download" }
];

/**
 * Extended file actions (includes view and attach)
 */
export const EXTENDED_FILE_ACTIONS: MenuItemConfig[] = [
    { id: "open", label: "Open", icon: "function" },
    { id: "view", label: "View", icon: "eye" },
    { id: "attach-workcenter", label: "Attach to Work Center", icon: "lightning" },
    { id: "download", label: "Download", icon: "download" }
];

/**
 * Default file system operations
 */
export const DEFAULT_SYSTEM_OPS: MenuItemConfig[] = [
    { id: "delete", label: "Delete", icon: "trash" },
    { id: "rename", label: "Rename", icon: "pencil" },
    { id: "copyPath", label: "Copy Path", icon: "copy" },
    { id: "movePath", label: "Move Path", icon: "hand-withdraw" }
];

// ============================================================================
// CONTEXT MENU SINGLETON
// ============================================================================

let sharedContextMenu: HTMLElement | null = null;

/**
 * Get or create shared context menu element
 */
const getOrCreateContextMenu = (): HTMLElement => {
    if (sharedContextMenu) return sharedContextMenu;

    const ctxMenu = H`<ul class="grid-rows round-decor ctx-menu ux-anchor" style="position: fixed; z-index: 99999;" data-hidden></ul>` as HTMLElement;
    sharedContextMenu = ctxMenu;

    // Append to .basic-app element instead of document.body to inherit theme variables
    const basicApp = document.querySelector(".basic-app") as HTMLElement;
    (basicApp || document.body).append(ctxMenu);

    return ctxMenu;
};

// ============================================================================
// PUBLIC API
// ============================================================================

export type MenuActionHandler = (
    item: FileEntry | null | undefined,
    actionId: string,
    ev: MouseEvent
) => void | Promise<void>;

export interface CreateContextMenuOptions {
    /** Menu configuration (defaults to extended if not provided) */
    config?: ContextMenuConfig;
    /** Use extended file actions (view, attach-workcenter) */
    extended?: boolean;
    /** Custom context menu element (uses shared singleton if not provided) */
    menuElement?: HTMLElement;
}

/**
 * Create and bind context menu to file manager element
 *
 * @param initiatorElement - Element that triggers the context menu
 * @param onMenuAction - Handler for menu actions
 * @param entriesRef - Reactive reference to file entries
 * @param options - Configuration options
 */
export const createItemCtxMenu = async (
    initiatorElement: HTMLElement,
    onMenuAction: MenuActionHandler,
    entriesRef: { value: FileEntry[] } | FileEntry[],
    options: CreateContextMenuOptions = {}
): Promise<HTMLElement> => {
    const { config, extended = true, menuElement } = options;

    // Build menu items
    const fileActions = config?.fileActions
        ?? (extended ? EXTENDED_FILE_ACTIONS : DEFAULT_FILE_ACTIONS);
    const systemOps = config?.systemOps ?? DEFAULT_SYSTEM_OPS;
    const customGroups = config?.customGroups ?? [];

    const menuItems = [
        fileActions,
        systemOps,
        ...customGroups
    ];

    // Create context menu descriptor
    const ctxMenuDesc = {
        openedWith: null as any,
        items: menuItems,
        defaultAction: (initiator: HTMLElement, menuItem: any, ev: MouseEvent) => {
            // Find the row element from event path
            const rowFromCompose = Array.from(ev?.composedPath?.() || [])
                .find((element: any) => element?.classList?.contains?.("row"))
                || MOCElement(initiator, ".row");

            // Get entries array
            const entries = Array.isArray(entriesRef)
                ? entriesRef
                : (entriesRef?.value ?? []);

            // Find the item by data-id
            const dataId = (rowFromCompose as HTMLElement)?.getAttribute?.("data-id");
            const item = entries.find(entry => entry?.name === dataId);

            // Execute action handler
            requestAnimationFrame(() => onMenuAction?.(item, menuItem?.id, ev));
        }
    };

    // Get or create context menu element
    const ctxMenu = menuElement ?? getOrCreateContextMenu();

    // Bind context menu trigger
    ctxMenuTrigger(initiatorElement, ctxMenuDesc, ctxMenu);

    // Register for cleanup
    disconnectRegistry.register(initiatorElement, ctxMenu);

    return ctxMenu;
};

/**
 * Create context menu with basic configuration (no view/attach actions)
 */
export const createBasicCtxMenu = (
    initiatorElement: HTMLElement,
    onMenuAction: MenuActionHandler,
    entriesRef: { value: FileEntry[] } | FileEntry[]
): Promise<HTMLElement> => {
    return createItemCtxMenu(initiatorElement, onMenuAction, entriesRef, {
        extended: false
    });
};

// ============================================================================
// EXPORTS
// ============================================================================

export default createItemCtxMenu;
