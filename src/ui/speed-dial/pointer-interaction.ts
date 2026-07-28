/*
 * Filename: pointer-interaction.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/pointer-interaction.ts
 * Change date and time: 21.20.49_28.07.2026
 * Reason for changes: Keep pointer drag and FLIP animation isolated to the icon layer.
 */

import {
    cellKey,
    findNearestFreeCell,
    pointToLogicalCell,
    type GridCell,
    type GridLayout,
    type Orient
} from "./layout";

type GridItem = {
    id: string;
    cell: GridCell;
};

type PointerInteractionOptions = {
    root: HTMLElement;
    item: GridItem;
    items: readonly GridItem[];
    getLayout: () => GridLayout;
    getOrient: () => Orient;
    onCommitCell: (cell: GridCell) => void;
    onSettled?: (cell: GridCell) => void;
};

const DRAG_THRESHOLD_PX = 6;
const SETTLE_DURATION_MS = 240;
const SETTLE_EASING = "cubic-bezier(0.22, 0.8, 0.3, 1)";

const centerOf = (rect: DOMRect): [number, number] => [
    (rect.left + rect.right) / 2,
    (rect.top + rect.bottom) / 2
];

const translate = (x: number, y: number): string => `translate3d(${x}px, ${y}px, 0)`;

const getGridContentPoint = (
    grid: HTMLElement,
    clientPoint: [number, number]
): { point: [number, number]; size: [number, number] } => {
    const rect = grid.getBoundingClientRect();
    const styles = getComputedStyle(grid);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const width = Math.max(1, rect.width - paddingLeft - paddingRight);
    const height = Math.max(1, rect.height - paddingTop - paddingBottom);

    return {
        point: [
            clientPoint[0] - rect.left - paddingLeft,
            clientPoint[1] - rect.top - paddingTop
        ],
        size: [width, height]
    };
};

const setInteractionState = (
    nodes: readonly HTMLElement[],
    state: string,
    coordinate: "source" | "intermediate" | "destination"
): void => {
    for (const node of nodes) {
        node.dataset.interactionState = state;
        node.dataset.gridCoordinateState = coordinate;
    }
};

const resetTransforms = (nodes: readonly HTMLElement[]): void => {
    for (const node of nodes) {
        node.style.removeProperty("transform");
        node.style.setProperty("--drag-x", "0px");
        node.style.setProperty("--drag-y", "0px");
        node.removeAttribute("data-dragging");
    }
};

const clearDragOffsets = (nodes: readonly HTMLElement[]): void => {
    for (const node of nodes) {
        node.style.setProperty("--drag-x", "0px");
        node.style.setProperty("--drag-y", "0px");
    }
};

const animateNodeToCell = async (
    node: HTMLElement,
    fromRect: DOMRect,
    toRect: DOMRect
): Promise<void> => {
    const [fromX, fromY] = centerOf(fromRect);
    const [toX, toY] = centerOf(toRect);
    const offsetX = fromX - toX;
    const offsetY = fromY - toY;
    const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    node.style.transition = "none";
    node.style.transform = translate(offsetX, offsetY);

    if (reducedMotion || typeof node.animate !== "function" || (Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5)) {
        node.style.removeProperty("transform");
        node.style.removeProperty("transition");
        return;
    }

    const animation = node.animate(
        [
            { transform: translate(offsetX, offsetY) },
            { transform: translate(0, 0) }
        ],
        {
            duration: SETTLE_DURATION_MS,
            easing: SETTLE_EASING,
            fill: "forwards"
        }
    );

    try {
        await animation.finished;
    } catch {
        // A new pointer interaction may cancel a running animation.
    } finally {
        animation.cancel();
        node.style.removeProperty("transform");
        node.style.removeProperty("transition");
    }
};

const occupiedCells = (items: readonly GridItem[], exceptId: string): Set<string> => {
    const occupied = new Set<string>();
    for (const entry of items) {
        if (entry.id !== exceptId) occupied.add(cellKey(entry.cell));
    }
    return occupied;
};

/**
 * Bind one launcher tile to a pointer-driven drag lifecycle.
 * The caller owns persistence and cell rendering; this controller only owns
 * pointer capture, target selection, animation, and interaction state.
 */
