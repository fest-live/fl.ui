// @ts-ignore
import { ref, makeReactive, assign } from "u2re/object"; import { Q } from "u2re/dom"; // @ts-ignore
import { css, GLitElement, property, E, H, defineElement } from "u2re/lure";

//
import ScrollBoxed from "../src/components/scroll-frame/ScrollFrame";
import { bindInteraction } from "../src/ui/grid/GridBind";

//
console.log(ScrollBoxed);

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
/*const scb = H`
<div anchor-host="test" style="overflow: scroll; anchor-name: --test; display: block; inline-size: 800px; block-size: 600px;">
<div style="inline-size: 100px; block-size: 1200px; background-color: black;">Black Dolphin</div>
</div>
<ui-scrollframe anchor="test">
</ui-scrollframe>`*/

const scb = H`
<div data-mixin="ov-scrollbar" style="overflow: scroll; display: block; inline-size: 800px; block-size: 600px;">
<div style="inline-size: 100px; block-size: 1800px; background-color: black; color: white; display: flex; place-content: center; place-items: center;">Black Dolphin</div>
</div>`

//
document.body.append(scb);

//
const item = { cell: makeReactive([0, 0]) };
const layout = makeReactive([4, 8]);
const items = [item];

//
const withItem = Q((el)=>{
    if (el) {
        const args = { layout, items, item };
        el.addEventListener("dragstart", (ev)=>{ev.preventDefault();});
        bindInteraction(el, args);
    }
});

//
const SVO = H`<ux-grid style="inline-size:800px; block-size:600px; display: block; --layout-c: 4; --layout-r: 8;">
    <div ref=${withItem} style="user-select: none; background-color: black; inline-size: 6rem; block-size: 6rem; translate: calc(var(--drag-x, 0) * 1px) calc(var(--drag-y, 0) * 1px);"></div>
</ux-grid>`;
document.body.append(SVO);
