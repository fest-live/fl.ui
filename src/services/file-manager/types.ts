/**
 * Unified Types for File Manager Components
 *
 * Consolidated types from RsExplorer and FileManagerContent.
 * Supports both OPFS and File System Access API.
 */

// ============================================================================
// FILE ENTRY TYPES
// ============================================================================

export type EntryKind = "file" | "directory";

/**
 * Unified file entry item - works with both OPFS and File System Access API
 */
export interface FileEntry {
    /** File or directory name */
    name: string;
    /** Full path */
    path: string;
    /** Entry type */
    kind: EntryKind;
    /** MIME type (for files) */
    type?: string;
    /** File size in bytes */
    size?: number;
    /** Last modified timestamp */
    lastModified?: number;
    /** File System Handle (OPFS or File System Access API) */
    handle?: FileSystemHandle | FileSystemDirectoryHandle | FileSystemFileHandle;
    /** File object (if loaded) */
    file?: File;
}

// Legacy aliases for backward compatibility
export type FileItem = FileEntry;
export type FileEntryItem = FileEntry;

// ============================================================================
// EXPLORER STATE
// ============================================================================

/**
 * Explorer component state
 */
export interface ExplorerState {
    /** Current directory entries */
    items: FileEntry[];
    /** Selected item paths */
    selected: Set<string>;
    /** Loading state */
    loading: boolean;
    /** Error message */
    error: string | null;
}

/**
 * Clipboard state for file operations
 */
export interface ClipboardState {
    /** Paths of copied/cut items */
    items: string[];
    /** Whether items should be moved (cut) or copied */
    cut?: boolean;
}

// ============================================================================
// VIEW MODES
// ============================================================================

export type ViewMode = "list" | "grid" | "compact";

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Standard explorer event detail
 */
export interface ExplorerEventDetail {
    /** File path */
    path: string;
    /** File entry item */
    item?: FileEntry;
    /** Original DOM event */
    originalEvent?: Event;
}

/**
 * Selection change event detail
 */
export interface SelectionEventDetail {
    /** Selected items */
    selected: FileEntry[];
    /** Paths of selected items */
    paths: string[];
}

/**
 * Context menu event detail
 */
export interface ContextMenuEventDetail {
    /** Mouse X position */
    x: number;
    /** Mouse Y position */
    y: number;
    /** Item at cursor (if any) */
    item?: FileEntry;
    /** Selected items */
    selected?: FileEntry[];
}

// ============================================================================
// EVENT TYPES (for type-safe dispatch/listen)
// ============================================================================

export type ExplorerEventType =
    | "navigate"      // Navigation to a directory
    | "open"          // File opened
    | "select"        // Selection changed
    | "context-menu"  // Right-click
    | "open-item"     // Item action (before open)
    | "context-action"; // Context menu action

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Explorer configuration options
 */
export interface ExplorerConfig {
    /** Initial path */
    path?: string;
    /** Show hidden files */
    showHidden?: boolean;
    /** View mode */
    viewMode?: ViewMode;
    /** Enable multi-select */
    multiSelect?: boolean;
    /** Enable keyboard navigation */
    keyboardNav?: boolean;
    /** Enable history navigation */
    historyNav?: boolean;
    /** Enable drag and drop */
    dragDrop?: boolean;
    /** Storage backend: 'opfs' | 'fsa' (File System Access) | 'auto' */
    backend?: "opfs" | "fsa" | "auto";
}

// ============================================================================
// MENU ACTIONS
// ============================================================================

export type MenuAction =
    | "open"
    | "view"
    | "download"
    | "delete"
    | "rename"
    | "copy"
    | "copyPath"
    | "cut"
    | "paste"
    | "attach-workcenter"
    | "new-folder"
    | "new-file";
