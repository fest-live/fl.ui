import { H } from "fest/lure";

const TOOLBAR_TAG = "cw-markdown-toolbar-frame";

export function createViewerToolbar(): HTMLElement {
    return H`
        <div class="view-viewer__toolbar" data-viewer-toolbar>
            <div class="view-viewer__toolbar-group">
                <button type="button" data-action="open" title="Open"><ui-icon icon="folder-open"></ui-icon></button>
                <button type="button" data-action="paste" title="Paste"><ui-icon icon="clipboard-text"></ui-icon></button>
                <button type="button" data-action="copy" title="Copy raw"><ui-icon icon="copy"></ui-icon></button>
                <button type="button" data-action="copy-rendered" title="Copy rendered"><ui-icon icon="text-aa"></ui-icon></button>
                <button type="button" data-action="toggle-raw" title="Toggle raw/rendered"><ui-icon icon="code"></ui-icon></button>
            </div>
            <div class="view-viewer__toolbar-group">
                <button type="button" data-action="download" title="Download"><ui-icon icon="download-simple"></ui-icon></button>
                <button type="button" data-action="export-docx" title="Export DOCX"><ui-icon icon="file-doc"></ui-icon></button>
                <button type="button" data-action="print" title="Print"><ui-icon icon="printer"></ui-icon></button>
                <button type="button" data-action="toggle-outline" title="Outline"><ui-icon icon="list-bullets"></ui-icon></button>
                <button type="button" data-action="open-style-settings" title="Style settings"><ui-icon icon="sliders"></ui-icon></button>
                <button type="button" data-action="attach" title="Attach to Work Center"><ui-icon icon="paperclip"></ui-icon></button>
            </div>
        </div>
    ` as HTMLElement;
}

class MarkdownToolbarFrameElement extends HTMLElement {
    connectedCallback(): void {
        if (this.dataset.ready === "1") return;
        this.dataset.ready = "1";
        this.classList.add("cw-markdown-toolbar-frame");
        this.replaceChildren(createViewerToolbar());
    }
}

export function ensureMarkdownToolbarFrame(): string {
    if (!customElements.get(TOOLBAR_TAG)) {
        customElements.define(TOOLBAR_TAG, MarkdownToolbarFrameElement);
    }
    return TOOLBAR_TAG;
}

