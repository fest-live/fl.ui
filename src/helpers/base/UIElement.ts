import { initialize, preloadStyle } from "fest/dom";
import { defineElement, GLitElement, H, property } from "fest/lure";

//
// @ts-ignore
import styles from "@scss/index.scss?inline"
const styled = preloadStyle(styles);

//
// @ts-ignore
@defineElement("ui-element")
export class UIElement extends GLitElement() {
    @property({ source: "attr" }) theme: string = "default";
     render() { return H`<slot></slot>`; }

    //
     constructor() { super(); }
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
