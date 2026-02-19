import { defineElement, GLitElement, H, property } from "fest/lure";
import { ensureStyleSheet } from "fest/icon";

// @ts-ignore
@defineElement("ui-element")
export class UIElement extends GLitElement() {
    @property({ source: "attr" }) theme: string = "default";

    //
    render = function () { return H`<slot></slot>`; }

    //
    constructor() { super(); }

    //
    onRender() {
        super.onRender();
    }

    //
    connectedCallback() {
        super.connectedCallback();
    }

    //
    onInitialize() {
        super.onInitialize();
        // Only load icon styles, not the heavy veela runtime styles
        // which cause freezing/hanging performance issues
        const self : any = this;
        self.loadStyleLibrary(ensureStyleSheet());
    }
}

//
export default UIElement;
