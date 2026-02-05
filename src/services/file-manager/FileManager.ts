/**
 * File Manager Component
 *
 * Unified file manager with toolbar, navigation, and content area.
 * Supports both basic and extended modes (with UnifiedMessaging).
 */

import { H, defineElement, property, getDir } from "fest/lure";
import { addEvent, preloadStyle } from "fest/dom";
import { propRef } from "fest/object";

// Base element
import UIElement from "@fl-ui/base/UIElement";

// Local modules
import { FileManagerContent } from "./FileManagerContent";

// Styles
// @ts-ignore
import fmCss from "./scss/FileManager.scss?inline";

// ============================================================================
// OPTIONAL UNIFIED MESSAGING
// ============================================================================

// Try to import unified messaging (may not be available in all contexts)
let registerComponent: ((id: string, type: string) => void) | undefined;
let initializeComponent: ((id: string) => any[]) | undefined;

// ============================================================================
// INITIALIZATION
// ============================================================================

const styled = preloadStyle(fmCss);

// ============================================================================
// FILE MANAGER COMPONENT
// ============================================================================

export interface FileManagerOptions {
    /** Enable unified messaging integration */
    enableMessaging?: boolean;
    /** Component ID for messaging */
    componentId?: string;
    /** Component type for messaging */
    componentType?: string;
}

// @ts-ignore
@defineElement("ui-file-manager")
export class FileManager extends UIElement {
    // ========================================================================
    // PROPERTIES
    // ========================================================================

    @property({ source: "query-shadow", name: ".fm-grid-rows" })
    gridRowsEl?: HTMLElement;

    @property({ source: "query-shadow", name: ".fm-grid" })
    gridEl?: HTMLElement;

    /** Explicit sidebar control; if not provided, auto by container size */
    @property({ source: "attr", name: "sidebar" })
    sidebar?: any = "auto";

    /** Container inline size for CQ-based decisions */
    @property({ source: "inline-size" })
    inlineSize?: number;

    /** Enable unified messaging integration */
    @property({ source: "attr", name: "enable-messaging" })
    enableMessaging?: boolean = false;

    // ========================================================================
    // STATE
    // ========================================================================

    styles = () => styled;

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor() {
        super();
    }

    // ========================================================================
    // GETTERS / SETTERS
    // ========================================================================

    get pathRef() {
        return (this.querySelector?.("ui-file-manager-content") as any)?.pathRef;
    }

    get path(): string {
        return (this.querySelector?.("ui-file-manager-content") as any)?.pathRef?.value ?? "/user/";
    }

    set path(value: string) {
        const content = this.querySelector?.("ui-file-manager-content") as any;
        if (content) {
            content.pathRef.value = value;
        }
    }

    get content() {
        return this.querySelector?.("ui-file-manager-content") as FileManagerContent | null;
    }

    get operative() {
        return (this.content as any)?.operativeInstance;
    }

