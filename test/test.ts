// --- Асинхронные функции-компоненты ---

import { loadInlineStyle } from "../../dom.ts/src/$mixin$/Style";
import Icon from "../src/ui/icons/Icon"

console.log(Icon);

async function createScrollBoxed() {
    const { H } = await import("fest/lure");
    const { OverlayScrollbarMixin } = await import("../src/ui/scrollframe/ScrollFrame");
    console.log(OverlayScrollbarMixin);

    return H`
    <div class="c2-surface" data-mixin="ov-scrollbar" style="clip-path: inset(0px round 0.5%); padding: 1rem; margin: 1rem; box-sizing: border-box; overflow: scroll; display: block; inline-size: 800px; block-size: 600px; border: none 0px transparent; outline: none 0px transparent;">
        <div class="c2-surface c2-dark" style="user-select: none; font-family: Helvetica, Calibri, Carlito; border-radius: 0.5rem; padding: 0.5rem; inline-size: 100px; block-size: 1800px; display: flex; place-content: center; place-items: center;">Black Dolphin</div>
    </div>`;
}

async function createGridWithItem() {
    const { makeReactive } = await import("fest/object");
    const { H, orientRef, Q } = await import("fest/lure");
    const { bindInteraction } = await import("../src/ui/grid/GridBind");

    //
    const { UIGridBox } = await import("../src/ui/grid/GridBox");
    const { UIOrientBox } = await import("../src/ui/grid/OrientBox");
    console.log(UIGridBox, UIOrientBox);

    //
    const item = { cell: makeReactive([0, 0]) };
    const items = [item];
    const layout = makeReactive([4, 8]);
    const withItem = Q((el)=>{
        if (el) {
            const args = { layout, items, item };
            el.addEventListener("dragstart", (ev)=>{ev.preventDefault();});
            bindInteraction(el, args);
        }
    });
    const oRef = orientRef();
    return H`<div data-mixin="ui-orientbox" style="inline-size:800px; block-size:600px;" orient=${oRef}>
        <div data-mixin="ui-gridbox" style="--layout-c: 4; --layout-r: 8;">
            <div ref=${withItem} style="pointer-events: auto; border-radius: 1rem; user-select: none; background-color: black; inline-size: 6rem; block-size: 6rem;"></div>
        </div>
    </div>`;
}

async function createTimeStatus() {
    const { H } = await import("fest/lure");
    const { timeStatusRef } = await import("../src/helpers/core/Status");
    const tref = timeStatusRef();
    return H`<div class="time-format">${tref}</div>`;
}

async function createIcon() {
    const { H } = await import("fest/lure");
    return H`<ui-icon icon="github"></ui-icon>`;
}

async function createSlider() {
    const { H } = await import("fest/lure");
    const { SliderInput } = await import("../src/ui/inputs/slider/Slider");
    console.log(SliderInput);

    return H`<ui-slider style="inline-size: 100px; block-size: 1rem; border-radius: 0.5rem;">
        <input type="range" min="0" max="100" value="0">
    </ui-slider>`;
}

async function createCtxMenu() {
    const { H } = await import("fest/lure");
    const { ctxMenuTrigger } = await import("../src/helpers/core/CtxMenu");
    const ctxMenuDesc = {
        openedWith: null,
        items: [
            // ICONS in Lucide!
            [   // section 1
                { id: "new-tab", label: "New Tab", icon: "newspaper" },
                { id: "new-window", label: "New Window", icon: "app-window" },
                { id: "new-private-window", label: "New Private Tab", icon: "glasses" }
            ],
            [   // section 2
                { id: "open-link", label: "Open in New Tab", icon: "link" },
                { id: "save-link-as", label: "Save Link As", icon: "save" },
                { id: "copy-link", label: "Copy Link", icon: "copy" }
            ],
            [   // section 3 (inspect element)
                { id: "inspect-element", label: "Inspect Element", icon: "eye" }
            ]
        ]
    };
    const ctxMenu = H`<ul class="grid-rows c2-surface round-decor ctx-menu ux-anchor"></ul>`;
    ctxMenuTrigger(document.body, ctxMenuDesc, ctxMenu);
    return ctxMenu;
}

async function createLongText() {
    const { H } = await import("fest/lure");
    const { LongTextInput } = await import("../src/ui/inputs/text/Text");
    console.log(LongTextInput);

    //value="Hello, world!"
    const longText = H`<ui-longtext class="c2-surface" style="inline-size: 200px; border-radius: 0.5rem;">
        <input type="text">
    </ui-longtext>`;
    longText.value = "Hello, world!";
    return longText;
}

// --- Асинхронная инициализация ---

//@ts-ignore
import styles from "../src/scss/index.scss?inline";

//
async function main() {
    // Глобальные стили и CSS
    const { default: loadCSS } = await import("fest/dom");
    await loadCSS();
    loadInlineStyle(styles);
    const container = document.querySelector("#app") || document.body;

    // Создание и добавление компонентов
    const [
        scrollBoxed,
        gridWithItem,
        timeStatus,
        icon,
        slider,
        longText,
        ctxMenu
    ] = await Promise.all([
        createScrollBoxed(),
        createGridWithItem(),
        createTimeStatus(),
        createIcon(),
        createSlider(),
        createLongText(),
        createCtxMenu()
    ]);

    container.append(
        scrollBoxed,
        gridWithItem,
        timeStatus,
        icon,
        slider,
        longText
    );
    document.body.append(ctxMenu);
}

main();
