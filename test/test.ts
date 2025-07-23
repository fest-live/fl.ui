// @ts-ignore
import { makeReactive } from "fest/object";
import { H, orientRef, Q } from "fest/lure";
import loadCSS from "fest/dom";

//
import ScrollBoxed from "../src/ui/scrollframe/ScrollFrame";
import { UIGridBox } from "../src/ui/grid/GridBox";
import { bindInteraction } from "../src/ui/grid/GridBind";
import { SliderInput } from "../src/ui/inputs/slider/Slider";
import LongTextInput from "../src/ui/inputs/text/Text";

//
import { timeStatusRef } from "../src/helpers/core/Status";

//
import Icon from "../src/ui/icons/Icon"
import { ctxMenuTrigger } from "../src/helpers/core/CtxMenu";

//
await loadCSS();

//
import "../src/scss/index.scss";

//
console.log(Icon);
console.log(ScrollBoxed);
console.log(UIGridBox);
console.log(SliderInput);
console.log(LongTextInput);

//
const scb = H`
<div class="c2-surface" data-mixin="ov-scrollbar" style="clip-path: inset(0px round 0.5%); padding: 1rem; margin: 1rem; box-sizing: border-box; overflow: scroll; display: block; inline-size: 800px; block-size: 600px; border: none 0px transparent; outline: none 0px transparent;">
<div class="c2-surface c2-dark" style="user-select: none; font-family: Helvetica, Calibri, Carlito; border-radius: 0.5rem; padding: 0.5rem; inline-size: 100px; block-size: 1800px; display: flex; place-content: center; place-items: center;">Black Dolphin</div>
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
const oRef = orientRef();

//
const SVO = H`<ui-gridbox orient=${oRef} style="margin: 1rem; inline-size:800px; block-size:600px; display: block; --layout-c: 4; --layout-r: 8;">
    <div ref=${withItem} style="pointer-events: auto; border-radius: 1rem; user-select: none; background-color: black; inline-size: 6rem; block-size: 6rem;"></div>
</ui-gridbox>`;

//
const container = document.querySelector("#app") || document.body;

//
container.append(scb);
container.append(SVO);

//
const tref = timeStatusRef();
const time = H`<div class="time-format">${tref}</div>`;
container.append(time);


//
const icon = H`<ui-icon icon="github"></ui-icon>`;
container.append(icon);

//
const slider = H`<ui-slider style="inline-size: 100px; block-size: 1rem; border-radius: 0.5rem;">
    <input type="range" min="0" max="100" value="0">
</ui-slider>`;
container.append(slider);

//
const ctxMenuDesc = {
    openedWith: null,
    items: [
        { id: "1", label: "Item 1", icon: "github" },
        { id: "2", label: "Item 2", icon: "github" },
        { id: "3", label: "Item 3", icon: "github" },
        { id: "4", label: "Item 4", icon: "github" },
        { id: "5", label: "Item 5", icon: "github" },
        { id: "6", label: "Item 6", icon: "github" },
        { id: "7", label: "Item 7", icon: "github" },
    ]
}

// TODO: add containement element (slot)
const ctxMenu = H`<ul class="grid-rows c2-surface round-decor ctx-menu ux-anchor"></ul>`;
ctxMenuTrigger(document.body, ctxMenuDesc, ctxMenu);

//
document.body.append(ctxMenu);

//
const longText = H`<ui-longtext class="c2-surface" style="inline-size: 200px; border-radius: 0.5rem;">
    <input type="text" min="0" max="100" value="0">
</ui-longtext>`;
longText.value = "Hello, world!";

//
container.append(longText);
