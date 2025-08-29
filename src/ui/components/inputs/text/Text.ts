/* **
 * @module ui/inputs/text/Text
 * @description Text input element
 * @author [@danielx](https://github.com/danielx)
 * @version 1.0.0
 * @license MIT
 * @copyright 2025
 */

/*
 * Functional Appearance: Long Text (alike input[type="text"])
 * Usable for: Text Input, Fields, Textarea
 * Differs by: Scrollable, Long-Length, Better Text Selection, Mobile Friendly
 */

//
import { bindWith, defineElement, H, property, Q, valueRef } from "fest/lure";
import { addEvent, handleProperty, preloadStyle } from "fest/dom";

//
import { assign } from "fest/object";
import { UIElement } from "@design/base/UIElement";

// @ts-ignore
import styles from "./Text.scss?inline"
const styled  = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-longtext")
export class LongTextInput extends UIElement {
    @property({ source: "query", name: "input" }) input?: HTMLInputElement;
    @property({ source: "query-shadow", name: ".box-layer" }) box?: HTMLElement;
    @property({ source: "attr" }) name?: string = "";
    @property({ source: "property" }) value?: string|null = null;
    @property({ source: "attr" }) placeholder?: string = "";
    @property({ source: "attr" }) disabled?: boolean = false;
    @property({ source: "attr" }) readOnly?: boolean = false;
    @property({ source: "attr" }) required?: boolean = false;

    //
    static formAssociated = true;

    //
    constructor() {
        super(); // @ts-ignore
        this.internals_ = this.attachInternals();
    }

    //
    styles = () => styled.cloneNode(true);
    render = ()=> H`<div class="box-layer" part="box-layer"><slot></slot></div>`;

    //
    onInitialize() {
        super.onInitialize(); // @ts-ignore
        assign([this.internals_, "ariaValueText"], this.value); // @ts-ignore
        assign([this.internals_, "ariaOrientation"], "horizontal"); // @ts-ignore
        assign([this.internals_, "ariaLive"], "polite"); // @ts-ignore
        assign([this.internals_, "ariaRelevant"], "additions"); // @ts-ignore
        assign([this.internals_, "ariaRole"], "textbox"); // @ts-ignore

        //
        const self: any = this;
        const frame: any = document.createElement("ui-scrollframe"); // @ts-ignore
        frame.style.zIndex = 99;
        const box = self?.box || Q(".box-layer", self?.shadowRoot);
        frame?.bindWith?.(box, Q("input", self));
        self.style.display = "grid";

        //
        box.style.scrollbarGutter = "auto";
        box.style.scrollbarWidth = "none";
        box.style.scrollbarColor = "transparent transparent";
        box.style.overflowBlock  = "hidden";
        box.style.overflowInline = "scroll";

        //
        self.style.overflow = "hidden";
        self.scrollbarWidth = "none";
        self.style.scrollbarColor = "transparent transparent";
        self.style.scrollbarGutter = "auto";

        //
        self?.shadowRoot?.append(frame);

        // fix scrolling by horizontal
        addEvent(self, "wheel", (ev)=>{
            // use vertical scroll to scroll horizontally
            if (ev?.deltaY !== 0) {
                ev?.preventDefault?.();
                box?.scrollBy?.({
                    left: (-ev?.deltaY || 0) + (ev?.deltaX || 0),
                    behavior: "smooth"
                });
            }
        });

        //
        requestAnimationFrame(()=>{
            if (!self?.querySelector?.("input")) {
                const newInput = document.createElement("input");
                self.append(newInput);
            }
            {
                const newInput = Q("input", self);
                newInput.type  = "text";
                newInput.value ||= self.value;

                //
                bindWith(newInput, "value", self.getProperty("value"), handleProperty, null, true);
                bindWith(newInput, "name", self.getProperty("name"), handleProperty);
                bindWith(newInput, "placeholder", self.getProperty("placeholder"), handleProperty);
                bindWith(newInput, "disabled", self.getProperty("disabled"), handleProperty);
                bindWith(newInput, "readOnly", self.getProperty("readOnly"), handleProperty);
                bindWith(newInput, "required", self.getProperty("required"), handleProperty);
            }
        });
    }
}

//
export default LongTextInput;
