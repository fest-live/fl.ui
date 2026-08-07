/*
 * Filename: FileManagerContent.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/FileManagerContent.ts
 * Change date and time: 01.15.00_29.07.2026
 * Reason for changes: Bind drop inside shadowRoot (DragEvent is not composed) and keep list rows in sync.
 */

import { property, defineElement, H, bindWith, initGlobalClipboard } from "@fest-lib/lure";
import { addEvent, handleStyleChange, preloadStyle } from "@fest-lib/dom";
import { ref } from "@fest-lib/object";

//
import { UIElement } from "fl-ui/base/UIElement";

// @ts-ignore
import fmCss from "./FileManagerContent.scss?inline";
import { type FileEntryItem, FileOperative } from "./Operative";

//
import { createItemCtxMenu } from "./ContextMenu";

//
import { entryKey, entryKind, iconFor, formatDate, formatSize } from "./utils";

//
initGlobalClipboard();

//
const styled = preloadStyle(fmCss);

// @ts-ignore
@defineElement("ui-file-manager-content")
export class FileManagerContent extends UIElement {
    @property({ source: "query-shadow", name: ".fm-grid-rows" }) gridRowsEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".fm-grid" }) gridEl?: HTMLElement;

    //
    public operativeInstance: FileOperative | null = null;
    public operativeInstanceRef = ref<FileOperative | null>(null);
    #rowsContainer: HTMLElement | null = null;
    #dropHandlersBound = false;

    //
    get entries() { return this.operativeInstance?.entries ?? []; }
    get path() { return this.operativeInstance?.path || "/"; }
    set path(value: string) { if (this.operativeInstance) this.operativeInstance.path = value || "/"; }
    get pathRef() { return this.operativeInstance?.pathRef; }

    //
    refreshList(): Promise<void> {
        // INVARIANT: the header belongs to `.fm-grid` and must survive a list refresh.
        this.findRowsContainer()?.replaceChildren();
        const operative = this.operativeInstance;
        if (!operative) {
            this.syncRows();
            return Promise.resolve();
        }
        return Promise.resolve(operative.refreshList(this.path || "/"))
            .then(() => this.syncRows())
            .catch((error) => {
                console.warn(error);
            });
    }

    //
    onInitialize(): this {
        const result = super.onInitialize();
        return (result ?? this) as this;
    }

    //
    private eventBelongsToExplorer(ev: Event | null): boolean {
        if (!ev) return false;
        const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
        if (path.includes(this)) return true;
        // Non-composed drag events stop at the shadow boundary; still treat
        // anything inside this component's shadow tree as in-scope.
        if (this.shadowRoot && path.includes(this.shadowRoot)) return true;

        const target = ev.target as Node | null;
        if (target === this || (target && this.contains(target))) return true;
        if (target && this.shadowRoot?.contains(target)) return true;

        // Clipboard events may target the window while the empty explorer
        // surface owns focus. Walk out of nested shadow roots before deciding.
        let active: any = document.activeElement;
        while (active) {
            if (active === this || this.contains(active)) return true;
            const host = active.getRootNode?.({ composed: true })?.host;
            if (!host || host === active) break;
            active = host;
        }
        return false;
    }

    protected bindDropHandlers() {
        if (this.#dropHandlersBound) return;
        // WHY: Real browser DragEvents are not `composed`, so a host-only listener
        // never sees drops that land on `.fm-grid-rows` inside the shadow tree.
        // Listen on shadowRoot (and the host) so empty-space and row drops both work.
        const shadow = this.shadowRoot;
        if (!shadow) return;
        this.#dropHandlersBound = true;
        if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

        addEvent(this, "pointerdown", (ev: PointerEvent) => {
            const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
            const pressedButton = path.some((node) => node instanceof HTMLButtonElement);
            if (pressedButton) return;
            this.focus({ preventScroll: true });
        });

        const acceptDrag = (ev: DragEvent) => {
            if (!this.eventBelongsToExplorer(ev)) return;
            ev.preventDefault();
            if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
        };

        const onDrop = (ev: DragEvent) => {
            if (!this.eventBelongsToExplorer(ev)) return;
            ev.preventDefault();
            ev.stopPropagation();
            void this.operativeInstance?.onDrop?.(ev);
        };

        // Capture on shadowRoot so dragover/drop fire for the real (non-composed) event path.
        const dragOpts = { capture: true, passive: false };
        for (const target of [shadow, this] as EventTarget[]) {
            addEvent(target, "dragenter", acceptDrag, dragOpts);
            addEvent(target, "dragover", acceptDrag, dragOpts);
            addEvent(target, "drop", onDrop, dragOpts);
        }

        // Paste is composed, but binding the surface keeps Ctrl+V reliable after a blank-area click.
        addEvent(this, "paste", (ev: ClipboardEvent) => this.onPaste(ev));
        addEvent(shadow, "paste", (ev: ClipboardEvent) => this.onPaste(ev));
    }

    //
    public onPaste(ev: ClipboardEvent) {
        if (this.eventBelongsToExplorer(ev) && this.operativeInstance) this.operativeInstance.onPaste(ev);
    }

    //
    public onCopy(ev: ClipboardEvent) {
        if (this.eventBelongsToExplorer(ev) && this.operativeInstance) this.operativeInstance.onCopy(ev);
    }

    //
    byFirstTwoLetterOrName(name: string): number {
        const firstTwoLetters = name?.substring?.(0, 2)?.toUpperCase?.();
        const index = (firstTwoLetters?.charCodeAt?.(0) || 65) - 65;
        return index;
    }

    //
    constructor() {
        super();
        this.operativeInstance ??= new FileOperative();
        this.operativeInstance.host = this as any;
        this.addEventListener("entries-updated", () => this.syncRows());
        this.refreshList();
    }

    private findRowsContainer(): HTMLElement | null {
        if (this.#rowsContainer?.isConnected) return this.#rowsContainer;
        const grids = Array.from(this.shadowRoot?.querySelectorAll?.(".fm-grid") || []) as HTMLElement[];
        const latest = grids.at(-1)?.querySelector<HTMLElement>(".fm-grid-rows") ?? null;
        this.#rowsContainer = latest;
        return latest;
    }

    private syncRows() {
        const rows = this.findRowsContainer();
        const operative = this.operativeInstance;
        if (!rows || !operative) return;
        const rawEntries: any = operative.entries as any;
        const currentEntries =
            Array.isArray(rawEntries) ? rawEntries :
            (Array.isArray(rawEntries?.value) ? rawEntries.value : []);
        const uniqueEntries = new Map<string, FileEntryItem>();
        for (const item of Array.isArray(currentEntries) ? currentEntries : []) {
            if (!item || typeof item !== "object" || item.name == null) continue;
            const key = entryKey(item as FileEntryItem);
            if (!uniqueEntries.has(key)) uniqueEntries.set(key, item as FileEntryItem);
        }

        // WHY: Filesystem enumeration order is not stable across OPFS/FSA backends.
        // Sorting once here keeps visual order and row identity deterministic.
        const safeEntries = Array.from(uniqueEntries.values()).sort((left, right) => {
            const kindOrder = Number(entryKind(left) === "file") - Number(entryKind(right) === "file");
            return kindOrder
                || left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" })
                || left.name.localeCompare(right.name);
        });

        rows.replaceChildren();
        const fragment = document.createDocumentFragment();
        safeEntries.forEach((item, index) => {
            fragment.append(this.makeListElement(item, operative, index + 1));
        });
        rows.append(fragment);
    }

    private makeListElement(item: FileEntryItem, operative: FileOperative, order: number) {
        const op: any = operative as any;
        const kind = entryKind(item);
        const isFile = kind === "file";
        const itemEl = H`<div draggable="${isFile}" class="row c2-surface"
            on:click=${(ev: MouseEvent) => requestAnimationFrame(() => op.onRowClick?.(item, ev))}
            on:dblclick=${(ev: MouseEvent) => requestAnimationFrame(() => op.onRowDblClick?.(item, ev))}
            on:dragstart=${(ev: DragEvent) => op.onRowDragStart?.(item, ev)}
            data-id=${item?.name || ""}
            data-kind=${kind}
            data-entry-key=${entryKey(item)}
        >
            <div style="pointer-events: none; background-color: transparent;" class="c icon"><ui-icon icon=${iconFor(item)} /></div>
            <div style="pointer-events: none; background-color: transparent;" class="c name" title=${item?.name || ""}>${item?.name || ""}</div>
            <div style="pointer-events: none; background-color: transparent;" class="c size">${isFile ? formatSize(item?.size) : ""}</div>
            <div style="pointer-events: none; background-color: transparent;" class="c date">${isFile ? formatDate(item?.lastModified ?? 0) : ""}</div>
            <div style="pointer-events: none; background-color: transparent;" class="c actions">
                <button class="action-btn" title="Copy Path" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); requestAnimationFrame(() => op.onMenuAction?.(item, "copyPath", ev)); }}>
                    <ui-icon icon="copy" />
                </button>
                <button class="action-btn" title="Copy" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); requestAnimationFrame(() => op.onMenuAction?.(item, "copy", ev)); }}>
                    <ui-icon icon="clipboard" />
                </button>
                <button class="action-btn" title="Delete" on:click=${(ev: MouseEvent) => { ev.stopPropagation(); requestAnimationFrame(() => op.onMenuAction?.(item, "delete", ev)); }}>
                    <ui-icon icon="trash" />
                </button>
            </div>
        </div>`;
        bindWith(itemEl, "--order", order, handleStyleChange);
        return itemEl;
    }

    //
    styles = () => styled;
    render = function () {
        const self: any = this;
        const fileHeader = H`<div class="fm-grid-header">
            <div class="c icon">@</div>
            <div class="c name">Name</div>
            <div class="c size">Size</div>
            <div class="c date">Modified</div>
            <div class="c actions">Actions</div>
        </div>`

        //
        const operative = self.operativeInstance;
        if (!operative) return "";

        //
        const fileRows = H`<div class="fm-grid-rows" style="will-change: contents;"></div>`;
        this.#rowsContainer = fileRows as HTMLElement;
        createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), self.entries);
        queueMicrotask(() => {
            self.bindDropHandlers();
            const root = self.shadowRoot;
            const grids = Array.from(root?.querySelectorAll?.(".fm-grid") || []) as HTMLElement[];
            if (grids.length > 1) {
                const latest = grids.at(-1) as HTMLElement;
                for (const extra of grids) {
                    if (extra !== latest) {
                        extra.remove();
                    }
                }
                self.#rowsContainer = latest.querySelector(".fm-grid-rows") as HTMLElement | null;
            }
            self.syncRows();
        });

        //
        const rendered = H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;

        //
        return rendered;
    }
}

//
export default FileManagerContent;
