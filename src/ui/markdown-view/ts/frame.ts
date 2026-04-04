import { H } from "fest/lure";

const FRAME_TAG = "cw-markdown-view-frame";

export function createMarkdownViewFrame(): HTMLElement {
    return H`
        <div class="view-viewer__content" data-viewer-content>
            <pre class="markdown-viewer-raw" data-raw-target aria-label="Raw content" hidden></pre>
            <div
                class="cw-view-viewer__prose markdown-body markdown-viewer-content result-content"
                data-render-target
                data-cw-viewer-prose
            ></div>
        </div>
    ` as HTMLElement;
}

class MarkdownViewFrameElement extends HTMLElement {
    connectedCallback(): void {
        if (this.dataset.ready === "1") return;
        this.dataset.ready = "1";
        this.classList.add("cw-markdown-view-frame");
        this.replaceChildren(createMarkdownViewFrame());
    }
}

export function ensureMarkdownViewFrame(): string {
    if (!customElements.get(FRAME_TAG)) {
        customElements.define(FRAME_TAG, MarkdownViewFrameElement);
    }
    return FRAME_TAG;
}

