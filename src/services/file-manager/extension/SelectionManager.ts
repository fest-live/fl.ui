/**
 * Selection Manager
 *
 * Unified selection logic for file explorer components.
 * Supports single/multi-select, range selection, and keyboard navigation.
 */

import { ref, affected, observe } from "fest/object";

// ============================================================================
// TYPES
// ============================================================================

export interface SelectionOptions {
    /** Allow multiple selections */
    multiSelect?: boolean;
    /** Callback when selection changes */
    onChange?: (detail: any) => void;
}

// ============================================================================
// SELECTION MANAGER
// ============================================================================

export class SelectionManager {
    /** Set of selected paths (reactive) */
    readonly selected: Set<string> & { [Symbol.iterator](): IterableIterator<string> };

    /** Trigger for notifying changes */
    private readonly _trigger = ref(0);

    /** Reference to items list */
    private itemsRef: { value: any[] } | null = null;

    /** Last selected path (for range selection) */
    private lastSelected: string | null = null;

    /** Configuration */
    private options: SelectionOptions;

    constructor(options: SelectionOptions = {}) {
        this.options = {
            multiSelect: false,
            ...options
        };

        // Create reactive Set
        this.selected = observe(new Set<string>());

        // Subscribe to selection changes
        affected(this.selected, () => this.notifyChange());
    }

    // ========================================================================
    // BINDING
    // ========================================================================

    /**
     * Bind to items list for range selection
     */
    bindItems(itemsRef: { value: any[] }): void {
        this.itemsRef = itemsRef;
    }

    // ========================================================================
    // SELECTION OPERATIONS
    // ========================================================================

    /**
     * Select single item (clears previous selection)
     */
    select(path: string): void {
        this.selected.clear();
        this.selected.add(path);
        this.lastSelected = path;
        this.triggerUpdate();
    }

    /**
     * Toggle selection state
     */
    toggle(path: string): void {
        if (this.selected.has(path)) {
            this.selected.delete(path);
        } else {
            if (!this.options.multiSelect) {
                this.selected.clear();
            }
            this.selected.add(path);
            this.lastSelected = path;
        }
        this.triggerUpdate();
    }

    /**
     * Range selection from last selected to target
     */
    rangeSelect(targetPath: string): void {
        if (!this.itemsRef || !this.lastSelected) {
            this.select(targetPath);
            return;
        }

        const items = this.itemsRef.value;
        const startIdx = items.findIndex(i => i.path === this.lastSelected);
        const endIdx = items.findIndex(i => i.path === targetPath);

        if (startIdx === -1 || endIdx === -1) {
            this.select(targetPath);
            return;
        }

        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

        for (let i = from; i <= to; i++) {
            this.selected.add(items[i].path);
        }
        this.triggerUpdate();
    }

    /**
     * Select all items
     */
    selectAll(): void {
        if (!this.itemsRef) return;
        this.itemsRef.value.forEach(item => {
            this.selected.add(item.path);
        });
        this.triggerUpdate();
    }

    /**
     * Clear all selections
     */
    clear(): void {
        this.selected.clear();
        this.lastSelected = null;
        this.triggerUpdate();
    }

    /**
     * Check if path is selected
     */
    isSelected(path: string): boolean {
        return this.selected.has(path);
    }

    /**
     * Get count of selected items
     */
    get count(): number {
        return this.selected.size;
    }

    /**
     * Get selected paths as array
     */
    get paths(): string[] {
        return Array.from(this.selected);
    }

    // ========================================================================
    // KEYBOARD NAVIGATION
    // ========================================================================

    /**
     * Move selection by delta (-1 = up, +1 = down)
     */
    moveSelection(delta: number): void {
        if (!this.itemsRef) return;

        const items = this.itemsRef.value;
        if (items.length === 0) return;

        // Find current position
        let currentIdx = this.lastSelected
            ? items.findIndex(i => i.path === this.lastSelected)
            : -1;

        if (currentIdx === -1) currentIdx = delta > 0 ? -1 : items.length;

        // Calculate new index
        const newIdx = Math.max(0, Math.min(items.length - 1, currentIdx + delta));

        if (items[newIdx]) {
            this.select(items[newIdx].path);
        }
    }

    /**
     * Get currently focused item
     */
    getFocusedItem(): any | null {
        if (!this.itemsRef || !this.lastSelected) return null;
        return this.itemsRef.value.find(i => i.path === this.lastSelected) || null;
    }

    // ========================================================================
    // HANDLERS
    // ========================================================================

    /**
     * Handle click event with modifiers
     */
    handleClick(path: string, event: MouseEvent): void {
        if (event.ctrlKey || event.metaKey) {
            this.toggle(path);
        } else if (event.shiftKey && this.options.multiSelect) {
            this.rangeSelect(path);
        } else {
            this.select(path);
        }
    }

    /**
     * Handle keyboard event
     */
    handleKeyboard(event: KeyboardEvent): any | null {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                this.moveSelection(1);
                return this.getFocusedItem();

            case "ArrowUp":
                event.preventDefault();
                this.moveSelection(-1);
                return this.getFocusedItem();

            case "Home":
                event.preventDefault();
                if (this.itemsRef?.value.length) {
                    this.select(this.itemsRef.value[0].path);
                }
                return this.getFocusedItem();

            case "End":
                event.preventDefault();
                if (this.itemsRef?.value.length) {
                    this.select(this.itemsRef.value[this.itemsRef.value.length - 1].path);
                }
                return this.getFocusedItem();

            case "a":
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.selectAll();
                }
                return null;

            case "Escape":
                this.clear();
                return null;

            default:
                return null;
        }
    }

    // ========================================================================
    // INTERNAL
    // ========================================================================

    private triggerUpdate(): void {
        // Force reactivity trigger
        this._trigger.value++;
    }

    private notifyChange(): void {
        if (!this.options.onChange || !this.itemsRef) return;

        const selectedItems = this.itemsRef.value.filter(item =>
            this.selected.has(item.path)
        );

        this.options.onChange({
            selected: selectedItems,
            paths: this.paths
        });
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    setMultiSelect(enabled: boolean): void {
        this.options.multiSelect = enabled;
        if (!enabled && this.selected.size > 1) {
            // Keep only the last selected
            const last = this.lastSelected;
            this.selected.clear();
            if (last) this.selected.add(last);
            this.triggerUpdate();
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createSelectionManager(options?: SelectionOptions): SelectionManager {
    return new SelectionManager(options);
}
