import { H, defineElement, property, GLitElement } from "fest/lure"
import { Q, loadInlineStyle, DOMMixin } from "fest/dom"
import { ScrollBar } from "../../scss/scrollbar/Scrollbar"

// @ts-ignore
import styles from "./ScrollFrame.scss?inline"
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));
const loading = fetch(preInit, {priority: "high", keepalive: true, cache: "force-cache", mode: "same-origin"});
const styled  = loadInlineStyle(preInit, null, "ux-layer");

// @ts-ignore
@defineElement("ui-scrollframe")
export class ScrollBoxed extends GLitElement() {
    @property({source: "attr"}) anchor = "_";
    #x: any = null;
    #y: any = null;

    //
    constructor() { super(); }
    onInitialize() { //@ts-ignore
        super.onInitialize?.(); //@ts-ignore
    }

    //
    bindWith(content: any) {
        requestAnimationFrame(()=>{ // @ts-ignore
            this.#x = new ScrollBar({holder: this, scrollbar: Q(".ui-scrollbar[axis=\"x\"]", this.shadowRoot), content}, 0); // @ts-ignore
            this.#y = new ScrollBar({holder: this, scrollbar: Q(".ui-scrollbar[axis=\"y\"]", this.shadowRoot), content}, 1); // @ts-ignore
        });
        const name = "--rand-" + Math.random().toString(36).slice(2); // @ts-ignore
        this.style.positionAnchor = name, content.style.anchorName = name;
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
    connect(self) { // @ts-ignore
        const frame = document.createElement("ui-scrollframe"); frame?.bindWith?.(self);

        //
        self.style.scrollbarGutter = "auto";
        self.style.scrollbarWidth = "none";
        self.style.scrollbarColor = "transparent transparent";
        self.style.overflow = "scroll";

        //
        self.parentNode?.append(frame);
    }
}

//
new OverlayScrollbarMixin("ov-scrollbar");
export default ScrollBoxed;
