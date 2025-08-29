import { TaskStateReflect, colorScheme, TaskInteraction } from "fest/fl-ui";

//
import { default as loadCSS } from "fest/dom";
import { makeReactive } from "fest/object";
import { H, Q, dropFile, makeTask, makeTasks } from "fest/lure";

//
async function makeWallpaper() {
    const { H, orientRef } = await import("fest/lure");
    const oRef = orientRef();
    const CE = H`<canvas style="inline-size: 100%; block-size: 100%; inset: 0; position: fixed; pointer-events: none;" data-orient=${oRef} is="ui-canvas" data-src=${BACKGROUND_IMAGE}></canvas>`;
    return CE;
}

//
const BACKGROUND_IMAGE = "./assets/imgs/test.jpg";

//
async function createCtxMenu() {
    const { H, ctxMenuTrigger, makeTask, makeTasks } = await import("fest/lure");
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
    const { H, orientRef, M } = await import("fest/lure");
    const { bindInteraction } = await import("fest/fl-ui");

    //
    const genItem = (item)=>{
        return H`<div class="c2-surface layered-wrap shadow-wrap ui-ws-item" ref=${withItem.bind(null, item)} data-id=${item.id}>
            <div data-shape="square" class="shaped c2-surface" style="color-scheme: light;"><span><ui-icon style="z-index: 2;" icon="cross"></ui-icon></span></div>
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
    return H`<div data-mixin="ui-orientbox" style="pointer-events: none; inline-size: 100%; block-size: 100%; inset: 0; position: fixed; background-color: transparent;"  orient=${oRef}>
        <div data-mixin="ui-gridbox" style="--layout-c: 4; --layout-r: 8; color-scheme: dark;">${M(items, genItem)}</div>
    </div>`;
}

//
const tasks = makeTasks((list)=>[
    makeTask("#task1", list, {active: true}, makeReactive({ title: "Task 1", icon: "app-window" })),
    makeTask("#task0", list, {active: true}, makeReactive({ title: "Task 2", icon: "newspaper" })),
    makeTask("#task2", list, {active: true, render: ()=>H`<ui-file-manager></ui-file-manager>`}, makeReactive({ title: "Task 0", icon: "folder" }))
]);

//
async function createWindowFrame() {
    const { H, orientRef, M } = await import("fest/lure");
    const { WindowFrame, FileManager, SliderInput, LongTextInput, ScrollBoxed } = await import("fest/fl-ui");
    console.log(LongTextInput, ScrollBoxed);

    //
    const oRef = orientRef();
    return H`<div data-mixin="ui-orientbox" style="inline-size: 100%; block-size: 100%; inset: 0; position: fixed; background-color: transparent;">
        ${M(tasks, task=>{
            const frame = H`<ui-window-frame></ui-window-frame>`;
            if (task?.render) { frame.append(task?.render?.()); }
            new TaskStateReflect(frame, task);
            return frame;
        })}
    </div>`;
}

//
async function createTaskBar() {
    const { H, M } = await import("fest/lure");
    const { UITaskBar, UITask, TaskIndication } = await import("fest/fl-ui");
    const taskbar = H`<ui-taskbar class="c2-surface">${M(tasks, task=>{
        const taskEl = H`<ui-task class="c2-surface"></ui-task>`;
        new TaskIndication(taskEl, task);
        return taskEl;
    })}</ui-taskbar>`;
    new TaskInteraction(taskbar, tasks);
    return taskbar;
}

//
async function main() {
    await loadCSS();

    //
    const container = document.querySelector("#app") || document.body;

    //
    fetch(BACKGROUND_IMAGE)?.then?.(async (res)=>{
        const blob = await res.blob();
        colorScheme(blob);
    });

    //
    const [
        wallpaper,
        scrollBoxed,
        ctxMenu,
        windowFrame,
        taskBar
    ] = await Promise.all([
        makeWallpaper(),
        createGridWithItem(),
        createCtxMenu(),
        createWindowFrame(),
        createTaskBar()
    ]);

    //
    container.append(wallpaper, scrollBoxed, ctxMenu, windowFrame, taskBar);

    //
    Q("#app", document.documentElement)?.addEventListener?.("dragover", (event: any)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });
    Q("#app", document.documentElement)?.addEventListener?.("drop", (event: any)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            console.log(file);
            if (file) { dropFile(file, "/user/images/"); }
        }
    });
}

//
main();
