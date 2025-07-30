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
        <div data-mixin="ui-gridbox" style="--layout-c: 4; --layout-r: 8;">${M(items, (item)=>{
            return H`<div class="c2-surface" ref=${withItem.bind(null, item)} style="filter: drop-shadow(0 0 0.25rem #0008); background-color: --c2-on-surface(0.0, var(--current)); padding: 1.5rem; color-scheme: dark; pointer-events: auto; border-radius: 1rem; user-select: none; inline-size: 6rem; block-size: 6rem;" data-id=${item.id}>
                <ui-icon class="c2-surface" icon="newspaper"></ui-icon>
            </div>`
        })}
        </div>
    </div>`;
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
