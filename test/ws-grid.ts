import { loadInlineStyle } from "../../dom.ts/src/$mixin$/Style";
import Icon from "../src/ui/icons/Icon"

//
console.log(Icon);

//
async function makeWallpaper() {
    const { H, orientRef } = await import("fest/lure");
    const oRef = orientRef();
    const CE = H`<canvas style="inline-size: 100%; block-size: 100%; inset: 0; position: fixed;" data-orient=${oRef} is="ui-canvas" data-src="./imgs/test.jpg"></canvas>`;
    return CE;
}

//
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

//
async function createGridWithItem() {
    const { makeReactive } = await import("fest/object");
    const { H, orientRef } = await import("fest/lure");
    const { bindInteraction } = await import("../src/ui/grid/GridBind");

    //
    const genItem = (item)=>{
        return H`<div style="" class="c2-surface layered-wrap shadow-wrap" ref=${withItem.bind(null, item)} data-id=${item.id}>
            <div data-shape="square" class="shaped c2-surface"><ui-icon style="z-index: 2;" icon="newspaper"></ui-icon></div>
        </div>`}

    //
    const item0 = { id: "item0", cell: makeReactive([0, 0]) };
    const item1 = { id: "item1", cell: makeReactive([0, 1]) };

    //
    const items = [item0, item1];
    const layout = makeReactive([4, 8]);
    const withItem = (item, el)=>{
        if (el) {
            const args = { layout, items, item };
            el.addEventListener("dragstart", (ev)=>{ev.preventDefault();});
            bindInteraction(el, args);
        }
    };

    //
    const oRef = orientRef();
    return H`<div data-mixin="ui-orientbox" style="inline-size: 100%; block-size: 100%; inset: 0; position: fixed; background-color: transparent;"  orient=${oRef}>
        <div data-mixin="ui-gridbox" style="--layout-c: 4; --layout-r: 8; color-scheme: dark;">${M(items, genItem)}</div>
    </div>`;
}

//
async function createWindowFrame() {
    const { H } = await import("fest/lure");
    const { WindowFrame } = await import("../src/ui/window/WindowFrame");
    console.log(WindowFrame);
    return H`<ui-window-frame></ui-window-frame>`;
}

//@ts-ignore
import styles from "../src/scss/index.scss?inline";
import { M } from "fest/lure";

//
async function main() {
    const { default: loadCSS } = await import("fest/dom");
    await loadCSS(); loadInlineStyle(styles);

    //
    const { colorScheme } = await import("../src/helpers/design/ImagePicker");
    const container = document.querySelector("#app") || document.body;

    //
    fetch("./imgs/test.jpg")?.then?.(async (res)=>{
        const blob = await res.blob();
        colorScheme(blob);
    });

    //
    const { UIGridBox } = await import("../src/ui/grid/GridBox");
    const { UIOrientBox } = await import("../src/ui/grid/OrientBox");
    console.log(UIGridBox, UIOrientBox); // TODO: remove

    //
    const [
        wallpaper,
        scrollBoxed,
        ctxMenu,
        windowFrame
    ] = await Promise.all([
        makeWallpaper(),
        createGridWithItem(),
        createCtxMenu(),
        createWindowFrame()
    ]);

    //
    container.append(wallpaper, scrollBoxed, ctxMenu, windowFrame);
}

//
main();
