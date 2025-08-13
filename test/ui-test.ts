import { loadInlineStyle } from "fest/dom";

async function createScrollBoxed() {
    const { H } = await import("fest/lure");
    const { OverlayScrollbarMixin } = await import("../src/ui/components/scrollframe/ScrollFrame"); //@ts-ignore

    return H`
    <div class="c2-surface" data-mixin="ov-scrollbar" style="clip-path: inset(0px round 0.5%); padding: 1rem; margin: 1rem; box-sizing: border-box; overflow: scroll; display: block; inline-size: 800px; block-size: 600px; border: none 0px transparent; outline: none 0px transparent;">
        <div class="c2-surface c2-dark" style="user-select: none; font-family: Helvetica, Calibri, Carlito; border-radius: 0.5rem; padding: 0.5rem; inline-size: 100px; block-size: 1800px; display: flex; place-content: center; place-items: center;">Black Dolphin</div>
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

    return H`<div style="display: inline-flex; gap: 1rem; align-items: center;">
        <ui-slider variant="slider" style="inline-size: 160px; block-size: 1rem; border-radius: 0.5rem;">
            <input type="range" min="0" max="100" value="35">
        </ui-slider>
        <ui-slider variant="switch" style="inline-size: 64px; block-size: 1.25rem; border-radius: 9999px;">
            <input type="checkbox" checked>
        </ui-slider>
    </div>`;
}

async function createCtxMenu() {
    const { H } = await import("fest/lure");
    const { ctxMenuTrigger } = await import("../src/helpers/core/CtxMenu");
    const { UIPhosphorIcon } = await import("../src/ui/components/icons/Icon");
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
        timeStatus,
        icon,
        slider,
        longText,
        ctxMenu
    ] = await Promise.all([
        createScrollBoxed(),
        createTimeStatus(),
        createIcon(),
        createSlider(),
        createLongText(),
        createCtxMenu()
    ]);

    container.append(
        scrollBoxed,
        timeStatus,
        icon,
        slider,
        longText
    );
    document.body.append(ctxMenu);
}

main();
