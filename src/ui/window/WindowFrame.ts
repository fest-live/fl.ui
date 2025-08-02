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
        super.onInitialize();
        console.log(this.titlebarHandleEl);
        new DragHandler(this as any, { // @ts-ignore
            handler: this.titlebarHandleEl,
        });
        new ResizeHandler(this as any, { // @ts-ignore
            handler: this.resizeHandleEl,
        });
        E(this as any, {
            classList: new Set(["c2-surface"])
        })
    }

    //
    styles = () => styled.cloneNode(true);
    render = function () { return H`
        <div class="ui-window-frame-titlebar" part="titlebar">
            <span class="ui-window-frame-titlebar-handle" part="handle">
                <span class="ui-window-frame-titlebar-app-icon" part="app-icon">
                    <ui-icon name="window-frame-app-icon" icon="window-frame-app-icon"></ui-icon>
                </span>
                <span class="ui-window-frame-titlebar-title-text" part="title-text">
                    <slot name="title"></slot>
                </span>
                <span class="ui-window-frame-titlebar-title-text-sub" part="title-text-sub">
                    <slot name="subtitle"></slot>
                </span>
            </span>
            <span class="ui-window-frame-titlebar-controls" part="controls">
                <button class="ui-window-frame-titlebar-control-minimize" part="control-minimize">
                    <ui-icon name="window-frame-minimize" icon="minus"></ui-icon>
                </button>
                <button class="ui-window-frame-titlebar-control-maximize" part="control-maximize">
                    <ui-icon name="window-frame-maximize" icon="corners-out"></ui-icon>
                </button>
                <button class="ui-window-frame-titlebar-control-close" part="control-close">
                    <ui-icon name="window-frame-close" icon="x"></ui-icon>
                </button>
            </span>
        </div>
        <div class="ui-window-frame-content" part="content"><slot></slot></div>
        <span class="ui-window-frame-resize-handle" part="resize-handle"></span>
    `; }
}

//
export default WindowFrame;
