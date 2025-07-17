// @ts-ignore
import { ref, makeReactive, assign } from "fest/object"; import { Q } from "fest/dom"; // @ts-ignore
import { css, GLitElement, property, E, H, defineElement } from "fest/lure";
import loadCSS from "fest/dom";

//
import ScrollBoxed from "../src/ui/scrollframe/ScrollFrame";
import { UIGridBox } from "../src/ui/grid/GridBox";
import { bindInteraction } from "../src/ui/grid/GridBind";

//
import { timeStatusRef } from "../src/helpers/core/Status";
import "../src/scss/index.scss";

//
import Icon from "../src/ui/icons/Icon"

//
console.log(Icon);
console.log(ScrollBoxed);
console.log(UIGridBox);

//
loadCSS();

//
@defineElement("x-block")
export class XBlock extends GLitElement() {
    constructor(...args) { super(...args); }

    //
    @property({source: "attr"}) tetris = 1;
    @property() opacity = 1;

    //
    protected styles = function() {
        return css`:host {opacity: ${this.opacity}; display: block; }`;
    }

    //
    protected render() {
        assign(this.opacity, this.tetris);
        E(this, { style: {display: "block"}, dataset: {tetris: this.tetris} }, []);
        return H`<slot>`;
    }

    //
    protected onInitialize(): any {
        super.onInitialize?.();
        return this;
    }
}

//
const scb = H`
<div data-mixin="ov-scrollbar" style="clip-path: inset(0px round 0.5%); background-color: rgba(0,0,0, 0.1); padding: 1rem; margin: 1rem; box-sizing: border-box; overflow: scroll; display: block; inline-size: 800px; block-size: 600px; border: none 0px transparent; outline: none 0px transparent;">
<div style="user-select: none; font-family: Helvetica, Calibri, Carlito; border-radius: 0.5rem; padding: 0.5rem; inline-size: 100px; block-size: 1800px; background-color: darkred; color: white; display: flex; place-content: center; place-items: center;">Black Dolphin</div>
</div>`

//
const item = { cell: makeReactive([0, 0]) };
const items = [item];
const layout = makeReactive([4, 8]);

//
const withItem = Q((el)=>{
    if (el) {
        const args = { layout, items, item };
        el.addEventListener("dragstart", (ev)=>{ev.preventDefault();});
        bindInteraction(el, args);
    }
});

//
const SVO = H`<ui-gridbox style="margin: 1rem; inline-size:800px; block-size:600px; display: block; --layout-c: 4; --layout-r: 8;">
    <div ref=${withItem} style="pointer-events: auto; border-radius: 1rem; user-select: none; background-color: black; inline-size: 6rem; block-size: 6rem;"></div>
</ui-gridbox>`;

//
document.body.append(scb);
document.body.append(SVO);

//
const tref = timeStatusRef();
const time = H`<div class="time-format">${tref}</div>`;
document.body.append(time);


//
const icon = H`<ui-icon icon="github"></ui-icon>`;
document.body.append(icon);
