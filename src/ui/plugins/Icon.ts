// @ts-ignore
import styles from "./Icon.scss?inline";

//
import { defineElement, GLitElement, property, E, H } from "fest/lure";
import { kebabToCamel, preloadStyle } from "fest/dom";
import { subscribe } from "fest/object";
import { importCdn } from "fest/cdnImport";

//
import * as icons from "lucide";

//
const styled  = preloadStyle(styles);
const iconMap = new Map<string, Promise<string>>();
const rasterizeSVG = async (blob)=>{ return URL.createObjectURL(blob); }
const loadAsImage  = (name: string, creator?: (name: string)=>any)=>{
    // @ts-ignore // !experimental `getOrInsert` feature!
    return iconMap.getOrInsertComputed(name, ()=>{
        const element = creator ? creator(name) : null;
        const text = element.outerHTML, file = new Blob([`<?xml version=\"1.0\" encoding=\"UTF-8\"?>`, text], { type: "image/svg+xml" });
        return rasterizeSVG(file);
    });
};

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) {
        return str; // Handle non-string or empty inputs gracefully
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// @ts-ignore
@defineElement('ui-icon')
export class UILucideIcon extends GLitElement() {
    @property() protected iconElement?: SVGElement;
    @property({ source: "attr" }) icon: any = "";
    @property({ source: "attr" }) width?: number;
    #options = { padding: 0, icon: "" };

    // also "display" may be "contents"
    public styles = ()  => styled.cloneNode(true);
    public render = (we)=> []; // @ts-ignore
    public onRender() { this.icon = this.#options?.icon || this.icon; this.updateIcon(); subscribe([this.getProperty("icon"), "value"], (icon)=>{ this.updateIcon(icon) }); }
    constructor(options = {icon: "", padding: ""}) { super(); Object.assign(this.#options, options); }

    //
    protected updateIcon(icon?: any) {
        if (icon ||= (this.icon?.value ?? (typeof this.icon == "string" ? this.icon : "")) || "") { // @ts-ignore
            //Promise.try(importCdn, ["/fest/vendor/lucide.min.js"])?.then?.((icons)=>{
                const ICON = capitalizeFirstLetter(kebabToCamel(icon || ""));
                if (icons?.[ICON]) {
                    const self = this as any;
                    loadAsImage(ICON, (U)=>icons?.createElement?.(icons?.[U]))?.then?.((url)=>{
                        console.log(url);
                        const src  = `url(\"${url}\")`;
                        const fill = self;//self?.shadowRoot?.querySelector?.(".fill");
                        if (fill?.style?.getPropertyValue?.("mask-image") != src) {
                            fill?.style?.setProperty?.("mask-image", src);
                        }
                    });
                }
            //}).catch(console.warn.bind(console));
        }
        return this;
    }

    //
    public firstUpdated() { this.updateIcon(); }
    public onInitialize() {
        super.onInitialize?.(); const self = this as unknown as HTMLElement;
        E(self, { classList: new Set(["ui-icon", "u2-icon"]), inert: true });
        if (!self?.style.getPropertyValue("padding") && this.#options?.padding) { self.style.setProperty("padding", typeof this.#options?.padding == "number" ? (this.#options?.padding + "rem") : this.#options?.padding); };
        this.updateIcon();
    }
}

//
export default UILucideIcon;
