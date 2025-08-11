/* Statusbar wrapper */
import UIElement from "@helpers/base/UIElement";
import { H, defineElement } from "fest/lure";

//
// @ts-ignore
import styles from "./StatusBar.scss?inline";
import { preloadStyle } from "fest/dom";
const styled = preloadStyle(styles);

//
// @ts-ignore
@defineElement("ui-statusbar")
export class StatusBar extends UIElement {
    constructor() { super(); }

    //
    styles = () => styled?.cloneNode?.(true);

    //
    render() {
        return H`
<div style="background-color: transparent;" part="left"   class="left"  ><slot name="left"  ></slot></div>
<div style="background-color: transparent;" part="center" class="center"><slot name="center"></slot></div>
<div style="background-color: transparent;" part="right"  class="right" ><slot name="right" ></slot></div>`;
    }
}
