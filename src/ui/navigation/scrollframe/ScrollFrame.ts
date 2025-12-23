import { property, defineElement, H, registerOverlayElement } from "fest/lure"
import { UIElement } from "@fl-ui/base/UIElement"

//
const withScrollbars = new WeakMap();

// @ts-ignore
@defineElement("ui-scrollframe")
export class ScrollBoxed extends UIElement {
    @property({source: "attr"}) anchor = "_";
    #x: any = null;
    #y: any = null;

    // waiting until connected
    #holder: any = null;
    #content: any = null;
    #inputChange: any = null;

    //
    constructor() { super(); }
    onInitialize() {
        super.onInitialize?.();
        this.enableScrollbars();
    }

    //
    enableScrollbars() {
        const self = this as any;
        if (this.#content) {
            queueMicrotask(() => {
                if (self.isConnected) {//@ts-ignore
                    this.#x ??= new ScrollBar({ holder: this.#holder, scrollbar: self.shadowRoot?.querySelector?.(".ui-scrollbar[axis=\"x\"]"), content: this.#content, inputChange: this.#inputChange }, 0); //@ts-ignore
                    this.#y ??= new ScrollBar({ holder: this.#holder, scrollbar: self.shadowRoot?.querySelector?.(".ui-scrollbar[axis=\"y\"]"), content: this.#content, inputChange: this.#inputChange }, 1); //@ts-ignore
                    self.style.zIndex = (Number(getComputedStyle(this.#content)?.zIndex || 0) + 1) + "";
                }
            });
        }
    }

    //
    onRender() {
        super.onRender();
    }

    //
    activateScrollbars(content: any, holder: any, inputChange?: any|null) {
        const self = this as any;
        this.#content = content;
        this.#holder = holder ?? self;
        this.#inputChange = inputChange;
        this.enableScrollbars();
    }

    //
    render = () => H`
<slot></slot>
<div class="ui-scrollbar" axis="x"><div class="ui-thumb"></div></div>
<div class="ui-scrollbar" axis="y"><div class="ui-thumb"></div></div>`;
}

//
export default ScrollBoxed;

//
registerOverlayElement("ov-scrollbar", (content, holder?: any) => {
    if (withScrollbars?.has?.(content)) return false;

    //
    const self = document.createElement("ui-scrollframe");
    if (content) {
        withScrollbars?.set?.(content, self);

        //
        content.style.scrollbarGutter = "auto";
        content.style.scrollbarWidth = "none";
        content.style.scrollbarColor = "transparent transparent";
        content.style.overflowBlock = "hidden";
        content.style.overflowInline = "scroll";
        content.style.overflow = "scroll";

        //
        (self as any).activateScrollbars(content, holder);
    }

    //
    if (holder) {
        holder.style.overflow = "hidden";
        holder.style.scrollbarWidth = "none";
        holder.style.scrollbarColor = "transparent transparent";
        holder.style.scrollbarGutter = "auto";
    }

    //
    return self;
});
