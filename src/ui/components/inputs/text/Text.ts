import { bindWith, defineElement, property, H } from "fest/lure";
import { addEvent, preloadStyle, handleProperty } from "fest/dom";
import { UIElement } from "@fl-design/base/UIElement";
import { assign } from "fest/object";

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
    #connected = Promise.withResolvers();

    //
    constructor() {
        super(); // @ts-ignore
        this.internals_ = this.attachInternals();
        this.#connected = Promise.withResolvers();
    }

    //
    onRender() {
        super.onRender();
        this.#connected.resolve(true);

        //
        const self: any = this;
        self.style.display = "grid";

        //
        const box = self?.shadowRoot?.querySelector?.(".box-layer");
        addEvent(box, "wheel", (ev) => {
            // use vertical scroll to scroll horizontally
            if (ev?.deltaY !== 0) {
                box?.scrollBy?.({
                    left: (-ev?.deltaY || 0) - (ev?.deltaX || 0),
                    behavior: "smooth"
                });
                ev?.preventDefault?.();
            }
        });

        // fix scrolling by horizontal
        requestAnimationFrame(() => {
            this.initializeInput();

            //
            const box = self?.shadowRoot?.querySelector?.(".box-layer");
            //const frame: any = document.createElement("ui-scrollframe"); // @ts-ignore
            //frame.style.zIndex = 99;
            //frame?.bindWith?.(box, self, self?.querySelector?.("input"));
        });
    }

    initializeInput() {
        const self: any = this;
        if (!self?.querySelector?.("input")) {
            const newInput = document.createElement("input");
            self?.append?.(newInput);
        }
        {
            const newInput = self?.querySelector?.("input");
            newInput.type = "text";
            newInput.value ||= self?.value;

            //
            bindWith(newInput, "value", self.getProperty("value"), handleProperty, null, true);
            bindWith(newInput, "name", self?.getProperty("name"), handleProperty);
            bindWith(newInput, "placeholder", self?.getProperty("placeholder"), handleProperty);
            bindWith(newInput, "disabled", self?.getProperty("disabled"), handleProperty);
            bindWith(newInput, "readOnly", self.getProperty("readOnly"), handleProperty);
            bindWith(newInput, "required", self.getProperty("required"), handleProperty);
        }
    }

    //
    onInitialize() {
        super.onInitialize(); // @ts-ignore
        assign([this.internals_, "ariaValueText"], this.value); // @ts-ignore
        assign([this.internals_, "ariaOrientation"], "horizontal"); // @ts-ignore
        assign([this.internals_, "ariaLive"], "polite"); // @ts-ignore
        assign([this.internals_, "ariaRelevant"], "additions"); // @ts-ignore
        assign([this.internals_, "ariaRole"], "textbox"); // @ts-ignore
    }

    //
    styles = function () { return styled?.cloneNode?.(true); }
    render = function () { return H`<div class="box-layer" part="box-layer"><slot></slot></div>`; };
}

//
export default LongTextInput;
