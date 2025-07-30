import { loadInlineStyle } from "../../dom.ts/src/$mixin$/Style";
import Icon from "../src/ui/icons/Icon"

//
console.log(Icon);

//
async function makeWallpaper() {
    const { H, orientRef, Q } = await import("fest/lure");
    const oRef = orientRef();
    const CE = H`<canvas style="inline-size: 100%; block-size: 100%; inset: 0; position: fixed;" data-orient=${oRef} is="ui-canvas" data-src="./imgs/test.jpg"></canvas>`;
    return CE;
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

//
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
    return H`<div data-mixin="ui-orientbox" style="inline-size: 100%; block-size: 100%; inset: 0; position: fixed; background-color: transparent;"  orient=${oRef}>
        <div data-mixin="ui-gridbox" style="--layout-c: 4; --layout-r: 8;">
            <div ref=${withItem} style="pointer-events: auto; border-radius: 1rem; user-select: none; background-color: black; inline-size: 6rem; block-size: 6rem;"></div>
        </div>
    </div>`;
}

//@ts-ignore
import styles from "../src/scss/index.scss?inline";

//
async function main() {
    // Глобальные стили и CSS
    const { default: loadCSS } = await import("fest/dom");
    const { colorScheme } = await import("../src/helpers/design/ImagePicker");
    await loadCSS(); loadInlineStyle(styles);
    const container = document.querySelector("#app") || document.body;

    //
    fetch("./imgs/test.jpg")?.then?.(async (res)=>{
        const blob = await res.blob();
        colorScheme(blob);
    });

    //
    const [
        wallpaper,
        scrollBoxed,
        ctxMenu
    ] = await Promise.all([
        makeWallpaper(),
        createGridWithItem(),
        createCtxMenu()
    ]);

    //
    container.append(wallpaper, scrollBoxed, ctxMenu);
}

//
main();
