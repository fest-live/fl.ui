import { ensureMarkdownTypographyStyles } from "../../src/ui/markdown/Markdown";
import { highlightCodeTree } from "../../src/ui/markdown/highlight";
import "../../src/ui/markdown/Markdown";

export function mount(el: HTMLElement): void {
    ensureMarkdownTypographyStyles();
    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent = "Markdown — md-view";
    el.appendChild(cap);
    const md = document.createElement("md-view");
    const body = document.createElement("div");
    body.className = "markdown-body";
    body.innerHTML = "<h1>Markdown suite</h1><p>Inline <strong>bold</strong> and <code>code</code>.</p><pre data-language=\"ts\"><code data-language=\"ts\" class=\"language-ts\">const ready = true;</code></pre><ul><li>One</li><li>Two</li></ul>";
    md.appendChild(body);
    el.appendChild(md);
    highlightCodeTree(body);
}
