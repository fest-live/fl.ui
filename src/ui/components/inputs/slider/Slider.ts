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
import { attrRef, defineElement, H, property, valueAsNumberRef, valueRef, dragSlider, getInputValues, Q, bindWith } from "fest/lure";
import { preloadStyle, handleProperty } from "fest/dom";
import { computed, assign } from "fest/object";

//
import { UIElement } from "@fl-design/base/UIElement";

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
    @property({ source: "attr" }) name?: string = "";
    @property({ source: "attr" }) value?: string|null = null;
    @property({ source: "attr" }) min?: string = "0";
    @property({ source: "attr" }) max?: string = "100";
    @property({ source: "attr" }) step?: string = "1";
    @property({ source: "attr" }) type?: string = "range";
    @property({ source: "attr" }) disabled?: boolean = false;
    @property({ source: "attr" }) variant?: string;

    //
    static formAssociated = true;

    //
    constructor() {
        super(); // @ts-ignore
        this.internals_ = this.attachInternals();
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = ()=> H`
<div class="ui-box c2-surface" part="box">
    <div class="ui-track c2-surface" part="track"></div>
    <div class="ui-thumb c2-surface" part="thumb" style="z-index: 99;"></div>
</div>
<slot></slot>
`;

    //
    onRender() {
        super.onRender();

        // Initialize input after render
        requestAnimationFrame(() => this.initializeInput());
    }

    initializeInput() {
        const self: any = this;
        if (!self?.querySelector?.("input")) {
            const newInput = document.createElement("input");
            self?.append?.(newInput);
        }
        {
            const newInput = Q("input", self);
            newInput.type = self?.type || "range";
            newInput.value ||= self?.value || self?.min || "0";

            // Bind properties to input element
            bindWith(newInput, "value", self.getProperty("value"), handleProperty, null, true);
            bindWith(newInput, "name", self?.getProperty("name"), handleProperty);
            bindWith(newInput, "min", self?.getProperty("min"), handleProperty);
            bindWith(newInput, "max", self?.getProperty("max"), handleProperty);
            bindWith(newInput, "step", self?.getProperty("step"), handleProperty);
            bindWith(newInput, "type", self?.getProperty("type"), handleProperty);
            bindWith(newInput, "disabled", self?.getProperty("disabled"), handleProperty);
        }
    }

    //
    onInitialize() {
        super.onInitialize();

        // Set default variant based on input type
        const host = this as unknown as HTMLElement;
        if (!host.getAttribute("variant")) {
            const inputType = this.type || "range";
            host.setAttribute("variant", inputType === "checkbox" ? "switch" : "slider");
        }

        // Initialize drag functionality after input is ready
        requestAnimationFrame(() => {
            if (this.input && this.thumb && this.handle) {
                dragSlider(this.thumb, this.handle, this.input);
            }
        });

        // Set up accessibility attributes
        // @ts-ignore
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
