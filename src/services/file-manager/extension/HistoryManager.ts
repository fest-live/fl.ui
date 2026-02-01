/**
 * History Navigation Manager
 *
 * Manages browser-like history navigation for file explorers.
 * Supports back/forward navigation with path tracking.
 */

import { ref } from "fest/object";

// ============================================================================
// TYPES
// ============================================================================

export interface HistoryEntry {
    path: string;
    timestamp: number;
}

export interface HistoryOptions {
    /** Maximum history entries to keep */
    maxEntries?: number;
    /** Callback when navigation happens */
    onNavigate?: (path: string, direction: "back" | "forward" | "push") => void;
}

// ============================================================================
// HISTORY MANAGER
// ============================================================================

export class HistoryManager {
    /** History stack */
    private history: HistoryEntry[] = [];

    /** Current position in history */
    private position = -1;

    /** Configuration */
    private options: Required<HistoryOptions>;

    /** Reactive refs for UI binding */
    readonly canGoBack = ref(false);
    readonly canGoForward = ref(false);
    readonly currentPath = ref<string>("");

    constructor(options: HistoryOptions = {}) {
        this.options = {
            maxEntries: 50,
            onNavigate: () => {},
            ...options
        };
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    /**
     * Push new path to history (navigating to new location)
     */
    push(path: string): void {
        // Don't push duplicate consecutive paths
        if (this.history[this.position]?.path === path) return;

        // Truncate forward history when pushing new path
        if (this.position < this.history.length - 1) {
            this.history = this.history.slice(0, this.position + 1);
        }

        // Add new entry
        this.history.push({
            path,
            timestamp: Date.now()
        });

        // Enforce max entries
        if (this.history.length > this.options.maxEntries) {
            this.history.shift();
        } else {
            this.position++;
        }

        this.updateState();
        this.options.onNavigate(path, "push");
    }

    /**
     * Go back in history
     */
    back(): string | null {
        if (!this.canGoBack.value) return null;

        this.position--;
        const entry = this.history[this.position];
        this.updateState();
        this.options.onNavigate(entry.path, "back");
        return entry.path;
    }

    /**
     * Go forward in history
     */
    forward(): string | null {
        if (!this.canGoForward.value) return null;

        this.position++;
        const entry = this.history[this.position];
        this.updateState();
        this.options.onNavigate(entry.path, "forward");
        return entry.path;
    }

    /**
     * Replace current entry without adding to history
     */
    replace(path: string): void {
        if (this.position >= 0) {
            this.history[this.position] = {
                path,
                timestamp: Date.now()
            };
        } else {
            this.push(path);
        }
        this.updateState();
    }

    // ========================================================================
    // STATE
    // ========================================================================

    /**
     * Get current path
     */
    get current(): string | null {
        return this.history[this.position]?.path ?? null;
    }

    /**
     * Get history length
     */
    get length(): number {
        return this.history.length;
    }

    /**
     * Get all history entries
     */
    getEntries(): HistoryEntry[] {
        return [...this.history];
    }

    /**
     * Clear history and optionally set initial path
     */
    clear(initialPath?: string): void {
        this.history = [];
        this.position = -1;

        if (initialPath) {
            this.push(initialPath);
        } else {
            this.updateState();
        }
    }

    // ========================================================================
    // INTERNAL
    // ========================================================================

    private updateState(): void {
        this.canGoBack.value = this.position > 0;
        this.canGoForward.value = this.position < this.history.length - 1;
        this.currentPath.value = this.history[this.position]?.path ?? "";
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createHistoryManager(options?: HistoryOptions): HistoryManager {
    return new HistoryManager(options);
}
