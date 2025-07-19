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

import { defineElement, H, property } from "fest/lure";
import { preloadStyle } from "fest/dom";

//
import { dragSlider } from "@helpers/core/InputExt";
import { UIElement } from "@helpers/base/UIElement";

// @ts-ignore
import styles from "@ui/inputs/slider/Slider.scss?inline"
const styled  = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-slider")
export class SliderInput extends UIElement {
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
<div class="ui-box" part="box">
    <div class="ui-track" part="track"></div>
    <div class="ui-thumb" part="thumb"></div>
</div>
<slot></slot>
`; }

    //
    onInitialize() {
        super.onInitialize();
        dragSlider(this, this.thumb, this.input);
        //slideTo(this, this.handle, this.input, pointerRef());
    }
}

//
export default SliderInput;
