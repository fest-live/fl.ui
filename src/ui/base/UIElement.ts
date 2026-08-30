import { preloadStyle, loadAsAdopted } from "@fest-lib/dom";
import { defineElement, GLitElement, H, property } from "@fest-lib/lure";
import { ensureStyleSheet } from "@fest-lib/icon";

// @ts-ignore
@defineElement("ui-element")
export class UIElement extends GLitElement() {
    @property({ source: "attr" }) theme: string = "default";

    //
    render = function () { return H`<slot></slot>`; }

    //
    constructor() { super(); }

    //
    onRender(): this|void|undefined {
        return super.onRender();
    }

    //
    connectedCallback(): this {
        const result = super.connectedCallback?.();
        const self : any = result ?? this;
        // WHY: icon sheet must re-attach on reconnect; Veela runtime stays out (freeze).
        self.loadStyleLibrary(ensureStyleSheet());
        return self;
    }

    //
    onInitialize(): this {
        const result = super.onInitialize();
        const self : any = result ?? this;
        self.loadStyleLibrary(ensureStyleSheet());
        return self;
    }
}

//
export default UIElement;
