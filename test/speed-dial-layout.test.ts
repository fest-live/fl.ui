/*
 * Filename: speed-dial-layout.test.ts
 * FullPath: modules/projects/fl.ui/test/speed-dial-layout.test.ts
 * Change date and time: 20.45.00_28.07.2026
 * Reason for changes: Define the canonical logical-to-visual orient contract before implementation.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
    logicalToVisualCell,
    normalizeOrient,
    pointToLogicalCell,
    visualLayout,
    visualToLogicalCell
} from "../src/ui/speed-dial/layout.ts";

test("normalizes orient values to the four supported rotations", () => {
    assert.equal(normalizeOrient(0), 0);
    assert.equal(normalizeOrient(5), 1);
    assert.equal(normalizeOrient(-1), 3);
    assert.equal(normalizeOrient("landscape-primary"), 0);
});

test("swaps visible columns and rows for landscape orientations", () => {
    assert.deepEqual(visualLayout([4, 8], 0), [4, 8]);
    assert.deepEqual(visualLayout([4, 8], 1), [8, 4]);
    assert.deepEqual(visualLayout([4, 8], 2), [4, 8]);
    assert.deepEqual(visualLayout([4, 8], 3), [8, 4]);
});

test("maps every logical cell to the expected visual cell", () => {
    const layout: [number, number] = [4, 8];

    assert.deepEqual(logicalToVisualCell([1, 2], layout, 0), [1, 2]);
    assert.deepEqual(logicalToVisualCell([1, 2], layout, 1), [2, 1]);
    assert.deepEqual(logicalToVisualCell([1, 2], layout, 2), [2, 5]);
    assert.deepEqual(logicalToVisualCell([1, 2], layout, 3), [5, 1]);
});

test("visual cell mapping is reversible for all supported orientations", () => {
    const layout: [number, number] = [4, 8];

    for (const orient of [0, 1, 2, 3] as const) {
        for (let x = 0; x < layout[0]; x += 1) {
            for (let y = 0; y < layout[1]; y += 1) {
                const logical: [number, number] = [x, y];
                const visual = logicalToVisualCell(logical, layout, orient);
                assert.deepEqual(visualToLogicalCell(visual, layout, orient), logical);
            }
        }
    }
});

test("hit testing returns logical cells after orient projection", () => {
    const layout: [number, number] = [4, 8];
    const size: [number, number] = [800, 400];

    assert.deepEqual(pointToLogicalCell([700, 300], size, layout, 1), [3, 7]);
    assert.deepEqual(pointToLogicalCell([700, 300], size, layout, 3), [3, 0]);
});
