/*
 * Filename: layout.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/layout.ts
 * Change date and time: 20.47.00_28.07.2026
 * Reason for changes: Span-aware occupancy + visual span swap on odd orientations.
 */

export type GridCell = [number, number];
export type GridLayout = [number, number];
export type GridSpan = [number, number];
export type Orient = 0 | 1 | 2 | 3;

const DEFAULT_LAYOUT: GridLayout = [4, 8];

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

const positiveInteger = (value: unknown, fallback: number): number => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.max(1, Math.floor(number)) : fallback;
};

const normalizeLayout = (layout: GridLayout | readonly number[] | null | undefined): GridLayout => {
    return [
        positiveInteger(layout?.[0], DEFAULT_LAYOUT[0]),
        positiveInteger(layout?.[1], DEFAULT_LAYOUT[1])
    ];
};

/**
 * Normalize numeric orientation values without allowing invalid strings to
 * silently select a different layout.
 */
export const normalizeOrient = (value: unknown): Orient => {
    if (typeof value === "string" && !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return 0;
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return (((Math.trunc(number) % 4) + 4) % 4) as Orient;
};

/** Return the visible `[columns, rows]` for a logical grid and orientation. */
export const visualLayout = (
    layout: GridLayout | readonly number[] | null | undefined,
    orient: unknown
): GridLayout => {
    const [columns, rows] = normalizeLayout(layout);
    return normalizeOrient(orient) % 2 ? [rows, columns] : [columns, rows];
};

const clampVisualCell = (cell: GridCell, layout: GridLayout, orient: Orient): GridCell => {
    const [columns, rows] = visualLayout(layout, orient);
    return [
        clamp(Math.floor(Number(cell?.[0]) || 0), 0, columns - 1),
        clamp(Math.floor(Number(cell?.[1]) || 0), 0, rows - 1)
    ];
};

/**
 * Convert persisted logical coordinates to visible CSS-grid coordinates.
 *
 * Persisted cells always use the unrotated grid. Only this projection changes
 * when `orient` changes, so rotating the root never rewrites user state.
 */
export const logicalToVisualCell = (
    cell: GridCell,
    layout: GridLayout | readonly number[] | null | undefined,
    orient: unknown
): GridCell => {
    const [columns, rows] = normalizeLayout(layout);
    const normalizedOrient = normalizeOrient(orient);
    const x = clamp(Math.floor(Number(cell?.[0]) || 0), 0, columns - 1);
    const y = clamp(Math.floor(Number(cell?.[1]) || 0), 0, rows - 1);

    switch (normalizedOrient) {
        case 1:
            return [y, columns - 1 - x];
        case 2:
            return [columns - 1 - x, rows - 1 - y];
        case 3:
            return [rows - 1 - y, x];
        default:
            return [x, y];
    }
};

/** Convert visible CSS-grid coordinates back to persisted logical coordinates. */
export const visualToLogicalCell = (
    cell: GridCell,
    layout: GridLayout | readonly number[] | null | undefined,
    orient: unknown
): GridCell => {
    const [columns, rows] = normalizeLayout(layout);
    const normalizedOrient = normalizeOrient(orient);
    const [x, y] = clampVisualCell(cell, [columns, rows], normalizedOrient);

    switch (normalizedOrient) {
        case 1:
            return [columns - 1 - y, x];
        case 2:
            return [columns - 1 - x, rows - 1 - y];
        case 3:
            return [y, rows - 1 - x];
        default:
            return [x, y];
    }
};

/**
 * Resolve a local point in the visible grid content box to a logical cell.
 * The caller is responsible for subtracting CSS padding from the point and
 * passing the content-box size.
 */
export const pointToLogicalCell = (
    point: [number, number],
    size: [number, number],
    layout: GridLayout | readonly number[] | null | undefined,
    orient: unknown,
    mode: "floor" | "round" = "floor"
): GridCell => {
    const visible = visualLayout(layout, orient);
    const width = Math.max(1, Number(size?.[0]) || 1);
    const height = Math.max(1, Number(size?.[1]) || 1);
    const xRatio = clamp((Number(point?.[0]) || 0) / width, 0, 1);
    const yRatio = clamp((Number(point?.[1]) || 0) / height, 0, 1);
    const project = (ratio: number, count: number): number => {
        const value = ratio * count;
        return mode === "round" ? Math.round(value - 0.5) : Math.floor(value);
    };

    return visualToLogicalCell(
        [
            clamp(project(xRatio, visible[0]), 0, visible[0] - 1),
            clamp(project(yRatio, visible[1]), 0, visible[1] - 1)
        ],
        layout,
        orient
    );
};

export const cellKey = (cell: GridCell): string => `${cell[0]}:${cell[1]}`;

export const normalizeSpan = (span: GridSpan | readonly number[] | null | undefined): GridSpan => [
    Math.max(1, Math.min(8, Math.floor(Number(span?.[0]) || 1))),
    Math.max(1, Math.min(8, Math.floor(Number(span?.[1]) || 1)))
];

/** Visual span tracks swap with columns/rows on odd orientations. */
export const logicalToVisualSpan = (
    span: GridSpan | readonly number[] | null | undefined,
    orient: unknown
): GridSpan => {
    const [cols, rows] = normalizeSpan(span);
    return normalizeOrient(orient) % 2 ? [rows, cols] : [cols, rows];
};

export const cellsForSpan = (origin: GridCell, span: GridSpan | readonly number[] | null | undefined): GridCell[] => {
    const [sx, sy] = normalizeSpan(span);
    const x0 = Math.floor(Number(origin?.[0]) || 0);
    const y0 = Math.floor(Number(origin?.[1]) || 0);
    const cells: GridCell[] = [];
    for (let y = 0; y < sy; y += 1) {
        for (let x = 0; x < sx; x += 1) cells.push([x0 + x, y0 + y]);
    }
    return cells;
};

export const markOccupiedSpan = (
    occupied: Set<string>,
    origin: GridCell,
    span: GridSpan | readonly number[] | null | undefined
): void => {
    for (const cell of cellsForSpan(origin, span)) occupied.add(cellKey(cell));
};

export const spanFits = (
    origin: GridCell,
    span: GridSpan | readonly number[] | null | undefined,
    layout: GridLayout | readonly number[] | null | undefined
): boolean => {
    const [columns, rows] = normalizeLayout(layout);
    const [sx, sy] = normalizeSpan(span);
    const x = Math.floor(Number(origin?.[0]) || 0);
    const y = Math.floor(Number(origin?.[1]) || 0);
    return x >= 0 && y >= 0 && x + sx <= columns && y + sy <= rows;
};

const rectConflicts = (
    origin: GridCell,
    span: GridSpan | readonly number[] | null | undefined,
    occupied: ReadonlySet<string>
): boolean => cellsForSpan(origin, span).some((cell) => occupied.has(cellKey(cell)));

/**
 * Nearest logical origin where `span` fits and none of its cells are occupied.
 * INVARIANT: origin is the top-left of the rectangle in logical space.
 */
export const findNearestFreeRect = (
    preferred: GridCell,
    span: GridSpan | readonly number[] | null | undefined,
    occupied: ReadonlySet<string>,
    layout: GridLayout | readonly number[] | null | undefined,
    maxSearchRadius?: number
): GridCell => {
    const normalizedLayout = normalizeLayout(layout);
    const [sx, sy] = normalizeSpan(span);
    const [columns, rows] = normalizedLayout;
    const maxX = Math.max(0, columns - sx);
    const maxY = Math.max(0, rows - sy);
    const start: GridCell = [
        clamp(Math.floor(Number(preferred?.[0]) || 0), 0, maxX),
        clamp(Math.floor(Number(preferred?.[1]) || 0), 0, maxY)
    ];
    if (spanFits(start, [sx, sy], normalizedLayout) && !rectConflicts(start, [sx, sy], occupied)) {
        return start;
    }
    const maxRadius = Math.min(
        Math.max(columns, rows),
        Number.isFinite(Number(maxSearchRadius)) ? Math.max(0, Math.floor(Number(maxSearchRadius))) : Math.max(columns, rows)
    );
    for (let radius = 1; radius <= maxRadius; radius += 1) {
        for (let y = Math.max(0, start[1] - radius); y <= Math.min(maxY, start[1] + radius); y += 1) {
            for (let x = Math.max(0, start[0] - radius); x <= Math.min(maxX, start[0] + radius); x += 1) {
                if (Math.abs(x - start[0]) !== radius && Math.abs(y - start[1]) !== radius) continue;
                const candidate: GridCell = [x, y];
                if (spanFits(candidate, [sx, sy], normalizedLayout) && !rectConflicts(candidate, [sx, sy], occupied)) {
                    return candidate;
                }
            }
        }
    }
    return start;
};

/** Clamp a logical cell to the supplied grid. */
export const clampLogicalCell = (
    cell: GridCell,
    layout: GridLayout | readonly number[] | null | undefined
): GridCell => {
    const [columns, rows] = normalizeLayout(layout);
    return [
        clamp(Math.floor(Number(cell?.[0]) || 0), 0, columns - 1),
        clamp(Math.floor(Number(cell?.[1]) || 0), 0, rows - 1)
    ];
};

/**
 * Choose the closest deterministic free cell without mutating the occupied
 * set. The dragged item is excluded by the caller before invoking this helper.
 */
export const findNearestFreeCell = (
    preferred: GridCell,
    occupied: ReadonlySet<string>,
    layout: GridLayout | readonly number[] | null | undefined
): GridCell => {
    const normalizedLayout = normalizeLayout(layout);
    const start = clampLogicalCell(preferred, normalizedLayout);
    if (!occupied.has(cellKey(start))) return start;

    const [columns, rows] = normalizedLayout;
    const maxRadius = Math.max(columns, rows);
    for (let radius = 1; radius <= maxRadius; radius += 1) {
        for (let y = Math.max(0, start[1] - radius); y <= Math.min(rows - 1, start[1] + radius); y += 1) {
            for (let x = Math.max(0, start[0] - radius); x <= Math.min(columns - 1, start[0] + radius); x += 1) {
                if (Math.abs(x - start[0]) !== radius && Math.abs(y - start[1]) !== radius) continue;
                const candidate: GridCell = [x, y];
                if (!occupied.has(cellKey(candidate))) return candidate;
            }
        }
    }

    return start;
};

type CellHolder = { cell?: GridCell | { 0?: unknown; 1?: unknown } | null; id?: string };

const readCell = (item: CellHolder): GridCell => [
    Math.floor(Number(item?.cell?.[0]) || 0),
    Math.floor(Number(item?.cell?.[1]) || 0)
];

const writeCell = (item: CellHolder, cell: GridCell): boolean => {
    const prev = readCell(item);
    if (prev[0] === cell[0] && prev[1] === cell[1]) return false;
    if (!item.cell) return false;
    item.cell[0] = cell[0];
    item.cell[1] = cell[1];
    return true;
};

/**
 * Keep tiles inside a new `[columns, rows]` without stacking everyone on the
 * last track. In-bounds items keep their cells (collisions resolved); overflow
 * items take the nearest free cell.
 */
export const relocateItemsToLayout = (
    items: readonly CellHolder[],
    layout: GridLayout | readonly number[] | null | undefined,
    getSpan?: (item: CellHolder) => GridSpan | readonly number[] | null | undefined
): boolean => {
    const normalized = normalizeLayout(layout);
    const [columns, rows] = normalized;
    const inBounds: CellHolder[] = [];
    const overflow: CellHolder[] = [];
    for (const item of items) {
        if (!item?.cell) continue;
        const [x, y] = readCell(item);
        const span = normalizeSpan(getSpan?.(item));
        if (x >= 0 && y >= 0 && x + span[0] <= columns && y + span[1] <= rows) inBounds.push(item);
        else overflow.push(item);
    }

    const occupied = new Set<string>();
    let changed = false;
    const place = (item: CellHolder, preferred: GridCell): void => {
        const span = normalizeSpan(getSpan?.(item));
        const cell = findNearestFreeRect(preferred, span, occupied, normalized);
        markOccupiedSpan(occupied, cell, span);
        if (writeCell(item, cell)) changed = true;
    };

    for (const item of inBounds) place(item, readCell(item));
    for (const item of overflow) place(item, clampLogicalCell(readCell(item), normalized));
    return changed;
};
