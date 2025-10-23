import { defineElement, property, E } from "fest/lure";
import { preloadStyle } from "fest/dom";
import { autoRef } from "fest/object";
import { UIElement } from "../base/UIElement";
import { camelToKebab } from "fest/core";

// @ts-ignore
import styles from "./Icon.scss?inline";
const styled  = preloadStyle(styles);

//
//import * as icons from "lucide";
const iconMap = new Map<string, Promise<string>>();
const maskCache = new Map<string, string>();

const rasterPromiseCache = new Map<string, Promise<string>>();
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();
const MAX_RASTER_SIZE = 512;
const MIN_RASTER_SIZE = 32;

type DevicePixelSize = { inline: number; block: number };

const fallbackMaskValue = (url: string) => (!url ? "none" : `url("${url}")`);

const quantizeToBucket = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) { value = MIN_RASTER_SIZE; }
    const safe = Math.max(value, MIN_RASTER_SIZE);
    const bucket = 2 ** Math.ceil(Math.log2(safe));
    return Math.min(MAX_RASTER_SIZE, bucket);
};

const loadImageElement = (url: string): Promise<HTMLImageElement> => {
    if (!url) { return Promise.reject(new Error("Invalid icon URL")); }
    if (!imageElementCache.has(url)) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            try { img.decoding = "async"; } catch (_) { /* noop */ }
            try { img.crossOrigin = "anonymous"; } catch (_) { /* noop */ }
            img.onload = () => resolve(img);
            img.onerror = (_event) => reject(new Error(`Failed to load icon: ${url}`));
            img.src = url;
        }).then(async (img) => {
            if (typeof img.decode === "function") {
                try { await img.decode(); } catch (_) { /* ignore decode errors */ }
            }
            return img;
        });
        imageElementCache.set(url, promise);
    }
    return imageElementCache.get(url)!;
};

const createCanvas = (size: number): OffscreenCanvas | HTMLCanvasElement => {
    const dimension = Math.max(size, MIN_RASTER_SIZE);
    if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(dimension, dimension);
    }
    const canvas = document.createElement("canvas");
    canvas.width = dimension;
    canvas.height = dimension;
    return canvas;
};

const canvasToImageUrl = async (canvas: OffscreenCanvas | HTMLCanvasElement): Promise<string> => {
    if ("convertToBlob" in canvas) {
        const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: "image/png" });
        return URL.createObjectURL(blob);
    }
    const htmlCanvas = canvas as HTMLCanvasElement;
    if (typeof htmlCanvas.toBlob === "function") {
        const blob = await new Promise<Blob>((resolve, reject) => {
            htmlCanvas.toBlob((blobValue) => {
                if (blobValue) { resolve(blobValue); }
                else { reject(new Error("Canvas toBlob returned null")); }
            }, "image/png");
        });
        return URL.createObjectURL(blob);
    }
    return htmlCanvas.toDataURL("image/png");
};

const rasterizeSvgToMask = async (url: string, bucket: number): Promise<string> => {
    const img = await loadImageElement(url);
    const size = Math.max(bucket, MIN_RASTER_SIZE);
    const canvas = createCanvas(size);
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!context) { throw new Error("Unable to acquire 2d context"); }
    context?.clearRect?.(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in context) {
        try { context.imageSmoothingQuality = "high"; } catch (_) { /* noop */ }
    }

    const naturalWidth = img.naturalWidth || img.width || size;
    const naturalHeight = img.naturalHeight || img.height || size;
    const safeWidth = naturalWidth || size;
    const safeHeight = naturalHeight || size;
    const scale = Math.min(size / safeWidth, size / safeHeight) || 1;
    const drawWidth = safeWidth * scale;
    const drawHeight = safeHeight * scale;
    const offsetX = (size - drawWidth) / 2;
    const offsetY = (size - drawHeight) / 2;

    context?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    const rasterUrl = await canvasToImageUrl(canvas);
    return fallbackMaskValue(rasterUrl);
};

