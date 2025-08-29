import { getPropertyValue, bindDraggable, convertOrientPxToCX, getBoundingOrientRect, RAFBehavior, doAnimate, orientOf, redirectCell, setStyleProperty } from "fest/dom";
import { makeObjectAssignable, makeReactive, subscribe, autoRef } from "fest/object";
import { LongPressHandler, makeShiftTrigger, E } from "fest/lure";

//
export const reflectCell = async (newItem: any, pArgs: any, withAnimate = false)=>{ // @ts-ignore
    const layout = [pArgs?.layout?.columns || pArgs?.layout?.[0] || 4, pArgs?.layout?.rows || pArgs?.layout?.[1] || 8];
    const {item, list, items} = pArgs;
    await new Promise((r)=>requestAnimationFrame(r));
    return subscribe?.(item, (state, property)=>{
        const gridSystem = newItem?.parentElement;
        layout[0] = parseInt(gridSystem?.style?.getPropertyValue?.("--layout-c")) || layout[0];
        layout[1] = parseInt(gridSystem?.style?.getPropertyValue?.("--layout-r")) || layout[1];
        const args = {item, list, items, layout, size: [gridSystem?.clientWidth, gridSystem?.clientHeight]};
        if (item && !item?.cell) { item.cell = makeObjectAssignable(makeReactive([0, 0])); }; // @ts-ignore
        if (item && args) { const nc = redirectCell(item?.cell, args);
        if (nc[0] != item?.cell?.[0] || nc[1] != item?.cell?.[1]) { item.cell = nc; } }; // @ts-ignore
        if (property == "cell") { redirectCell(item?.cell, args); }
    });
}

//
export const makeDragEvents = async (newItem, {layout, dragging, currentCell}, {item, items})=>{ // @ts-ignore
    const $updateLayout = (newItem)=>{
        const gridSystem = newItem?.parentElement;
        layout[0] = parseInt(getPropertyValue(gridSystem, "--layout-c")) || layout[0];
        layout[1] = parseInt(getPropertyValue(gridSystem, "--layout-r")) || layout[1];
        return layout;
    }

    //
    const setCellAxis = (cell, axis = 0)=> { if (currentCell?.[axis]?.value != cell?.[axis]) { try { currentCell[axis].value = cell[axis]; } catch(e){}; }; };
    const setCell = (cell)=>{ setCellAxis(cell, 0); setCellAxis(cell, 1); }
    const clamped = (CXa, layout): [number, number]=>[
        Math.max(Math.min(Math.floor(CXa[0]), layout[0]-1), 0),
        Math.max(Math.min(Math.floor(CXa[1]), layout[1]-1), 0)
    ];

    //
    const correctOffset = (dragging)=>{
        const gridSystem = newItem?.parentElement;
        const cbox = getBoundingOrientRect(newItem) || newItem?.getBoundingClientRect?.();
        const pbox = getBoundingOrientRect(gridSystem) || gridSystem?.getBoundingClientRect?.();
        const rel: [number, number] = [(cbox.left + cbox.right)/2 - pbox.left, (cbox.top + cbox.bottom)/2 - pbox.top];

        // compute correct cell
        const args = {layout: $updateLayout(newItem), item, items, size: [gridSystem?.clientWidth, gridSystem?.clientHeight]}; // @ts-ignore
        setCell(redirectCell(clamped(convertOrientPxToCX(rel, args, orientOf(gridSystem)), layout), args));

        //
        newItem.dataset.dragging = "";
        setStyleProperty(newItem, "--p-cell-x", parseInt(getPropertyValue(newItem, "--cell-x")) || 0);
        setStyleProperty(newItem, "--p-cell-y", parseInt(getPropertyValue(newItem, "--cell-y")) || 0);

        // reset dragging offset
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        return [0, 0];
    };

    //
    const resolveDragging = (dragging) => {
        const gridSystem = newItem?.parentElement;
        const cbox = getBoundingOrientRect(newItem) || newItem?.getBoundingClientRect?.();
        const pbox = getBoundingOrientRect?.(gridSystem) || gridSystem?.getBoundingClientRect?.();
        const rel : [number, number] = [(cbox.left + cbox.right)/2 - pbox.left, (cbox.top + cbox.bottom)/2 - pbox.top];

        // compute correct cell
        const args = {item, items, layout: $updateLayout(newItem), size: [gridSystem?.clientWidth, gridSystem?.clientHeight]}; // @ts-ignore
        const cell = redirectCell(clamped(convertOrientPxToCX(rel, args, orientOf(gridSystem)), layout), args);

        // set cell position and animate
        doAnimate(newItem, cell[0], "x", true); setCellAxis(cell, 0);
        doAnimate(newItem, cell[1], "y", true); setCellAxis(cell, 1);

        // unflag element dragging status
        delete newItem.dataset.dragging;

        // reset dragging coordinate
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
    };

    //
    const customTrigger = (doGrab)=>new LongPressHandler(newItem, {
        handler: "*",
        anyPointer: true,
        mouseImmediate: true,
        minHoldTime: 60 * 3600,
        maxHoldTime: 100
    }, makeShiftTrigger((ev)=>{correctOffset(dragging); doGrab?.(ev, newItem)}));

    //
    return bindDraggable(customTrigger, resolveDragging, dragging);
};

// shifting - reactive basis
export const ROOT = document.documentElement;
export const bindInteraction = async (newItem: any, pArgs: any)=>{
    await new Promise((r)=>requestAnimationFrame(r));
    reflectCell(newItem, pArgs, true);

    //
    const { item, items } = pArgs, layout = [pArgs?.layout?.columns || pArgs?.layout?.[0] || 4, pArgs?.layout?.rows || pArgs?.layout?.[1] || 8];
    const dragging = [ autoRef(0, RAFBehavior()), autoRef(0, RAFBehavior()) ], currentCell = [ autoRef(item?.cell?.[0] || 0), autoRef(item?.cell?.[1] || 0) ];

    //
    E(newItem, { style: {
        "--cell-x": currentCell[0],
        "--cell-y": currentCell[1],
        "--drag-x": dragging[0],
        "--drag-y": dragging[1]
    } });

    //
    subscribe(currentCell?.[0], (idx)=>{ item.cell[0] = idx; });
    subscribe(currentCell?.[1], (idx)=>{ item.cell[1] = idx; });
    makeDragEvents(newItem, {layout, currentCell, dragging}, {item, items});
    return currentCell;
}
