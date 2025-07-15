import { H, GLitElement, property, defineElement } from "fest/lure";
import { loadInlineStyle } from "fest/dom";

//
import { dragSlider } from "../input-ext/InputExt";

// @ts-ignore
import styles from "./Slider.scss?inline"
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));
const loading = fetch(preInit, {keepalive: true, cache: "force-cache", mode: "same-origin"});
const styled  = loadInlineStyle(preInit, null, "ux-layer");

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