const ensureMaskValue = (url: string, cacheKey: string, bucket: number): Promise<string> => {
    const safeUrl = url || "";
    const key = `${cacheKey}@${bucket}`;
    const cached = maskCache.get(key);
    if (cached) { return Promise.resolve(cached); }
    const pending = rasterPromiseCache.get(key);
    if (pending) { return pending; }

    const promise = rasterizeSvgToMask(safeUrl, bucket)
        .then((maskValue) => {
            maskCache.set(key, maskValue);
            rasterPromiseCache.delete(key);
            return maskValue;
        })
        .catch((error) => {
            rasterPromiseCache.delete(key);
            const fallback = fallbackMaskValue(safeUrl);
            if (safeUrl && typeof console !== "undefined") {
                console.warn?.("[ui-icon] Rasterization failed, using SVG mask", error);
            }
            maskCache.set(key, fallback);
            return fallback;
        });

    rasterPromiseCache.set(key, promise);
    return promise;
};

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
    #resizeObserver?: ResizeObserver;
    #devicePixelSize: DevicePixelSize = { inline: MIN_RASTER_SIZE, block: MIN_RASTER_SIZE };
    #queuedMaskUpdate: Promise<void> | null = null;
    #currentIconUrl = "";
    #maskKeyBase = "";

    // also "display" may be "contents"
    public styles = () => styled?.cloneNode?.(true);
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
        const iconStyle = this?.iconStyle || "duotone";
        const assetPath = `./assets/icons/${iconStyle}/${ICON}-${iconStyle}.svg`;
        this.#maskKeyBase = `${iconStyle}:${ICON}`;

        loadAsImage(assetPath)?.then?.((url) => {
            if (!url) { return; }
            this.#currentIconUrl = url;
            this.#queueMaskUpdate();
        })?.catch?.((error) => {
            if (typeof console !== "undefined") {
                console.warn?.("[ui-icon] Failed to load icon", assetPath, error);
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
        self.style.setProperty("--ui-icon-mask", this.#maskRef.value || "linear-gradient(#0000, #0000)");
        this.#setupResizeObserver(self);
        this.updateIcon();
    }

    public disconnectedCallback(): void {
        // @ts-ignore
        super.disconnectedCallback?.();
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = undefined;
    }

    #setupResizeObserver(element: HTMLElement) {
        if (typeof ResizeObserver === "undefined" || this.#resizeObserver) { return; }
        this.#resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target !== element) { continue; }
                const deviceSize = entry.devicePixelContentBoxSize?.[0];
                const contentSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize as unknown as ResizeObserverSize | undefined;
                const ratio = typeof devicePixelRatio === "number" && isFinite(devicePixelRatio) ? devicePixelRatio : 1;
                const inline = deviceSize?.inlineSize || (contentSize?.inlineSize ?? entry.contentRect?.width ?? element.clientWidth ?? MIN_RASTER_SIZE) * ratio;
                const block = deviceSize?.blockSize || (contentSize?.blockSize ?? entry.contentRect?.height ?? element.clientHeight ?? MIN_RASTER_SIZE) * ratio;
                this.#devicePixelSize = {
                    inline: inline || MIN_RASTER_SIZE,
                    block: block || MIN_RASTER_SIZE,
                };
                this.#queueMaskUpdate();
            }
        });
        try {
            this.#resizeObserver.observe(element, { box: "device-pixel-content-box" });
        } catch (_) {
            this.#resizeObserver.observe(element);
        }
    }

    #queueMaskUpdate() {
        const self = this as unknown as HTMLElement;
        if (!this.#currentIconUrl) { return; }
        if (this.#queuedMaskUpdate) { return; }
        this.#queuedMaskUpdate = Promise.resolve().then(() => {
            this.#queuedMaskUpdate = null;
            const url = this.#currentIconUrl;
            if (!url) { return; }
            const bucket = this.#getRasterBucket();
            const cacheKey = this.#maskKeyBase || url;
            ensureMaskValue(url, cacheKey, bucket)
                .then((maskValue) => {
                    if (this.#maskRef.value !== maskValue) {
                        this.#maskRef.value = maskValue;
                        self.style.setProperty("--ui-icon-mask", maskValue);
                    }
                })
                .catch((error) => {
                    if (typeof console !== "undefined") {
                        console.warn?.("[ui-icon] Mask update failed", error);
                    }
                });
        });
    }

    #getRasterBucket(): number {
        const self = this as unknown as HTMLElement;
        const inline = Math.ceil(this.#devicePixelSize?.inline || 0);
        const block = Math.ceil(this.#devicePixelSize?.block || 0);
        const candidate = Math.max(inline, block);
        if (candidate > 0) { return quantizeToBucket(candidate); }

        let fallback = MIN_RASTER_SIZE;
        const ratio = typeof devicePixelRatio === "number" && isFinite(devicePixelRatio) ? devicePixelRatio : 1;
        if (typeof self.getBoundingClientRect === "function") {
            const rect = self.getBoundingClientRect();
            const maximum = Math.max(rect.width, rect.height) * ratio;
            if (maximum > 0) { fallback = maximum; }
        }
        return quantizeToBucket(fallback);
    }
}

//
export default UIPhosphorIcon;
