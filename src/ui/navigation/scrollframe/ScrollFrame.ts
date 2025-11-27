import { property, defineElement, Q, H, appendAsOverlay } from "fest/lure"
import { DOMMixin, preloadStyle } from "fest/dom"
import { UIElement } from "@fl-ui/base/UIElement"

// @ts-ignore
//import styles from "./ScrollFrame.scss?inline"
//const styled = preloadStyle(styles);

//
const withScrollbars = new WeakMap();

// @ts-ignore
@defineElement("ui-scrollframe")
export class ScrollBoxed extends UIElement {
    @property({source: "attr"}) anchor = "_";
    #x: any = null;
    #y: any = null;
    #connected = Promise.withResolvers();

    //
    constructor() { super(); this.#connected = Promise.withResolvers(); }
    onInitialize() { //@ts-ignore
        super.onInitialize?.(); //@ts-ignore
        requestAnimationFrame(()=>{
            this.#connected.resolve(true);
        });
    }

    //
    onRender() {
        super.onRender();
    }

    //
    bindWith(content: any, holder: any, inputChange?: any|null) {
        if (content?.style?.anchorName || withScrollbars?.has?.(content)) return false;

        //
        if (content) {
            const self = this as any;
            withScrollbars?.set?.(content, self);

            /* TODO: fix scrollbars implementation
            this.#connected?.promise?.then(()=>{
                this.#x ??= new ScrollBar({ holder: self, scrollbar: self.shadowRoot?.querySelector?.(".ui-scrollbar[axis=\"x\"]"), content, inputChange }, 0);
                this.#y ??= new ScrollBar({ holder: self, scrollbar: self.shadowRoot?.querySelector?.(".ui-scrollbar[axis=\"y\"]"), content, inputChange }, 1);
            });*/

            //
            content.style.scrollbarGutter = "auto";
            content.style.scrollbarWidth = "none";
            content.style.scrollbarColor = "transparent transparent";
            content.style.overflowBlock = "hidden";
            content.style.overflowInline = "scroll";

            //
            appendAsOverlay(content, self, holder);
        }

        //
        if (holder) {
            holder.style.overflow = "hidden";
            holder.style.scrollbarWidth = "none";
            holder.style.scrollbarColor = "transparent transparent";
            holder.style.scrollbarGutter = "auto";
        }

        //
        return true;
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = () => H`
<slot></slot>
<div class="ui-scrollbar" axis="x"><div class="ui-thumb"></div></div>
<div class="ui-scrollbar" axis="y"><div class="ui-thumb"></div></div>`;
}

//
export class OverlayScrollbarMixin extends DOMMixin {
    constructor(name?) { super(name); }

    // @ts-ignore
    connect(ws) {
        const self: any = ws?.deref?.();
        if (withScrollbars?.has?.(self)) return;

        //
        /*
        const frame = withScrollbars?.get?.(self) ?? document.createElement("ui-scrollframe"); // @ts-ignore
        const bound = frame?.bindWith?.(self);
        if (bound) {
            self.style.scrollbarGutter = "auto";
            self.style.scrollbarWidth = "none";
            self.style.scrollbarColor = "transparent transparent";
            self.style.overflow = "scroll";
            self.style.zIndex = (Number(getComputedStyle(self)?.zIndex || 0) + 1) + "";
            //self.parentNode?.append(frame);
        }*/
    }
}

//
new OverlayScrollbarMixin("ov-scrollbar");
export default ScrollBoxed;
