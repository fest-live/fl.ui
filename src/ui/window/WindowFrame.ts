import { defineElement, H, E, property } from "fest/lure";
import { preloadStyle } from "fest/dom";

//
import { UIElement } from "@helpers/base/UIElement";
import { DragHandler } from "@helpers/controllers/Draggable";
import { ResizeHandler } from "@helpers/controllers/Resizable";

// @ts-ignore
import styles from "@ui/window/WindowFrame.scss?inline"
const styled  = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-window-frame")
export class WindowFrame extends UIElement {
    /* Attributes */
    @property({ source: "attr", name: "name" }) name?: string = "";
    @property({ source: "attr", name: "icon" }) icon?: string = "app-window";
    @property({ source: "attr", name: "title" }) title?: string = "WINDOW_FRAME_TITLE";
    @property({ source: "attr", name: "subtitle" }) subtitle?: string = "WINDOW_FRAME_SUBTITLE";

    /* Public Attributes */
    @property({ source: "attr", name: "content" }) content?: string = "";
    @property({ source: "attr", name: "titlebar" }) titlebar?: string = "";
    @property({ source: "attr", name: "titlebar-handle" }) titlebarHandle?: string = "";
    @property({ source: "attr", name: "titlebar-app-icon" }) titlebarAppIcon?: string = "";

    /* Customization */
    @property({ source: "attr", name: "close-icon" }) closeIcon?: string = "x";
    @property({ source: "attr", name: "minimize-icon" }) minimizeIcon?: string = "minus";
    @property({ source: "attr", name: "maximize-icon" }) maximizeIcon?: string = "corners-out";

    /* Shadow DOM Elements */
    @property({ source: "query-shadow", name: ".ui-window-frame-content" }) contentEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar" }) titlebarEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-handle" }) titlebarHandleEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-resize-handle" }) resizeHandleEl?: HTMLElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-app-icon" }) appIconEl?: HTMLSpanElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-title-text" }) titleTextEl?: HTMLSpanElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-title-text-sub" }) titleTextSubEl?: HTMLSpanElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-control-close" }) closeEl?: HTMLButtonElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-control-minimize" }) minimizeEl?: HTMLButtonElement;
    @property({ source: "query-shadow", name: ".ui-window-frame-titlebar-control-maximize" }) maximizeEl?: HTMLButtonElement;

    //
    constructor() {
        super();
    }

    //
    onInitialize() {
        super.onInitialize();  // @ts-ignore
        new DragHandler(this as any, { handler: this.titlebarHandleEl });  // @ts-ignore
        new ResizeHandler(this as any, { handler: this.resizeHandleEl });
        E(this as any, { classList: new Set(["c2-surface"]) })

        //
        const self: any = this;
        const weak = new WeakRef(self);

        //
        const withDispatch = (name)=>((ev)=>{
            ev.preventDefault();
            weak.deref?.().dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true, }));
        })

        //
        this.closeEl?.addEventListener("click", withDispatch("close"));
        this.minimizeEl?.addEventListener("click", withDispatch("minimize"));
        this.maximizeEl?.addEventListener("click", withDispatch("maximize"));
    }

    //
    styles = () => styled.cloneNode(true);
    render = function () { return H`
        <div class="ui-window-frame-titlebar" part="titlebar">
            <span class="ui-window-frame-titlebar-handle" part="handle">
                <span class="ui-window-frame-titlebar-app-icon" part="app-icon">
                    <ui-icon name="window-frame-app-icon" icon=${this.icon ?? "window-frame-app-icon"}></ui-icon>
                </span>
                <span class="ui-window-frame-titlebar-title-text" part="title-text">
                    ${this.title || H`<slot name="title"></slot>`}
                </span>
                <span class="ui-window-frame-titlebar-title-text-sub" part="title-text-sub">
                    ${this.subtitle || H`<slot name="subtitle"></slot>`}
                </span>
            </span>
            <span class="ui-window-frame-titlebar-controls" part="controls">
                <button class="ui-window-frame-titlebar-control-minimize" part="control-minimize">
                    <ui-icon name="window-frame-minimize" icon=${this.minimizeIcon ?? "minus"}></ui-icon>
                </button>
                <button class="ui-window-frame-titlebar-control-maximize" part="control-maximize">
                    <ui-icon name="window-frame-maximize" icon=${this.maximizeIcon ?? "corners-out"}></ui-icon>
                </button>
                <button class="ui-window-frame-titlebar-control-close" part="control-close">
                    <ui-icon name="window-frame-close" icon=${this.closeIcon ?? "x"}></ui-icon>
                </button>
            </span>
        </div>
        <div class="ui-window-frame-content" part="content"><slot></slot></div>
        <span class="ui-window-frame-resize-handle" part="resize-handle"></span>
    `; }
}

//
export default WindowFrame;
