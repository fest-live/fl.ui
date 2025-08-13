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

//
import { attrRef, defineElement, H, property, valueAsNumberRef, valueRef } from "fest/lure";
import { preloadStyle } from "fest/dom";
import { computed, assign } from "fest/object";

//
import { dragSlider, getInputValues } from "@helpers/core/InputExt";
import { UIElement } from "@helpers/base/UIElement";

// @ts-ignore
import styles from "./Slider.scss?inline"
const styled  = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-slider")
export class SliderInput extends UIElement {
    get valueAsNumber() {
        return getInputValues(this.input)?.[0] || 0;
    }

    //
    @property({ source: "query", name: "input" }) input?: HTMLInputElement;
    @property({ source: "query-shadow", name: ".ui-thumb" }) thumb?: HTMLElement;
    @property({ source: "query-shadow", name: ".ui-box" }) handle?: HTMLElement;
    @property({ source: "property", from: "input[type=\"radio\"]:checked, input:where([type=\"checkbox\"], [type=\"number\"], [type=\"range\"]), input" }) name?: string;
    @property({ source: "property", from: "input[type=\"radio\"]:checked, input:where([type=\"checkbox\"], [type=\"number\"], [type=\"range\"])", name: "value" }) value?: string;
    @property({ source: "attr", name: "variant" }) variant?: string;

    //
    static formAssociated = true;

    //
    constructor() {
        super(); // @ts-ignore
        this.internals_ = this.attachInternals();
    }

    //
    styles = () => styled.cloneNode(true);
    render = ()=> H`
<div class="ui-box c2-surface" part="box">
    <div class="ui-track c2-surface" part="track"></div>
    <div class="ui-thumb c2-surface" part="thumb"></div>
</div>
<slot></slot>
`;

    //
    onInitialize() {
        super.onInitialize();
        // prefer sensible default variant if not specified
        const host = this as unknown as HTMLElement;
        if (!host.getAttribute("variant")) {
            const inputType = this.input?.type;
            host.setAttribute("variant", inputType === "checkbox" ? "switch" : "slider");
        }
        dragSlider(this.thumb, this.handle, this.input); // @ts-ignore
        assign([this.internals_, "ariaValueMax"], computed(attrRef(this.input, "max"), (v)=>getInputValues(this.input)?.[2]??v)); // @ts-ignore
        assign([this.internals_, "ariaValueMin"], computed(attrRef(this.input, "min"), (v)=>getInputValues(this.input)?.[1]??v)); // @ts-ignore
        assign([this.internals_, "ariaValueNow"], computed(valueAsNumberRef(this.input), (v)=>getInputValues(this.input)?.[0]??v)); // @ts-ignore
        assign([this.internals_, "ariaValueText"], valueRef(this.input)); // @ts-ignore
        assign([this.internals_, "ariaOrientation"], "horizontal"); // @ts-ignore
        assign([this.internals_, "ariaLive"], "polite"); // @ts-ignore
        assign([this.internals_, "ariaRelevant"], "additions"); // @ts-ignore
        assign([this.internals_, "ariaRole"], "slider"); // @ts-ignore
    }
}

//
export default SliderInput;
