import { autoRef, assign } from "fest/object";
import { E } from "fest/lure";

//
import { RAFBehavior } from "fest/dom";
import { makeDragEvents } from "@ui/grid/Dragging";
import { reflectCell } from "@ui/grid/Reflect";

// shifting - reactive basis
export const ROOT = document.documentElement;
export const bindInteraction = async (newItem: any, pArgs: any)=>{
    await new Promise((r)=>requestAnimationFrame(r));
    reflectCell(newItem, pArgs, true);

    //
    const { item, list, items } = pArgs, layout = [pArgs?.layout?.columns || pArgs?.layout?.[0] || 4, pArgs?.layout?.rows || pArgs?.layout?.[1] || 8];
    const dragging = [ autoRef(0, RAFBehavior()), autoRef(0, RAFBehavior()) ], currentCell = [ autoRef(item?.cell?.[0] || 0), autoRef(item?.cell?.[1] || 0) ];

    //
    E(newItem, { style: {
        "--cell-x": currentCell[0],
        "--cell-y": currentCell[1],
        "--drag-x": dragging[0],
        "--drag-y": dragging[1]
    } });

    //
    assign(currentCell[0], item.cell[0], "value");
    assign(currentCell[1], item.cell[1], "value");
    makeDragEvents(newItem, {layout, currentCell, dragging}, {item, list, items});
    return currentCell;
}
