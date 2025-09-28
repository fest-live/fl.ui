// @ts-ignore
import styles from "./Markdown.scss?inline&compress";
import DOMPurify from 'isomorphic-dompurify';
import { marked } from "marked";
import { provide, E, H } from "fest/lure";
import markedKatex from "marked-katex-extension";
marked?.use?.(markedKatex({ throwOnError: false, nonStandard: true }));

//
const preInit = URL.createObjectURL(new Blob([styles], { type: "text/css" }));
export class MarkdownView extends HTMLElement {
    static observedAttributes = ["src"];

    //
    constructor() { super(); this.createShadowRoot(); }

    //
    #view;
    #themeStyle;

    //
    async setHTML(doc = "") {
        const view = this.#view?.element;
        if (view) {
            view.innerHTML = ``;
            view.append(H(DOMPurify?.sanitize?.(await doc || "") || view?.innerHTML || ""));
        }
        document.dispatchEvent(new CustomEvent("ext-ready", {}));
    }

    //
    async renderMarkdown(file) {
        if (!file) return;

        //
        typeof file == "string" ? (localStorage.setItem("$cached-md$", file)) : file?.text?.()?.then?.((t) => localStorage.setItem("$cached-md$", t));
        if (file && navigator?.storage) { provide("/user/cache/last.md", true)?.then?.(async (p) => p?.write?.(file instanceof Response ? await file?.blob?.()?.catch?.(console.warn.bind(console)) : file)); }

        //
        if (typeof file == "string") {
            this.setHTML(await marked(file))?.catch?.(console.warn.bind(console));
        } else
            if (file instanceof File || file instanceof Blob || file instanceof Response) {
                file?.text()?.then?.(async (doc) => this.setHTML(await marked(doc))?.catch?.(console.warn.bind(console)))?.catch?.(console.warn.bind(console));
            }
    }

    //
    attributeChangedCallback(name, oldValue) {
        const nv = this.getAttribute("src");
        if (nv && name == "src" && oldValue != nv) {
            provide(nv || "")?.then?.((file) => this.renderMarkdown(file))?.catch?.(console.warn.bind(console));
        };
    }

    //
    createShadowRoot() {
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.append((this.#view = E("div.markdown-body", { dataset: { print: "" } }))?.element);

        //
        const style = document.createElement("style");
        style.innerHTML = `@import url("${preInit}");`;
        shadowRoot.appendChild(style);

        //
        requestAnimationFrame(() => {
            if (this.getAttribute("src")) {
                provide(this.getAttribute("src") || "")
                    ?.then?.((file) => this.renderMarkdown(file))
                    ?.catch?.(console.warn.bind(console));
            }
        });
    }
}

//
customElements.define("md-view", MarkdownView);
