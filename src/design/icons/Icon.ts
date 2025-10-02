import { defineElement, property, E } from "fest/lure";
import { camelToKebab, preloadStyle } from "fest/dom";
import { autoRef, numberRef } from "fest/object";
import { UIElement } from "../base/UIElement";

// @ts-ignore
import styles from "./Icon.scss?inline";
const styled  = preloadStyle(styles);

//
//import * as icons from "lucide";
const iconMap = new Map<string, Promise<string>>();
const maskCache = new Map<string, string>();

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
export class UIPhosphorIcon extends UIElement {
    @property({ source: "attr" }) icon: any = "";
    @property({ source: "attr" }) iconStyle: any = "duotone";
    @property({ source: "attr" }) width?: number;
    @property({ source: "attr" }) size?: string;
    #maskRef = autoRef("");
    #options = { padding: 0, icon: "", iconStyle: "duotone" };

    // also "display" may be "contents"
    public styles = ()  => styled.cloneNode(true);
    public onRender() {
        this.icon = this.#options?.icon || this.icon;
        this.iconStyle = this.#options?.iconStyle || this.iconStyle;
        this.updateIcon();
    }
    constructor(options = {icon: "", padding: ""}) { super(); Object.assign(this.#options, options); }

    //
    protected updateIcon(icon?: any) {
        const nextIcon = icon ?? (this.icon?.value ?? (typeof this.icon === "string" ? this.icon : ""));
        if (!nextIcon) { return this; }

        const ICON = camelToKebab(nextIcon || "");
        const urlPromise = loadAsImage(`./assets/icons/${this?.iconStyle || "duotone"}/${ICON}-${this?.iconStyle || "duotone"}.svg`);

        urlPromise?.then?.((url) => {
            if (!url) return;
            let maskValue = maskCache.get(url);
            if (!maskValue) {
                maskValue = `url(\"${url}\")`;
                maskCache.set(url, maskValue);
            }
            if (this.#maskRef.value !== maskValue) {
                this.#maskRef.value = maskValue;
                this.style.setProperty("--ui-icon-mask", maskValue);
            }
        });
        return this;
    }

    //
    public firstUpdated() { this.updateIcon(); }
    public onInitialize() {
        super.onInitialize?.(); const self = this as unknown as HTMLElement;
        E(self, { classList: new Set(["ui-icon", "u2-icon"]), inert: true });
        if (!self?.style.getPropertyValue("padding") && this.#options?.padding) { self.style.setProperty("--icon-padding", typeof this.#options?.padding == "number" ? (this.#options?.padding + "rem") : this.#options?.padding); };
        if (this.size) { self.style.setProperty("--icon-size", this.size); }
        this.style.setProperty("--ui-icon-mask", this.#maskRef.value || "none");
        this.updateIcon();
    }
}

//
export default UIPhosphorIcon;
