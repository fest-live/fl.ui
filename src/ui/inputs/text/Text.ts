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
import { defineElement, H, property, Q, valueRef } from "fest/lure";
import { preloadStyle } from "fest/dom";

//
import { assign } from "fest/object";
import { UIElement } from "@helpers/base/UIElement";

// @ts-ignore
import styles from "@ui/inputs/text/Text.scss?inline"
const styled  = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-longtext")
export class LongTextInput extends UIElement {
    @property({ source: "query", name: "input" }) input?: HTMLInputElement;
    @property({ source: "query-shadow", name: ".box-layer" }) box?: HTMLElement;
    @property({ source: "attr", from: "input[type=\"text\"], input[type=\"number\"], input" }) name?: string;
    @property({ source: "value", from: "input[type=\"text\"], input[type=\"number\"], input", name: "value" }) value?: string = "";

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
<div class="box-layer"><slot></slot></div>
`;

    //
    onInitialize() {
        this.value = "";
        super.onInitialize(); // @ts-ignore
        assign([this.internals_, "ariaValueText"], valueRef(this.input)); // @ts-ignore
        assign([this.internals_, "ariaOrientation"], "horizontal"); // @ts-ignore
        assign([this.internals_, "ariaLive"], "polite"); // @ts-ignore
        assign([this.internals_, "ariaRelevant"], "additions"); // @ts-ignore
        assign([this.internals_, "ariaRole"], "textbox"); // @ts-ignore

        //
        const self: any = this;
        const frame: any = document.createElement("ui-scrollframe"); // @ts-ignore
        const box = self?.box || Q(".box-layer", self?.shadowRoot);
        frame?.bindWith?.(box);

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
        self.addEventListener("wheel", (ev)=>{
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
                newInput.type  = "text";
                newInput.value = self?.value || "";
                newInput.name  = self?.name  || "";
                newInput.placeholder = self?.placeholder || "";
                newInput.disabled = self?.disabled || false;
                newInput.readOnly = self?.readOnly || false;
                newInput.required = self?.required || false;
                self.append(newInput);
            }
        });
    }
}

//
export default LongTextInput;
