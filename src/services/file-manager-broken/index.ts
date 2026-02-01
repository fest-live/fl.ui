/**
 * Unified File Manager
 *
 * Merged from fl-explorer and rs-explorer into a single, unified implementation.
 *
 * Features:
 * - Unified FileOperative supporting both OPFS and File System Access API
 * - Shared SelectionManager with keyboard navigation and multi-select
 * - HistoryManager for browser-like back/forward navigation
 * - Common utilities for icons, formatting, and paths
 *
 * Components:
 *   <ui-file-manager></ui-file-manager>
 *   <ui-file-manager-content></ui-file-manager-content>
 *   <rs-explorer></rs-explorer>
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { FileManager, FileManagerContent } from "./ts/FileManager";
export { RsExplorerElement } from "./ts/RsExplorer";

// ============================================================================
// CORE
// ============================================================================

export {
    FileOperative,
    createFileOperative
} from "./ts/Operative";

export {
    SelectionManager,
    createSelectionManager
} from "./ts/SelectionManager";

export {
    HistoryManager,
    createHistoryManager
} from "./ts/HistoryManager";

export { createItemCtxMenu } from "./ts/ContextMenu";

// ============================================================================
// TYPES
// ============================================================================

export type {
    // File entry types
    FileEntry,
    FileItem,
    FileEntryItem,
    EntryKind,

    // State types
    ExplorerState,
    ClipboardState,

    // View types
    ViewMode,

    // Event types
    ExplorerEventDetail,
    SelectionEventDetail,
    ContextMenuEventDetail,
    ExplorerEventType,

    // Configuration
    ExplorerConfig,
    MenuAction
} from "./types";

export type {
    SelectionOptions
} from "./ts/SelectionManager";

export type {
    HistoryEntry,
    HistoryOptions
} from "./ts/HistoryManager";

// ============================================================================
// UTILITIES
// ============================================================================

export {
    iconByMime,
    getFileIcon,
    iconFor,
    formatSize,
    formatDate,
    getParentPath,
    normalizePath
} from "./utils";
