// @ts-ignore
import styles from "./Markdown.scss?inline&compress";
import DOMPurify from 'isomorphic-dompurify';
import { marked } from "marked";
import { provide, E, H } from "fest/lure";

//
import markedKatex from "marked-katex-extension";
marked?.use?.(markedKatex({ throwOnError: false, nonStandard: true }));

//
const preInit = URL.createObjectURL(new Blob([styles], { type: "text/css" }));
export class MarkdownView extends HTMLElement {
    static observedAttributes = ["src"]; #view;
    constructor() { super(); this.createShadowRoot(); }

    //
    connectedCallback() {
        this.style.setProperty("pointer-events", "auto");
        this.style.setProperty("touch-action", "manipulation");
        this.style.setProperty("user-select", "text");
    }

    //
    async setHTML(doc = "") {
        const view = this.#view;
        if (view) {
            view.innerHTML = ``; console.log(doc);
            view.append(H(DOMPurify?.sanitize?.((await doc)?.trim?.() || "") || view?.innerHTML || ""));
        }
        document.dispatchEvent(new CustomEvent("ext-ready", {}));
    }

    //
    async loadFromCache() {
        if (navigator?.storage) {
            return provide("/user/cache/last.md");
        }
        return localStorage.getItem("$cached-md$");
    }

    //
    async writeToCache(text: string|File|Blob) {
        if (navigator?.storage) {
            const forWrite = await provide("/user/cache/last.md", true);
            await forWrite?.write?.(text instanceof Response ? await text?.blob?.()?.catch?.(console.warn.bind(console)) : text)
            await forWrite?.close?.();
        } else
        if (typeof text == "string") {
            localStorage.setItem("$cached-md$", text)
        }
    }

    //
    async renderMarkdown(file) {
        //
        const renderMarkdownText = async (text: string)=>{
            this.writeToCache(text)?.catch?.(console.warn.bind(console));
            return this.setHTML(await marked(text?.trim?.() || ""))?.catch?.(console.warn.bind(console));
        }

        //
        if (!file) {
            const cached = await this.loadFromCache();
            if (cached) { return this.renderMarkdown(cached || "")?.catch?.(console.warn.bind(console)); };
            return;
        };

        //
        if (URL.canParse(file) || file?.startsWith?.("blob:")) {
            file = await (await fetch(file))?.text?.();
        }

        //
        if (typeof file == "string") {
            renderMarkdownText(file)?.catch?.(console.warn.bind(console));
        } else
            if (file instanceof File || file instanceof Blob || file instanceof Response) {
                file?.text()?.then?.(async (doc) => renderMarkdownText(doc)?.catch?.(console.warn.bind(console)))?.catch?.(console.warn.bind(console));
            }
    }

    //
    attributeChangedCallback(name, oldValue) {
        const nv = this.getAttribute("src");
        if (nv && name == "src" && oldValue != nv) {
            this.renderMarkdown(nv || "")?.catch?.(console.warn.bind(console));
        };
    }

    //
    createShadowRoot() {
        const shadowRoot = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.innerHTML = `@import url("${preInit}");`;
        shadowRoot.append(style, this.#view = E("div.markdown-body", { dataset: { print: "" } }));
        requestAnimationFrame(() => this.renderMarkdown(this.getAttribute("src") || ""));
    }
}

//
customElements.define("md-view", MarkdownView);
