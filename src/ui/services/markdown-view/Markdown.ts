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
        let once = false;
        const view = this.#view?.element;
        const html = H(DOMPurify?.sanitize?.(await doc || "") || view?.innerHTML || "");
        if (view) {
            view.innerHTML = ``;
            view.append(html);
        }
        if (!once) document.dispatchEvent(new CustomEvent("ext-ready", {}));
        once = true;
    }

    //
    async renderMarkdown(file) {
        typeof file == "string" ? (localStorage.setItem("$cached-md$", file)) : file?.text?.()?.then?.((t) => localStorage.setItem("$cached-md$", t));
        if (file && navigator?.storage) { provide("/user/cache/last.md", true)?.then?.((p) => p?.write?.(file instanceof Response ? file?.blob?.() : file)); }
        if (typeof file == "string") {
            this.setHTML(await marked(file));
        } else
            if (file instanceof File || file instanceof Blob || file instanceof Response) {
                file?.text()?.then?.(async (doc) => this.setHTML(await marked(doc)));
            }
    }

    //
    attributeChangedCallback(name, oldValue) {
        const nv = this.getAttribute("src");
        if (nv && name == "src" && oldValue != nv) {
            provide(nv || "")?.then?.((file) => this.renderMarkdown(file))?.catch?.(console.error);
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
                provide(this.getAttribute("src") || "")?.then?.((file) => this.renderMarkdown(file))?.catch?.(console.error);
            }
        });
    }
}

//
customElements.define("md-view", MarkdownView);
