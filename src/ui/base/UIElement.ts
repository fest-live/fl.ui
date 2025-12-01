import { preloadStyle, loadAsAdopted } from "fest/dom";
import { defineElement, GLitElement, H, property } from "fest/lure";
import { ensureStyleSheet } from "fest/icon";

// @ts-ignore
import {runtimeStyles} from "fest/veela";

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
        const self : any = this;
        self.loadStyleLibrary(runtimeStyles);
        self.loadStyleLibrary(ensureStyleSheet());
    }
}

//
export default UIElement;
