import { defineElement, property, E } from "fest/lure";
import { camelToKebab, preloadStyle } from "fest/dom";
import { subscribe } from "fest/object";
import { UIElement } from "@helpers/base/UIElement";

// @ts-ignore
import styles from "@ui/icons/Icon.scss?inline";
const styled  = preloadStyle(styles);

//
//import * as icons from "lucide";
const iconMap = new Map<string, Promise<string>>();

//
const isPathURL = (url: string)=>{ return URL.canParse(url, location.origin) || URL.canParse(url, "localhost"); }
const rasterizeSVG = (blob)=>{ return isPathURL(blob) ? blob : URL.createObjectURL(blob); }
const loadAsImage  = async (name: any, creator?: (name: any)=>any)=>{
    if (isPathURL(name)) { return name; }
    // @ts-ignore // !experimental `getOrInsert` feature!
    return iconMap.getOrInsertComputed(name, async ()=>{
        const element = await (creator ? creator?.(name) : name);
        if (isPathURL(element)) { return element; }
        let file: any = name;
        if (element instanceof Blob || element instanceof File) { file = element; }
        else { const text = typeof element == "string" ? element : element.outerHTML; file = new Blob([`<?xml version=\"1.0\" encoding=\"UTF-8\"?>`, text], { type: "image/svg+xml" }); }
        return rasterizeSVG(file);
    });
};

// Handle non-string or empty inputs gracefully
function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) { return str; }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// @ts-ignore
@defineElement('ui-icon')
export class UILucideIcon extends UIElement {
    //
    @property({ source: "attr" }) icon: any = "";
    @property({ source: "attr" }) width?: number;
    @property() protected iconElement?: SVGElement;
    #options = { padding: 0, icon: "" };

    // also "display" may be "contents"
    public styles = ()  => styled.cloneNode(true);
    public onRender() { this.icon = this.#options?.icon || this.icon; this.updateIcon(); subscribe([(this as any).getProperty("icon"), "value"], (icon)=>{ this.updateIcon(icon) }); }
    constructor(options = {icon: "", padding: ""}) { super(); Object.assign(this.#options, options); }

    //
    protected updateIcon(icon?: any) {
        if (icon ||= (this.icon?.value ?? (typeof this.icon == "string" ? this.icon : "")) || "") { // @ts-ignore
            const ICON = camelToKebab(icon || "");//capitalizeFirstLetter(kebabToCamel(icon || ""));
            const self = this as any;
            loadAsImage(`./icons/duotone/${ICON}-duotone.svg`)?.then?.((url)=>{
                if (!url) return;
                const src  = `url(\"${url}\")`;
                const fill = self;//self?.shadowRoot?.querySelector?.(".fill");
                if (fill?.style?.getPropertyValue?.("mask-image") != src) {
                    fill?.style?.setProperty?.("mask-image", src);
                }
            });
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
