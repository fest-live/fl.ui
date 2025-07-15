/* **
 * @module ui/inputs/slider/Slider
 * @description Slider input element
 * @author [@danielx](https://github.com/danielx)
 * @version 1.0.0
 * @license MIT
 * @copyright 2025
 */

/*
 * Functional Appearance: Slider (alike range)
 * Usable for: Radio, Range, Checkbox, Number
 * Differs by: Universal Wrapper, Mobile Friendly, More Functional
 */

import { H, GLitElement, property, defineElement } from "fest/lure";
import { preloadStyle } from "fest/dom";

//
import { dragSlider } from "../../../helpers/core/InputExt";

// @ts-ignore
import styles from "./Slider.scss?inline"
const styled  = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-slider")
export class SliderInput extends GLitElement() {
    @property({ source: "query", name: "input" }) input?: HTMLInputElement;
    @property({ source: "query-shadow", name: ".ui-thumb" }) thumb?: HTMLElement;
    @property({ source: "query-shadow", name: ".ui-box" }) handle?: HTMLElement;
    @property({ source: "attr", from: "input[type=\"radio\"]:checked, input:where([type=\"checkbox\"], [type=\"number\"], [type=\"range\"]), input" }) name?: string;
    @property({ source: "property", name: "value", from: "input[type=\"radio\"]:checked, input:where([type=\"checkbox\"], [type=\"number\"], [type=\"range\"])" }) value?: string;

    //
    constructor() { super(); }

    //
    styles = () => styled.cloneNode(true);
    render() { return H`
<div class="ui-box">
    <div class="ui-track"></div>
    <div class="ui-thumb"></div>
</div>
<slot></slot>
`; }

    //
    onInitialize() {
        super.onInitialize();
        dragSlider(this, this.handle, this.input);
    }
}

//
export default SliderInput;
