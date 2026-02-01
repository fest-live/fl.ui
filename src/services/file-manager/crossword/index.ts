/**
 * CrossWord File Manager - Re-exports
 *
 * This module re-exports from the unified file-manager.
 * Maintained for backward compatibility.
 *
 * @deprecated Import directly from "fest/fl-ui/services/file-manager" instead.
 */

// Re-export everything from unified file-manager
export {
    // Components
    FileManager,
    FileManager as default,
    FileManagerContent,
    FileOperative,

    // Context menu
    createItemCtxMenu,

    // Types
    type EntryKind,
    type FileEntry,
    type FileEntryItem,

    // Utilities
    iconFor,
    iconByMime,
    formatSize,
    formatDate,
    getAlphaOrder
} from "../index";

// Re-export UIElement from base for backward compatibility
export { default as UIElement } from "@fl-ui/base/UIElement";
