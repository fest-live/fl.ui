/*
 * Filename: pointer-interaction.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/pointer-interaction.ts
 * Change date and time: 14.45.00_22.08.2026
 * Reason for changes: Drop ghost + nearby snap so widgets stay where the pointer puts them.
 */

import {
    findNearestFreeRect,
    logicalToVisualCell,
    logicalToVisualSpan,
    markOccupiedSpan,
    normalizeSpan,
    pointToLogicalCell,
    visualLayout,
    type GridCell,
    type GridLayout,
    type GridSpan,
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
    getSpan?: (id: string) => GridSpan | readonly number[] | null | undefined;
    onCommitCell: (cell: GridCell) => void;
    onSettled?: (cell: GridCell) => void;
};

const DRAG_THRESHOLD_PX = 6;
const SETTLE_DURATION_MS = 240;
const SETTLE_EASING = "cubic-bezier(0.22, 0.8, 0.3, 1)";
const DROP_GHOST_CLASS = "sd-drop-ghost";

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

const readCell = (cell: GridItem["cell"] | undefined): GridCell => [
    Math.floor(Number(cell?.[0]) || 0),
    Math.floor(Number(cell?.[1]) || 0)
];

const occupiedCells = (
    items: readonly GridItem[],
    exceptId: string,
    getSpan?: PointerInteractionOptions["getSpan"]
): Set<string> => {
    const occupied = new Set<string>();
    for (const entry of items) {
        if (entry.id === exceptId) continue;
        markOccupiedSpan(occupied, readCell(entry.cell), normalizeSpan(getSpan?.(entry.id)));
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
    // WHY: On touch, transformed tile center can lag; drop must prefer last move client coords.
    let lastPointerClient: [number, number] | null = null;
    let dragging = false;
    let suppressClickUntil = 0;
    let animationRun = 0;

    const relatedNodes = (): HTMLElement[] => {
        const id = node.dataset.id;
        const extra: HTMLElement[] = [];
        if (id) {
            options.root.querySelectorAll<HTMLElement>('[data-speed-dial-item][data-layer="labels"]').forEach((el) => {
                if (el.dataset.id === id && !el.closest(".speed-dial-grid--turn-ghost")) extra.push(el);
            });
        }
        return [node, ...extra];
    };

    const liveCell = (): GridCell => {
        const live = options.items.find((entry) => entry.id === options.item.id);
        return readCell(live?.cell ?? options.item.cell);
    };

    const itemSpan = (): GridSpan => normalizeSpan(options.getSpan?.(options.item.id) || [1, 1]);

    const nodes = () => relatedNodes();

    const iconGrid = (): HTMLElement | null => {
        const live = options.root.querySelector<HTMLElement>(
            ".speed-dial-grid[data-grid-layer='icons']:not(.speed-dial-grid--turn-ghost)"
        );
        const closest = node.closest<HTMLElement>(".speed-dial-grid");
        if (closest && !closest.classList.contains("speed-dial-grid--turn-ghost")) return closest;
        return live;
    };

    const getDropCell = (clientPoint: [number, number]): GridCell => {
        const grid = iconGrid();
        if (!grid) return liveCell();
        const { point, size } = getGridContentPoint(grid, clientPoint);
        const layout = options.getLayout();
        const orient = options.getOrient();
        const span = itemSpan();
        const tracked: [number, number] = [
            point[0] - grabOffset[0],
            point[1] - grabOffset[1]
        ];
        /* WHY: grab is the box center (same as icons). Persist the span origin so a
         * 2×N search tile dropped in the middle does not clamp into a corner. */
        const [spanX, spanY] = logicalToVisualSpan(span, orient);
        const [cols, rows] = visualLayout(layout, orient);
        const cellW = size[0] / Math.max(1, cols);
        const cellH = size[1] / Math.max(1, rows);
        const originPoint: [number, number] =
            spanX > 1 || spanY > 1
                ? [tracked[0] - (spanX * cellW) / 2, tracked[1] - (spanY * cellH) / 2]
                : tracked;
        /* WHY: spanned widgets must not teleport across the board; clamp nearby. */
        const searchRadius = spanX > 1 || spanY > 1 ? 2 : undefined;
        return findNearestFreeRect(
            pointToLogicalCell(originPoint, size, layout, orient, "round"),
            span,
            occupiedCells(options.items, options.item.id, options.getSpan),
            layout,
            searchRadius
        );
    };

    const paintDropGhost = (cell: GridCell): void => {
        const grid = iconGrid();
        if (!grid) return;
        let ghost = grid.querySelector<HTMLElement>(`:scope > .${DROP_GHOST_CLASS}`);
        if (!ghost) {
            ghost = document.createElement("div");
            ghost.className = DROP_GHOST_CLASS;
            ghost.setAttribute("aria-hidden", "true");
            grid.append(ghost);
        }
        const layout = options.getLayout();
        const orient = options.getOrient();
        const [vx, vy] = logicalToVisualCell(cell, layout, orient);
        const [sx, sy] = logicalToVisualSpan(itemSpan(), orient);
        ghost.style.gridColumn = `${vx + 1} / span ${sx}`;
        ghost.style.gridRow = `${vy + 1} / span ${sy}`;
        ghost.hidden = false;
    };

    const clearDropGhost = (): void => {
        iconGrid()?.querySelector(`:scope > .${DROP_GHOST_CLASS}`)?.remove();
    };

    const clearPointer = (): void => {
        pointerId = null;
        pointerDownAt = null;
        grabOffset = [0, 0];
        lastPointerClient = null;
    };

    const onPointerDown = (event: PointerEvent): void => {
        if (pointerId !== null || event.button !== 0) return;
        pointerId = event.pointerId;
        lastPointerClient = null;
        pointerDownAt = [event.clientX, event.clientY];
        options.item.cell = liveCell();
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
            for (const entry of nodes()) entry.dataset.dragging = "";
            setInteractionState(nodes(), "onGrab", "source");
            node.dispatchEvent(new CustomEvent("m-dragstart", { bubbles: true }));
        }

        event.preventDefault();
        lastPointerClient = [event.clientX, event.clientY];
        const activeNodes = nodes();
        for (const entry of activeNodes) {
            entry.style.setProperty("--drag-x", `${dx}px`);
            entry.style.setProperty("--drag-y", `${dy}px`);
        }
        setInteractionState(activeNodes, "onMoving", "intermediate");
        const hoverCell = getDropCell(lastPointerClient);
        paintDropGhost(hoverCell);
        node.dispatchEvent(new CustomEvent("m-dragging", {
            bubbles: true,
            detail: { dx, dy, cell: [...hoverCell] }
        }));
    };

    const finishDrag = async (event: PointerEvent): Promise<void> => {
        if (pointerId !== event.pointerId || !pointerDownAt) return;
        const wasDragging = dragging;
        dragging = false;
        node.releasePointerCapture?.(event.pointerId);
        // WHY: Must read lastPointerClient before clearPointer nulls it.
        const dropPoint = lastPointerClient ?? [event.clientX, event.clientY];
        clearPointer();
        if (!wasDragging) return;

        event.preventDefault();
        const currentNodes = nodes();
        const fromRects = new Map<HTMLElement, DOMRect>(
            currentNodes.map((entry) => [entry, entry.getBoundingClientRect()])
        );
        const targetCell = getDropCell(dropPoint);
        clearDropGhost();
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
        clearDropGhost();
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