    get showSidebar(): boolean {
        const force = String(this.sidebar ?? "auto").toLowerCase();
        if (force === "true" || force === "1") return true;
        if (force === "false" || force === "0") return false;
        const width = propRef(this as any, "inlineSize")?.value ?? this.inlineSize ?? 0;
        return width >= 720; // container-query based threshold
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    onInitialize(): this {
        super.onInitialize();

        // Register with unified messaging if enabled
        if (this.enableMessaging && registerComponent && initializeComponent) {
            registerComponent("file-manager-instance", "basic-explorer");
            this.processPendingMessages();
        }

        // Create content element
        const contents = document.createElement("ui-file-manager-content");
        this.append(contents);

        //
        return this;
    }

    onRender(): this {
        super.onRender();

        // Bind input and setup handlers (input is in shadow DOM)
        queueMicrotask(() => {
            const input = this.shadowRoot?.querySelector?.("input[name=\"address\"]") as HTMLInputElement;
            if (input) {
                // Sync input with current path
                input.value = this.path;

                // Handle Enter key to navigate
                const weak = new WeakRef(this);
                const onEnter = (ev: KeyboardEvent) => {
                    if (ev.key === "Enter") {
                        ev.preventDefault();
                        const self = weak.deref() as any;
                        const val = input?.value?.trim?.() || "";
                        if (val) {
                            self?.navigate(val);
                        }
                    }
                };
                addEvent(input, "keydown", onEnter);

                // Sync input changes to path when input loses focus
                const onBlur = () => {
                    const val = input?.value?.trim?.() || "";
                    if (val && val !== this.path) {
                        this.navigate(val);
                    }
                };
                addEvent(input, "blur", onBlur);
            }
        });

        //
        return this;
    }

    // ========================================================================
    // MESSAGING
    // ========================================================================

    private processPendingMessages(): void {
        if (!initializeComponent) return;

        const pendingMessages = initializeComponent("file-manager-instance");
        for (const message of pendingMessages) {
            console.log(`[FileManager] Processing pending message:`, message);

            if (message.type === "content-explorer") {
                const action = message.data?.action || "save";
                const path = message.data?.path || message.data?.into || "/";

                if (action === "save" && (message.data?.file || message.data?.text || message.data?.content)) {
                    console.log(`[FileManager] Processing save action:`, message.data);
                } else if (action === "view" && message.data?.path) {
                    this.path = path;
                    console.log(`[FileManager] Navigating to path: ${path}`);
                }
            }
        }
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    async navigate(toPath: string): Promise<void> {
        const clean = getDir(toPath);
        if (clean) {
            this.path = clean;
            // Update input field when navigation happens (input is in shadow DOM)
            queueMicrotask(() => {
                const input = this.shadowRoot?.querySelector?.("input[name=\"address\"]") as HTMLInputElement;
                if (input && input.value !== clean) {
                    input.value = clean;
                }
            });
        }
    }

    async goBack(): Promise<void> {
        const currentPath = this.path || "/user/";
        // Remove trailing slash for splitting
        const cleanPath = currentPath.replace(/\/+$/g, "");
        const parts = cleanPath.split("/").filter(Boolean);

        if (parts.length <= 1) return; // stay at root

        const back = "/" + parts.slice(0, -1).join("/") + "/";
        this.path = back;
        
        // Update input field (input is in shadow DOM)
        queueMicrotask(() => {
            const input = this.shadowRoot?.querySelector?.("input[name=\"address\"]") as HTMLInputElement;
            if (input && input.value !== back) {
                input.value = back;
            }
        });
    }

    async goUp(): Promise<void> {
        await this.goBack();
    }

    // ========================================================================
    // OPERATIONS
    // ========================================================================

    requestUpload(): void {
        this.operative?.requestUpload?.();
    }

    requestPaste(): void {
        this.operative?.requestPaste?.();
    }

    requestUse(): void {
        this.operative?.requestUse?.();
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    render = function (this: FileManager) {
        const self: any = this;
        const sidebarVisible = this.showSidebar;

        // Content area
        const content = H`<div part="content" class="fm-content"><slot></slot></div>`;

        // Toolbar
        const toolbar = H`<div part="toolbar" class="fm-toolbar">
            <div class="fm-toolbar-left">
                <button class="btn" title="Back" on:click=${() => requestAnimationFrame(() => self.goBack())}>
                    <ui-icon icon="arrow-left"/>
                </button>
                <button class="btn" title="Up" on:click=${() => requestAnimationFrame(() => self.goUp())}>
                    <ui-icon icon="arrow-up"/>
                </button>
                <button class="btn" title="Refresh" on:click=${() => requestAnimationFrame(() => self.navigate(self.path))}>
                    <ui-icon icon="arrow-clockwise"/>
                </button>
            </div>
            <div class="fm-toolbar-center">
                <input
                    class="address c2-surface"
                    type="text"
                    name="address"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    aria-label="File path"
                />
            </div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => requestAnimationFrame(() => self.requestUpload?.())}>
                    <ui-icon icon="upload"/>
                </button>
                <button class="btn" title="Paste" on:click=${() => requestAnimationFrame(() => self.requestPaste?.())}>
                    <ui-icon icon="clipboard"/>
                </button>
                <button class="btn" title="Use" on:click=${() => requestAnimationFrame(() => self.requestUse?.())}>
                    <ui-icon icon="hand-withdraw"/>
                </button>
            </div>
        </div>`;

        // Bind address input to path (will be done in onRender)
        // This deferred binding ensures proper timing and event handler setup

        return H`<div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>${toolbar}${content}</div>`;
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FileManager;
export { FileManagerContent };
