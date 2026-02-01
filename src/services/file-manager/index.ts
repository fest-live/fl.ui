/**
 * File Manager - Unified Exports
 *
 * Main entry point for file manager components.
 * Exports all unified components, types, and utilities.
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { FileManager, default } from "./FileManager";
export { FileManagerContent } from "./FileManagerContent";
export { FileOperative } from "./Operative";

// ============================================================================
// CONTEXT MENU
// ============================================================================

export {
    createItemCtxMenu,
    createBasicCtxMenu,
    DEFAULT_FILE_ACTIONS,
    EXTENDED_FILE_ACTIONS,
    DEFAULT_SYSTEM_OPS
} from "./ContextMenu";

export type {
    MenuActionHandler,
    CreateContextMenuOptions
} from "./ContextMenu";

// ============================================================================
// TYPES
// ============================================================================

export type {
    // File entry types
    EntryKind,
    FileEntry,
    FileItem,
    FileEntryItem,

    // State types
    ExplorerState,
    ClipboardState,
    ViewMode,

    // Event types
    ExplorerEventDetail,
    SelectionEventDetail,
    ContextMenuEventDetail,
    ExplorerEventType,

    // Configuration
    ExplorerConfig,
    MenuAction,
    MenuItemConfig,
    ContextMenuConfig
} from "./types";

// ============================================================================
// UTILITIES
// ============================================================================

export {
    // Icon utilities
    iconByMime,
    getFileIcon,
    iconFor,

    // Formatting
    formatSize,
    formatDate,
    getSize,           // deprecated alias
    getFormattedDate,  // deprecated alias

    // Path utilities
    getParentPath,
    normalizePath,
    joinPath,
    getExtension,

    // Sorting
    getAlphaOrder,
    getAlphaOrderFine
} from "./utils";

// ============================================================================
// EXTENSION MANAGERS
// ============================================================================

export { SelectionManager, createSelectionManager } from "./extension/SelectionManager";
export type { SelectionOptions } from "./extension/SelectionManager";

export { HistoryManager, createHistoryManager } from "./extension/HistoryManager";
export type { HistoryEntry, HistoryOptions } from "./extension/HistoryManager";

// ============================================================================
// CUSTOM ELEMENT REGISTRATION
// ============================================================================

import { FileManager } from "./FileManager";
import { FileManagerContent } from "./FileManagerContent";

if (typeof customElements !== "undefined") {
    if (!customElements.get("ui-file-manager")) {
        customElements.define("ui-file-manager", FileManager as any);
    }
    if (!customElements.get("ui-file-manager-content")) {
        customElements.define("ui-file-manager-content", FileManagerContent as any);
    }
}
