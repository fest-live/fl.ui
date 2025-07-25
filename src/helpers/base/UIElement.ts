import { GLitElement, H, defineElement, property } from "fest/lure";
import { preloadStyle } from "fest/dom";
import initialize from "fest/dom";

// @ts-ignore
import styles from "@scss/index.scss?inline"
const styled = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-element")
export class UIElement extends GLitElement() {
    @property({ source: "attr" }) theme: string = "default";

    constructor() { super(); }

    //
    render() { return H`<slot></slot>`; }

    //
    onInitialize() {
        super.onInitialize();
        const self : any = this;

        //
        initialize(self?.shadowRoot)?.then?.((style)=>{
            self.loadStyleLibrary(style);
            self.loadStyleLibrary(styled);
        });
    }
}

//
export default UIElement;
