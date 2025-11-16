import { getPropertyValue, RAFBehavior, doAnimate, orientOf, setStyleProperty, getBoundingOrientRect } from "fest/dom";
import { makeObjectAssignable, makeReactive, subscribe, autoRef } from "fest/object";
import { LongPressHandler, makeShiftTrigger, E, bindDraggable } from "fest/lure";
import { convertOrientPxToCX, redirectCell } from "fest/core";

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
export const makeDragEvents = async (newItem, {layout, dragging, currentCell, syncDragStyles}, {item, items, list})=>{ // @ts-ignore
    const $updateLayout = (newItem)=>{
        const gridSystem = newItem?.parentElement;
        layout[0] = parseInt(getPropertyValue(gridSystem, "--layout-c")) || layout[0];
        layout[1] = parseInt(getPropertyValue(gridSystem, "--layout-r")) || layout[1];
        return layout;
    }

    //
    const getSpanOffset = (bounds, layoutSnapshot: [number, number], size: [number, number], orient: number): [number, number] => {
        const safeLayout: [number, number] = [
            Math.max(layoutSnapshot?.[0] || 0, 1),
            Math.max(layoutSnapshot?.[1] || 0, 1)
        ];
        const orientedSize: [number, number] = orient % 2 ? [size?.[1] || 1, size?.[0] || 1] : [size?.[0] || 1, size?.[1] || 1];
        const cellSize: [number, number] = [
            (orientedSize[0] || 1) / safeLayout[0],
            (orientedSize[1] || 1) / safeLayout[1]
        ];
        const spanX = Math.max((bounds?.width || cellSize[0]) / (cellSize[0] || 1), 1);
        const spanY = Math.max((bounds?.height || cellSize[1]) / (cellSize[1] || 1), 1);
        return [(spanX - 1) / 2, (spanY - 1) / 2];
    };

    const computeCellFromBounds = () => {
        const gridSystem = newItem?.parentElement as HTMLElement | null;
        if (!gridSystem) { return null; }
        const orient = orientOf(gridSystem);
        const cbox = getBoundingOrientRect(newItem, orient) ?? newItem?.getBoundingClientRect?.();
        const pbox = getBoundingOrientRect(gridSystem, orient) ?? gridSystem?.getBoundingClientRect?.();
        if (!cbox || !pbox) { return null; }
        const layoutSnapshot = [...$updateLayout(newItem)] as [number, number];
        const parentRect = gridSystem.getBoundingClientRect?.();
        const gridSize: [number, number] = [
            gridSystem?.clientWidth || gridSystem?.offsetWidth || parentRect?.width || 1,
            gridSystem?.clientHeight || gridSystem?.offsetHeight || parentRect?.height || 1
        ];
        const inset: [number, number] = [
            //(cbox.left - pbox.left),
            //(cbox.top - pbox.top)
            (((cbox.left + cbox.right) / 2) - pbox.left),
            (((cbox.top + cbox.bottom) / 2) - pbox.top)
        ];
        const args = { item, items, list, layout: layoutSnapshot as [number, number], size: gridSize };
        const spanOffset = getSpanOffset(cbox, layoutSnapshot as [number, number], gridSize, orient);
        const projected = convertOrientPxToCX(inset, args, orient);
        projected[0] -= spanOffset[0];
        projected[1] -= spanOffset[1];
        return {
            inset: [inset[0] - dragging?.[0]?.value, inset[1] - dragging?.[1]?.value],
            cell: redirectCell(clamped(projected, layoutSnapshot as [number, number]), args)
        };
    };

    //
    const setCellAxis = (cell, axis = 0)=> {
        if (currentCell?.[axis]?.value != cell?.[axis]) {
            try { currentCell[axis].value = cell[axis]; } catch(e){};
        };
    };
    const setCell = (cell)=>{
        setCellAxis(cell, 0); setCellAxis(cell, 1);
    }
    const clamped = (CXa, layout): [number, number]=>[
        Math.max(Math.min(Math.floor(CXa[0]), layout[0]-1), 0),
        Math.max(Math.min(Math.floor(CXa[1]), layout[1]-1), 0)
    ];

    //
    const syncInsetVars = (inset?: [number, number])=>{
        if (!inset) { return; }
        setStyleProperty(newItem, "--cs-inset-x", `${inset[0] || 0}px`);
        setStyleProperty(newItem, "--cs-inset-y", `${inset[1] || 0}px`);
    };

    //
    const correctOffset = (dragging)=>{
        // compute correct cell with span awareness
        const ctx = computeCellFromBounds();
        if (ctx?.cell) { setCell(ctx.cell); }
        syncInsetVars(ctx?.inset);

        //
        setStyleProperty(newItem, "--p-cell-x", currentCell[0]?.value || 0);
        setStyleProperty(newItem, "--p-cell-y", currentCell[1]?.value || 0);

        //
        setStyleProperty(newItem, "--cell-x", currentCell[0]?.value || 0);
        setStyleProperty(newItem, "--cell-y", currentCell[1]?.value || 0);

        // reset dragging offset
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        syncDragStyles?.(true);
        newItem.dataset.dragging = "";
        return [0, 0];
    };

    //
    const resolveDragging = async (dragging) => {
        // compute correct cell
        const ctx = computeCellFromBounds();
        const cell = ctx?.cell ?? [currentCell[0]?.value || 0, currentCell[1]?.value || 0];

        //
        setCell(cell);
        setStyleProperty(newItem, "--p-cell-x", currentCell[0].value);
        setStyleProperty(newItem, "--p-cell-y", currentCell[1].value);
        syncDragStyles?.(true);

        //
        newItem?.style?.setPropertyValue?.("--cell-x", cell[0]);
        newItem?.style?.setPropertyValue?.("--cell-y", cell[1]);

        //
        const animations = [
            doAnimate(newItem, "x", true),
            doAnimate(newItem, "y", true)
        ];

        //
        Promise.allSettled(animations)?.finally?.(()=>{
            delete newItem.dataset.dragging;
            newItem?.removeAttribute?.("data-dragging");
        });

        //
        try { dragging[0].value = 0, dragging[1].value = 0; } catch(e) {};
        syncDragStyles?.(true);
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
    const { item, items, list } = pArgs, layout = [pArgs?.layout?.columns || pArgs?.layout?.[0] || 4, pArgs?.layout?.rows || pArgs?.layout?.[1] || 8];
    const dragging = [ autoRef(0, RAFBehavior()), autoRef(0, RAFBehavior()) ], currentCell = [ autoRef(item?.cell?.[0] || 0), autoRef(item?.cell?.[1] || 0) ];

    //
    E(newItem, { style: {
        "--cell-x": currentCell[0],
        "--cell-y": currentCell[1]
    } });

    //
    const applyDragStyles = ()=>{
        if (dragging[0]?.value != null) setStyleProperty(newItem, "--drag-x", dragging[0]?.value || 0);
        if (dragging[1]?.value != null) setStyleProperty(newItem, "--drag-y", dragging[1]?.value || 0);
    };
    let dragStyleRaf = 0;
    const syncDragStyles = (flush = false)=>{
        if (flush) applyDragStyles(); else
        if (!dragStyleRaf) {
            applyDragStyles(); dragStyleRaf = 1;
            requestAnimationFrame(()=>dragStyleRaf = 0);
        }
    };
    subscribe(dragging[0], ()=>syncDragStyles());
    subscribe(dragging[1], ()=>syncDragStyles());
    syncDragStyles(true);

    //
    subscribe(currentCell?.[0], (idx)=>{ item.cell[0] = idx; });
    subscribe(currentCell?.[1], (idx)=>{ item.cell[1] = idx; });
    makeDragEvents(newItem, {layout, currentCell, dragging, syncDragStyles}, {item, items, list});
    return currentCell;
}