export const bindPointerInteraction = (
    node: HTMLElement,
    options: PointerInteractionOptions
): (() => void) => {
    let pointerId: number | null = null;
    let pointerDownAt: [number, number] | null = null;
    let grabOffset: [number, number] = [0, 0];
    let dragging = false;
    let suppressClickUntil = 0;
    let animationRun = 0;

    // Labels live in a sibling visual layer and must not inherit pointer
    // offsets or animation state from the draggable icon.
    const nodes = () => [node];

    const getDropCell = (clientPoint: [number, number]): GridCell => {
        const grid = node.closest<HTMLElement>(".speed-dial-grid");
        if (!grid) return [...options.item.cell] as GridCell;
        const { point, size } = getGridContentPoint(grid, clientPoint);
        const center = [point[0] - grabOffset[0], point[1] - grabOffset[1]] as [number, number];
        return findNearestFreeCell(
            pointToLogicalCell(center, size, options.getLayout(), options.getOrient()),
            occupiedCells(options.items, options.item.id),
            options.getLayout()
        );
    };

    const clearPointer = (): void => {
        pointerId = null;
        pointerDownAt = null;
        grabOffset = [0, 0];
    };

    const onPointerDown = (event: PointerEvent): void => {
        if (pointerId !== null || event.button !== 0) return;
        pointerId = event.pointerId;
        pointerDownAt = [event.clientX, event.clientY];
        const rect = node.getBoundingClientRect();
        const center = centerOf(rect);
        grabOffset = [event.clientX - center[0], event.clientY - center[1]];
        node.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
        if (pointerId !== event.pointerId || !pointerDownAt) return;
        const dx = event.clientX - pointerDownAt[0];
        const dy = event.clientY - pointerDownAt[1];

        if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        if (!dragging) {
            dragging = true;
            suppressClickUntil = performance.now() + SETTLE_DURATION_MS + 80;
            node.dataset.dragging = "";
            setInteractionState(nodes(), "onGrab", "source");
            node.dispatchEvent(new CustomEvent("m-dragstart", { bubbles: true }));
        }

        event.preventDefault();
        const activeNodes = nodes();
        node.style.setProperty("--drag-x", `${dx}px`);
        node.style.setProperty("--drag-y", `${dy}px`);
        setInteractionState(activeNodes, "onMoving", "intermediate");
        node.dispatchEvent(new CustomEvent("m-dragging", {
            bubbles: true,
            detail: { dx, dy, cell: [...options.item.cell] }
        }));
    };

    const finishDrag = async (event: PointerEvent): Promise<void> => {
        if (pointerId !== event.pointerId || !pointerDownAt) return;
        const wasDragging = dragging;
        dragging = false;
        node.releasePointerCapture?.(event.pointerId);
        clearPointer();
        if (!wasDragging) return;

        event.preventDefault();
        const currentNodes = nodes();
        const fromRects = new Map<HTMLElement, DOMRect>(
            currentNodes.map((entry) => [entry, entry.getBoundingClientRect()])
        );
        const targetCell = getDropCell([event.clientX, event.clientY]);
        const run = ++animationRun;

        setInteractionState(currentNodes, "onRelax", "destination");
        options.onCommitCell(targetCell);

        // Remove the pointer offset before measuring the new grid position.
        // Otherwise the destination rect includes the old drag transform and
        // the FLIP delta loses the actual pointer-to-cell movement.
        clearDragOffsets(currentNodes);
        void node.offsetWidth;
        const animations = currentNodes.map((entry) => animateNodeToCell(
            entry,
            fromRects.get(entry) || entry.getBoundingClientRect(),
            entry.getBoundingClientRect()
        ));
        await Promise.all(animations);
        if (run !== animationRun) return;

        resetTransforms(currentNodes);
        setInteractionState(currentNodes, "onPlace", "destination");
        options.onSettled?.(targetCell);
        node.dispatchEvent(new CustomEvent("m-dragsettled", {
            bubbles: true,
            detail: { cell: [...targetCell], interactionState: "onPlace", coordinateState: "destination" }
        }));

        window.setTimeout(() => {
            if (run !== animationRun) return;
            setInteractionState(nodes(), "onHover", "source");
        }, SETTLE_DURATION_MS);
    };

    const onPointerUp = (event: PointerEvent): void => {
        void finishDrag(event);
    };

    const onPointerCancel = (event: PointerEvent): void => {
        if (pointerId !== event.pointerId) return;
        animationRun += 1;
        dragging = false;
        node.releasePointerCapture?.(event.pointerId);
        resetTransforms(nodes());
        setInteractionState(nodes(), "onHover", "source");
        clearPointer();
    };

    const onClick = (event: MouseEvent): void => {
        if (performance.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerCancel);
    node.addEventListener("click", onClick, true);

    return () => {
        animationRun += 1;
        node.removeEventListener("pointerdown", onPointerDown);
        node.removeEventListener("pointermove", onPointerMove);
        node.removeEventListener("pointerup", onPointerUp);
        node.removeEventListener("pointercancel", onPointerCancel);
        node.removeEventListener("click", onClick, true);
        resetTransforms(nodes());
        clearPointer();
    };
};
