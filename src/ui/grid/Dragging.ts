import { getPropertyValue, bindDraggable, convertOrientPxToCX, getBoundingOrientRect, doAnimate, orientOf, redirectCell, setStyleProperty } from "fest/dom";
import { LongPressHandler } from "@helpers/controllers/LongPress";
import { makeShiftTrigger } from "@helpers/controllers/Trigger";

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
