/**
 * WHY: Lightweight tagged templates for static snippets (smaller footprint than importing `fest/lure` tagged `H`, which pulls the full lure graph via `Refs`).
 */
export function h(statics: TemplateStringsArray, ...values: unknown[]): HTMLElement {
    const raw = statics.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "");
    const trimmed = raw.trim();
    const doc = new DOMParser().parseFromString(`<body><template id="t">${trimmed}</template></body>`, "text/html");
    const tpl = doc.getElementById("t");
    const node = tpl?.content?.cloneNode(true) as DocumentFragment;
    const first = node?.firstElementChild;
    if (!first) throw new Error("dom-lite.h: expected a single element root");
    if (node.childElementCount > 1) throw new Error("dom-lite.h: multiple roots not supported");
    return first as HTMLElement;
}

/** Minimal cousin of lure `Q` — single-element query scoped to root. */
export function Q(sel: string, root: ParentNode & { querySelector: ParentNode["querySelector"] } = document.documentElement): Element | null {
    return root.querySelector(sel);
}
