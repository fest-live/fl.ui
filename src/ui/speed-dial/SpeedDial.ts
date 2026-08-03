/*
 * Filename: SpeedDial.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/SpeedDial.ts
 * Change date and time: 11.31.00_03.08.2026
 * Reason for changes: Port IDB wallpaper + paste/drop URL hygiene from product line.
 */

import { observe, numberRef, propRef, stringRef, affected } from "fest/object";
import { E, H, orientRef, M, provide, handleIncomingEntries } from "fest/lure";
import { pointerAnchorRef } from "fest/lure";
import { bindPointerInteraction } from "./pointer-interaction";
import {
    logicalToVisualCell,
    normalizeOrient,
    pointToLogicalCell,
    visualLayout,
    type GridCell,
    type GridLayout,
    type Orient
} from "./layout";
/* WHY: use local toast + fl-ui alias — Vite preserveSymlinks resolves via home-view/ts symlink, so ../../misc breaks. */
import { showSuccess, showError } from "./toast";
import {
    setAppWallpaperFromBlob,
    resolveAppWallpaperUrl,
    getWallpaperStoragePointer,
    WALLPAPER_IDB_MARKER
} from "fest/image";
import { openUnifiedContextMenu, type ContextMenuEntry } from "fl-ui/explorer/ContextMenu";
import {
    speedDialMeta,
    speedDialItems,
    createEmptySpeedDialItem,
    addSpeedDialItem,
    upsertSpeedDialItem,
    removeSpeedDialItem,
    persistSpeedDialItems,
    persistSpeedDialMeta,
    findSpeedDialItem,
    getSpeedDialMeta,
    ensureSpeedDialMeta,
    NAVIGATION_SHORTCUTS,
    wallpaperState,
    persistWallpaper,
    gridLayoutState,
    createSpeedDialItemFromClipboard,
    parseSpeedDialItemFromJSON,
    parseSpeedDialItemFromURL,
    resolveItemOpenLinkTarget,
    getDefaultOpenLinkTarget,
    type SpeedDialItem
} from "./launcher-state";
import { isInFocus, MOCElement } from "fest/dom";
import { openShortcutEditor } from "./ShortcutEditor";
import { setSpeedDialViewOpener, getSpeedDialViewOpener } from "./view-opener";
import { getSpeedDialActionRegistry, getSpeedDialActionLabels, getSpeedDialActionIcons } from "./action-registry";
let ctxMenuBound = false;
let persistItemsTimer: ReturnType<typeof setTimeout> | null = null;

/** Lazy-init: top-level `observe` + `pointerAnchorRef` ran during chunk eval and hit TDZ vs `com-app` (see vite-chunk-placement). */
let layoutSingleton: ReturnType<typeof observe<[number, number]>> | null = null;

function getLayout(): ReturnType<typeof observe<[number, number]>> {
    if (!layoutSingleton) {
        layoutSingleton = observe([gridLayoutState.columns ?? 4, gridLayoutState.rows ?? 8]);
        affected(gridLayoutState, () => {
            layoutSingleton![0] = gridLayoutState.columns ?? 4;
            layoutSingleton![1] = gridLayoutState.rows ?? 8;
        });
    }
    return layoutSingleton;
}

const getScreenOrient = (): Orient => {
    const type = String(globalThis.screen?.orientation?.type || "");
    if (type.includes("landscape")) return type.endsWith("secondary") ? 3 : 1;
    return type.endsWith("secondary") ? 2 : 0;
};

const getRootOrient = (root?: HTMLElement | null): Orient => {
    return normalizeOrient(root?.getAttribute("orient") ?? getScreenOrient());
};

const getGridLayout = (): GridLayout => [
    Number(gridLayoutState.columns) || 4,
    Number(gridLayoutState.rows) || 8
];

const getItemCell = (item: SpeedDialItem): GridCell => [
    Number(item.cell?.[0]) || 0,
    Number(item.cell?.[1]) || 0
];

const applyVisualCell = (el: HTMLElement, item: SpeedDialItem, root?: HTMLElement | null): void => {
    const orient = getRootOrient(root);
    const layout = getGridLayout();
    const visualCell = logicalToVisualCell(getItemCell(item), layout, orient);
    el.dataset.cellX = String(item.cell?.[0] ?? 0);
    el.dataset.cellY = String(item.cell?.[1] ?? 0);
    el.style.setProperty("--cell-column", String(visualCell[0] + 1));
    el.style.setProperty("--cell-row", String(visualCell[1] + 1));
    if (el.dataset.layer === "labels") {
        const [, visualRows] = visualLayout(layout, orient);
        /* WHY: prefer below; only flip above when caption would clip under chrome/viewport. */
        let placement: "above" | "below" = "below";
        const rootRect = root?.getBoundingClientRect();
        const itemRect = el.getBoundingClientRect();
        const labelRect = el.querySelector<HTMLElement>(".ui-ws-item-label")?.getBoundingClientRect();
        // The first ref pass can happen before the caption has a layout box.
        const labelHeight = labelRect?.height || 28;
        const nearLastRow = visualCell[1] >= visualRows - 1;
        if (rootRect && itemRect.height > 0) {
            const viewportBottom = Number(globalThis.innerHeight) || rootRect.bottom;
            const visibleTop = Math.max(rootRect.top, 0);
            const visibleBottom = Math.min(rootRect.bottom, viewportBottom);
            /* Measure from icon tile — label node may already be translated. */
            const itemId = String(item.id || "");
            let iconSibling: HTMLElement | null = null;
            root?.querySelectorAll<HTMLElement>('[data-speed-dial-item][data-layer="icons"]').forEach((node) => {
                if (!iconSibling && node.dataset.id === itemId) iconSibling = node;
            });
            const anchorRect = iconSibling?.getBoundingClientRect() || itemRect;
            const fitsBelow = anchorRect.bottom + labelHeight <= visibleBottom + 1;
            const fitsAbove = anchorRect.top - labelHeight >= visibleTop - 1;
            placement = !fitsBelow && fitsAbove ? "above" : "below";
        } else if (nearLastRow) {
            /* Cold layout: last visual row often sits above taskbar reserve — keep below. */
            placement = "below";
        }
        el.dataset.labelPlacement = placement;
    }
};

const scheduleLabelPlacementSync = (root: HTMLElement): void => {
    if (root.dataset.labelPlacementFrame === "pending") return;
    root.dataset.labelPlacementFrame = "pending";
    const sync = (): void => {
        delete root.dataset.labelPlacementFrame;
        root.querySelectorAll<HTMLElement>('[data-speed-dial-item][data-layer="labels"]').forEach((node) => {
            const item = findSpeedDialItem(node.dataset.id);
            if (item) applyVisualCell(node, item, root);
        });
    };
    if (typeof globalThis.requestAnimationFrame === "function") {
        globalThis.requestAnimationFrame(sync);
    } else {
        globalThis.setTimeout(sync, 0);
    }
};

const syncGridLayout = (root: HTMLElement): void => {
    const logicalLayout = getGridLayout();
    const orient = getRootOrient(root);
    const [columns, rows] = visualLayout(logicalLayout, orient);

    root.dataset.orient = String(orient);
    root.style.setProperty("--orient", String(orient));
    root.querySelectorAll<HTMLElement>(".speed-dial-grid").forEach((grid) => {
        grid.style.setProperty("--grid-columns", String(columns));
        grid.style.setProperty("--grid-rows", String(rows));
        grid.dataset.gridColumns = String(columns);
        grid.dataset.gridRows = String(rows);
    });
    root.querySelectorAll<HTMLElement>("[data-speed-dial-item]").forEach((node) => {
        const item = findSpeedDialItem(node.dataset.id);
        if (item) applyVisualCell(node, item, root);
    });
    scheduleLabelPlacementSync(root);
};

const bindRootOrientation = (root: HTMLElement): void => {
    if (root.dataset.orientObserverBound === "true") {
        syncGridLayout(root);
        return;
    }
    root.dataset.orientObserverBound = "true";
    const observer = new MutationObserver((records) => {
        if (records.some((record) => record.attributeName === "orient")) {
            syncGridLayout(root);
        }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["orient"] });
    const screenOrientation = globalThis.screen?.orientation;
    const onScreenOrientationChange = (): void => {
        if (!root.hasAttribute("orient")) syncGridLayout(root);
    };
    screenOrientation?.addEventListener?.("change", onScreenOrientationChange);
    affected(gridLayoutState, () => syncGridLayout(root));
    syncGridLayout(root);
    queueMicrotask(() => syncGridLayout(root));
};

const refreshRootCells = (root: HTMLElement): void => {
    root.querySelectorAll<HTMLElement>("[data-speed-dial-item]").forEach((node) => {
        const item = findSpeedDialItem(node.dataset.id);
        if (item) applyVisualCell(node, item, root);
    });
    scheduleLabelPlacementSync(root);
};

type PointerAnchorPair = ReturnType<typeof pointerAnchorRef>;
type NumberRefPair = [ReturnType<typeof numberRef>, ReturnType<typeof numberRef>];
let coordinateRefSingleton: PointerAnchorPair | NumberRefPair | null = null;

function getCoordinateRef(): PointerAnchorPair | NumberRefPair {
    if (!coordinateRefSingleton) {
        coordinateRefSingleton =
            typeof document !== "undefined" ? pointerAnchorRef() : [numberRef(0), numberRef(0)];
    }
    return coordinateRefSingleton;
}

const schedulePersistItems = () => {
    if (persistItemsTimer) clearTimeout(persistItemsTimer);
    persistItemsTimer = setTimeout(() => {
        persistItemsTimer = null;
        persistSpeedDialItems();
    }, 80);
};
const resolveItemAction = (item: SpeedDialItem, override?: string) => {
    if (override) return override;
    const entry = getSpeedDialMeta(item.id);
    return entry?.action || item?.action || "open-view";
};

const ACTION_OPTIONS = [
    { value: "open-view", label: "Open view" },
    { value: "open-link", label: "Open link" },
    { value: "copy-link", label: "Copy link" },
    { value: "copy-state-desc", label: "Copy state + desc" }
];
const DEFAULT_WALLPAPER_SRC = "/assets/wallpaper.jpg";
const WALLPAPER_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "avif"]);

const getRefValue = (ref: any, fallback = "") => {
    if (ref && typeof ref === "object" && "value" in ref) return ref.value ?? fallback;
    return ref ?? fallback;
};

const buildDescriptor = (item: SpeedDialItem) => {
    const meta = getSpeedDialMeta(item.id);
    return {
        label: getRefValue(item?.label),
        type: meta?.view || "speed-dial",
        DIR: "/",
        href: meta?.href,
        view: meta?.view,
        action: resolveItemAction(item)
    };
};

const bindCell = (el: HTMLElement, args: any): void => {
    const item = args?.item as SpeedDialItem | undefined;
    if (!item) return;
    const root = el.closest<HTMLElement>(".speed-dial-root");
    const sync = (): void => applyVisualCell(el, item, root);
    sync();
    affected([item.cell, 0], sync);
    affected([item.cell, 1], sync);
};

//
const runItemAction = (item: SpeedDialItem, actionId?: string, extras: { event?: Event; initiator?: HTMLElement } = {}, makeView?: any) => {
    const resolvedAction = resolveItemAction(item, actionId);
    const action = getSpeedDialActionRegistry().get(resolvedAction);
    if (!action) { showError("Action is unavailable"); return; }
    //const $meta = getSpeedDialMeta(item.id);
    const context = {
        id: item.id,
        items: speedDialItems,
        meta: speedDialMeta,
        action: resolvedAction,
        viewMaker: makeView
    };
    try {
        action(context as any, item, extras?.initiator);
    } catch (error) {
        console.warn(error);
        showError("Failed to run action");
    }
};

const attachItemNode = (item: SpeedDialItem, el?: HTMLElement | null, interactive = true, makeView?: any) => {
    if (!el) return;
    const args = { layout: getLayout(), items: speedDialItems, item, meta: speedDialMeta };
    const root = el.closest<HTMLElement>(".speed-dial-root")
        || el.ownerDocument?.getElementById("home");
    el.dataset.id = item.id;
    el.dataset.speedDialItem = "true";
    if (interactive) {
        el.addEventListener("dragstart", (ev)=>ev.preventDefault());
        if (!el.dataset.dragGuardBound) {
            el.dataset.dragGuardBound = "1";
            el.addEventListener("m-dragsettled", () => {
                schedulePersistItems();
            });
        }
        el.addEventListener("click", (ev)=>{
            ev?.preventDefault?.();
            const interactionState = String((el as HTMLElement)?.dataset?.interactionState || "");
            const blockedByInteraction = interactionState === "onGrab" || interactionState === "onMoving" || interactionState === "onRelax";
            if (!blockedByInteraction && !MOCElement(ev?.target as any, '[data-interaction-state="onMoving"],[data-interaction-state="onGrab"],[data-interaction-state="onRelax"]')) {
                runItemAction(item, undefined, { event: ev, initiator: el }, makeView);
            }
        });
        el.addEventListener("dblclick", (ev)=>{
            ev?.preventDefault?.();
            openItemEditor(item);
        });
    }

    if (el.dataset.layer === "labels") {
        el.style.pointerEvents = "none";
        // needs to bind cell
        bindCell(el, args);
    }
    if (el.dataset.layer === "icons") {
        const dragItem = { id: item.id, cell: getItemCell(item) };
        const bindDrag = (mountedRoot: HTMLElement | null): void => {
            if (!mountedRoot || el.dataset.pointerInteractionBound === "true") return;
            el.dataset.pointerInteractionBound = "true";
            bindPointerInteraction(el, {
                root: mountedRoot,
                item: dragItem,
                items: speedDialItems as unknown as Array<{ id: string; cell: GridCell }>,
                getLayout: getGridLayout,
                getOrient: () => getRootOrient(mountedRoot),
                onCommitCell: (cell) => {
                    dragItem.cell = [...cell];
                    item.cell[0] = cell[0];
                    item.cell[1] = cell[1];
                    refreshRootCells(mountedRoot);
                }
            });
        };
        bindDrag(root);
        if (!root) {
            queueMicrotask(() => bindDrag(
                el.closest<HTMLElement>(".speed-dial-root")
                || el.ownerDocument?.getElementById("home")
            ));
        }
        applyVisualCell(el, item, root);
    }
};

const resolveCellFromGrid = (
    grid: HTMLElement | null,
    coordinate: [number, number] | null | undefined
): GridCell => {
    if (!grid || !coordinate) return [0, 0];
    const rect = grid.getBoundingClientRect();
    const styles = getComputedStyle(grid);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const size: [number, number] = [
        Math.max(1, rect.width - paddingLeft - paddingRight),
        Math.max(1, rect.height - paddingTop - paddingBottom)
    ];
    const point: [number, number] = [
        coordinate[0] - rect.left - paddingLeft,
        coordinate[1] - rect.top - paddingTop
    ];
    return pointToLogicalCell(point, size, getGridLayout(), getRootOrient(grid.closest(".speed-dial-root")));
};

const deriveCellFromEvent = (ev?: MouseEvent): GridCell => {
    const grid = document.querySelector<HTMLElement>('#home .speed-dial-grid[data-grid-layer="icons"]')
        || document.querySelector<HTMLElement>("#home .speed-dial-grid:last-of-type")
        || document.querySelector<HTMLElement>("#home .speed-dial-grid");
    return resolveCellFromGrid(grid, ev ? [ev.clientX, ev.clientY] : null);
};

const deriveCellFromCoordinate = (coordinate: [number, number]): GridCell => {
    const grid = document.querySelector<HTMLElement>('#home .speed-dial-grid[data-grid-layer="icons"]')
        || document.querySelector<HTMLElement>("#home .speed-dial-grid:last-of-type")
        || document.querySelector<HTMLElement>("#home .speed-dial-grid");
    return resolveCellFromGrid(grid, coordinate);
};

const deriveCellFromAnchor = (): GridCell => {
    const ref = getCoordinateRef();
    return deriveCellFromCoordinate([ref[0].value, ref[1].value]);
};

const looksLikeImageFile = (file?: File | null): boolean => {
    if (!file) return false;
    const type = String(file.type || "").toLowerCase();
    if (type.startsWith("image/")) return true;
    const name = String(file.name || "").trim().toLowerCase();
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
    return WALLPAPER_EXTENSIONS.has(ext);
};

const parseUrlFromHtml = (html?: string | null): string | null => {
    const source = String(html || "").trim();
    if (!source) return null;
    const hrefMatch = source.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = String(hrefMatch?.[1] || "").trim();
    if (!href) return null;
    // WHY: relative hrefs resolve to the shell origin and create bogus tiles; require absolute http(s).
    if (!/^https?:\/\//i.test(href) && !href.startsWith("//")) return null;
    return href;
};

/** Bare host or host/path without scheme (github.com, www.youtube.com/watch?v=1). */
const BARE_HOST_PATTERN =
    /^(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:[/:?#][^\s]*)?$/i;

/**
 * Normalize a pasted/dropped URL candidate to an absolute http(s) URL.
 * WHY: users paste bare domains from messengers ("github.com") without scheme;
 * relative hrefs would resolve against the shell origin and produce junk tiles.
 * Returns the canonical href string, or null when not a usable http(s) URL.
 */
const normalizePasteUrl = (text: string): string | null => {
    const value = String(text || "").trim();
    if (!value) return null;
    try {
        const parsed = new URL(value);
        if (/^https?:$/i.test(parsed.protocol)) return parsed.href;
        return null;
    } catch {
        /* not an absolute URL — try bare-domain scheme fixup below */
    }
    if (!/\s/.test(value) && BARE_HOST_PATTERN.test(value)) {
        try {
            const parsed = new URL(`https://${value.replace(/^\/+/, "")}`);
            if (/^https?:$/i.test(parsed.protocol)) return parsed.href;
        } catch {
            /* ignore */
        }
    }
    return null;
};

const parseShortcutFromTransfer = (transfer: DataTransfer | null | undefined, suggestedCell: GridCell): SpeedDialItem | null => {
    if (!transfer) return null;
    const plain = String(transfer.getData("text/plain") || "").trim();
    const uriList = String(transfer.getData("text/uri-list") || "").trim();
    const html = String(transfer.getData("text/html") || "").trim();
    // WHY: prefer text/uri-list + plain over HTML — HTML often carries relative/site chrome links.
    for (const candidate of [uriList, plain].filter(Boolean)) {
        const normalized = normalizePasteUrl(candidate);
        if (!normalized) continue;
        const item = parseSpeedDialItemFromURL(normalized, suggestedCell);
        if (item) return item;
    }
    // Fallback: anchor href from HTML (only absolute http(s) per parseUrlFromHtml).
    const href = parseUrlFromHtml(html);
    if (href) {
        const normalized = normalizePasteUrl(href);
        if (normalized) {
            const item = parseSpeedDialItemFromURL(normalized, suggestedCell);
            if (item) return item;
        }
    }
    // Last resort: shortcut JSON envelope carried in plain text.
    if (plain) {
        const item = parseSpeedDialItemFromJSON(plain, suggestedCell);
        if (item) return item;
    }
    return null;
};

const createMenuEntryForAction = (actionId: string, item: SpeedDialItem, fallbackLabel: string = "", makeView?: any) => {
    const descriptor = buildDescriptor(item) as any;
    return {
        id: actionId,
        label: getSpeedDialActionLabels().get(actionId)?.(descriptor) || fallbackLabel,
        icon: getSpeedDialActionIcons().get(actionId) || "command",
        action: (initiator: HTMLElement, _menuItem: any, ev: MouseEvent)=>runItemAction(item, actionId, { event: ev, initiator }, makeView)
    };
};

//
export function makeWallpaper() {
    const oRef = orientRef();
    const srcRef = stringRef(DEFAULT_WALLPAPER_SRC);
    const applySrc = (paintUrl: string): void => {
        srcRef.value = paintUrl || DEFAULT_WALLPAPER_SRC;
    };
    /* WHY: custom wallpapers are IDB-backed (`idb:rs-wallpaper`); blob:/data: URLs must not be persisted to localStorage. */
    affected([wallpaperState, "src"], (s) => {
        const raw = String(s?.src || (typeof s == "string" ? s : "") || "").trim();
        if (!raw || raw === WALLPAPER_IDB_MARKER || raw.startsWith("idb:") || raw.startsWith("blob:")) {
            void resolveAppWallpaperUrl().then(applySrc).catch(() => applySrc(DEFAULT_WALLPAPER_SRC));
            return;
        }
        if (raw.startsWith("/") && !raw.startsWith("/user")) {
            /* Asset / app path — paint directly; also try OPFS under /user for user copies. */
            applySrc(raw);
            void provide("/user" + raw)
                ?.then?.((blob: Blob) => applySrc(URL.createObjectURL(blob)))
                ?.catch?.(() => { /* keep asset path */ });
            return;
        }
        void provide(raw.startsWith("/user") ? raw : "/user" + raw)
            ?.then?.((blob: Blob) => applySrc(URL.createObjectURL(blob)))
            ?.catch?.(() => {
                void resolveAppWallpaperUrl().then(applySrc).catch(() => applySrc(DEFAULT_WALLPAPER_SRC));
            });
    });
    const CE = H`<canvas slot="backdrop" style="position: absolute; pointer-events: none; min-inline-size: 0px; min-block-size: 0px; inline-size: stretch; block-size: stretch; max-block-size: stretch; max-inline-size: stretch; transform: none; scale: 1; inset: 0; pointer-events: none;" data-orient=${oRef} is="ui-canvas" data-src=${srcRef}></canvas>`;
    return CE;
}

//
const pickWallpaper = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
            /* WHY: persist bytes to IDB; localStorage only holds the marker pointer. */
            await setAppWallpaperFromBlob(file);
            wallpaperState.src = getWallpaperStoragePointer() || WALLPAPER_IDB_MARKER;
            persistWallpaper();
            showSuccess("Wallpaper updated");
        } catch (e) {
            console.warn(e);
            showError("Failed to set wallpaper");
        }
    };
    input.click();
};

//
const handleSpeedDialPaste = async (event: ClipboardEvent, suggestedCell?: GridCell) => {
    if (!isInFocus(event?.target as HTMLElement, "#home") &&
        !isInFocus(event?.target as HTMLElement, "#home:is(:hover, :focus, :focus-visible), #home:has(:hover, :focus, :focus-visible)", "child")
    ) {
        return false;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
        const targetCell = suggestedCell ?? deriveCellFromAnchor();
        const fromClipboardData = parseShortcutFromTransfer(event.clipboardData, targetCell);
        const item = fromClipboardData || await createSpeedDialItemFromClipboard(targetCell);
        if (!item) {
            return false;
        }

        addSpeedDialItem(item);
        persistSpeedDialItems();
        persistSpeedDialMeta();
        showSuccess("Shortcut created from clipboard");
        return true;
    } catch (e) {
        console.warn("Failed to paste speed dial item:", e);
        return false;
    }
};

//
const handleWallpaperDropOrPaste = (event: DragEvent | ClipboardEvent) => {
    if (isInFocus(event?.target as HTMLElement, "#home") ||
        isInFocus(event?.target as HTMLElement, "#home:is(:hover, :focus, :focus-visible), #home:has(:hover, :focus, :focus-visible)", "child")
    ) {
        const isPaste = event instanceof ClipboardEvent;
        const targetEl = event.target as HTMLElement | null;
        const droppedOnItem = !!targetEl?.closest?.("[data-speed-dial-item]");
        const suggestedCell = deriveCellFromAnchor();
        const dataTransfer = isPaste ? (event as ClipboardEvent).clipboardData : (event as DragEvent).dataTransfer;

        if (isPaste) {
            const fromTransfer = parseShortcutFromTransfer(dataTransfer, suggestedCell);
            if (fromTransfer) {
                event.preventDefault();
                event.stopPropagation();
                addSpeedDialItem(fromTransfer);
                persistSpeedDialItems();
                persistSpeedDialMeta();
                showSuccess("Shortcut created from pasted link");
                return;
            }
            void handleSpeedDialPaste(event as ClipboardEvent, suggestedCell);
        }

        if (!isPaste) {
            const parsed = parseShortcutFromTransfer(dataTransfer, suggestedCell);
            if (parsed) {
                event.preventDefault();
                event.stopPropagation();
                addSpeedDialItem(parsed);
                persistSpeedDialItems();
                persistSpeedDialMeta();
                showSuccess("Shortcut created from dropped link");
                return;
            }
        }

        event.preventDefault();
        event.stopPropagation();

        const dt = dataTransfer || ((event as any).clipboardData || (event as any).dataTransfer);
        const hasImageFile = !!Array.from((dt as DataTransfer | null)?.files || []).find((file) => looksLikeImageFile(file));
        if (!hasImageFile || droppedOnItem) {
            return;
        }
        // Defer heavy file/clipboard scanning so the UI thread can process preventDefault first.
        queueMicrotask(() => {
            handleIncomingEntries(dt, "/images/wallpaper/", null, (file, path) => {
                if (!looksLikeImageFile(file)) return;
                /* WHY: route wallpaper bytes through IDB; never persist raw blob:/data: URLs to localStorage. */
                void setAppWallpaperFromBlob(file)
                    .then(() => {
                        wallpaperState.src =
                            getWallpaperStoragePointer() || path || WALLPAPER_IDB_MARKER;
                        persistWallpaper();
                        showSuccess("Wallpaper updated");
                    })
                    .catch((err) => {
                        console.warn(err);
                        showError("Failed to set wallpaper");
                    });
            });
        });
    }
};


export function SpeedDial(makeView: any) {
    getLayout();
    getCoordinateRef();
    /*
     * WHY: HomeView often registers the opener first, then mounts via OrientDesktop without
     * re-passing makeView. Do not wipe a live opener with null — only replace when given a function.
     */
    if (typeof makeView === "function") {
        setSpeedDialViewOpener(makeView);
    }
    const columnsRef = propRef(gridLayoutState, "columns", 4);
    const rowsRef = propRef(gridLayoutState, "rows", 8);
    const shapeRef = propRef(gridLayoutState, "shape", "square");

    const tileShapeForItem = (item: SpeedDialItem): string => {
        const raw = String(getSpeedDialMeta(item.id)?.shape || "squircle").toLowerCase();
        return raw === "circle" || raw === "square" || raw === "squircle" ? raw : "squircle";
    };

    //
    const renderIconItem = (item: SpeedDialItem)=>{
        return H`<div class="ui-ws-item" data-speed-dial-item data-layer="icons" ref=${(el) => attachItemNode(item, el as HTMLElement, true, makeView)}>
            <div data-shape=${tileShapeForItem(item)} class="ui-ws-item-icon shaped">
                <ui-icon icon=${item.icon}></ui-icon>
            </div>
        </div>`;
    };

    //
    const renderLabelItem = (item: SpeedDialItem)=>{
        return H`<div style="background-color: transparent;" class="ui-ws-item" data-speed-dial-item data-layer="labels" ref=${(el) => attachItemNode(item, el as HTMLElement, false, makeView)}>
            <div class="ui-ws-item-label" style="background-color: transparent;">
                <span style="background-color: transparent;">${getRefValue(item.label)}</span>
            </div>
        </div>`;
    };

    //
    const box = H`<div slot="underlay" style="pointer-events: auto; position: relative; contain: strict; overflow: hidden; display: grid;" id="home" class="speed-dial-root" ref=${(el: HTMLElement) => bindRootOrientation(el)} on:dragover=${(ev: DragEvent) => ev.preventDefault()} on:drop=${(ev: DragEvent) => handleWallpaperDropOrPaste(ev)} prop:onPaste=${async (ev: ClipboardEvent) => await handleWallpaperDropOrPaste(ev)}>
        <div style="background-color: transparent; pointer-events: none;" class="speed-dial-grid speed-dial-label-layer speed-dial-grid--labels ui-launcher-grid" data-layer="items" data-grid-layer="labels" data-grid-columns=${columnsRef} data-grid-rows=${rowsRef} data-grid-shape=${shapeRef}>
            ${M(speedDialItems, renderLabelItem)}
        </div>
        <div style="background-color: transparent; pointer-events: none;" class="speed-dial-grid speed-dial-icon-layer speed-dial-grid--icons ui-launcher-grid" data-layer="items" data-grid-layer="icons" data-grid-columns=${columnsRef} data-grid-rows=${rowsRef} data-grid-shape=${shapeRef}>
            ${M(speedDialItems, renderIconItem)}
        </div>
    </div>`;

    //
    return box;
}

//
const openItemEditor = (item?: SpeedDialItem, opts?: {
    suggestedCell?: GridCell;
    seed?: Partial<{ label: string; icon: string; action: string; view: string; href: string; description: string }>;
})=>{
    const workingItem = item ?? createEmptySpeedDialItem(opts?.suggestedCell ?? deriveCellFromAnchor());
    const isNew = !item;
    const workingMeta = ensureSpeedDialMeta(workingItem.id);
    const seed = opts?.seed || {};
    if (isNew && seed?.action) {
        workingItem.action = seed.action;
        workingMeta.action = seed.action;
    }
    if (isNew && seed?.label) {
        workingItem.label.value = seed.label;
    }
    if (isNew && seed?.icon) {
        workingItem.icon.value = seed.icon;
    }
    if (isNew && seed?.view) {
        workingMeta.view = seed.view;
    }
    if (isNew && seed?.href) {
        workingMeta.href = seed.href;
    }
    if (isNew && seed?.description) {
        workingMeta.description = seed.description;
    }
    const draft = {
        label: String(getRefValue(workingItem.label, "New shortcut") ?? "New shortcut"),
        icon: String(getRefValue(workingItem.icon, "sparkle") ?? "sparkle"),
        action: String(resolveItemAction(workingItem) || "open-view"),
        href: String(workingMeta?.href || ""),
        view: String(workingMeta?.view || ""),
        description: String(workingMeta?.description || ""),
        shape: String(workingMeta?.shape || "squircle"),
        openLinkTarget: resolveItemOpenLinkTarget(workingMeta)
    };

    openShortcutEditor({
        mode: isNew ? "create" : "edit",
        initial: {
            label: draft.label,
            icon: draft.icon,
            action: draft.action,
            href: draft.href,
            view: draft.view,
            description: draft.description,
            shape: draft.shape,
            openLinkTarget: draft.openLinkTarget || getDefaultOpenLinkTarget()
        },
        actionOptions: ACTION_OPTIONS,
        viewOptions: [...NAVIGATION_SHORTCUTS].map((shortcut: { view: string; label: string; icon: string }) => ({
            value: String(shortcut.view || ""),
            label: String(shortcut.label || shortcut.view || "")
        })),
        registerForBackNavigation: true,
        isViewAction: (value) => value === "open-view",
        /* WHY: windowed view tiles may also carry an Open-link URL (hash / deep link). */
        isHrefAction: (value) => value === "open-link" || value === "copy-link" || value === "open-view",
        onSave: (next) => {
            workingItem.label.value = next.label;
            workingItem.icon.value = next.icon || "sparkle";
            workingItem.action = next.action || "open-view";
            workingMeta.action = workingItem.action;
            workingMeta.view = next.view;
            workingMeta.href = next.href;
            workingMeta.description = next.description;
            workingMeta.shape = next.shape;
            {
                const v = String(next.openLinkTarget || "").toLowerCase();
                workingMeta.openLinkTarget =
                    v === "native-window" || v === "native" || v === "window"
                        ? "native-window"
                        : v === "new-tab" || v === "tab" || v === "browser" || v === "browser-tab"
                          ? "new-tab"
                          : "inline";
            }
            if (isNew) {
                addSpeedDialItem(workingItem);
            } else {
                upsertSpeedDialItem(workingItem);
            }
            persistSpeedDialItems();
            persistSpeedDialMeta();
            showSuccess(isNew ? "Shortcut created" : "Shortcut updated");
        },
        onDelete: isNew
            ? undefined
            : () => {
                removeSpeedDialItem(workingItem.id);
                persistSpeedDialItems();
                persistSpeedDialMeta();
                showSuccess("Shortcut removed");
            }
    });
};

export function createCtxMenu(makeView?: any) {
    getLayout();
    getCoordinateRef();
    if (typeof makeView === "function") {
        setSpeedDialViewOpener(makeView);
    }
    if (!ctxMenuBound) {
        ctxMenuBound = true;
        document.addEventListener("contextmenu", (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            /* WHY: accept SpeedDial root / home-view host — not only `#home` (host id may be `home-view`). */
            const homeRoot =
                target?.closest?.("#home, .speed-dial-root, .env-home-workspace, [data-view='home']") ||
                null;
            if (!homeRoot) return;
            event.preventDefault();
            const targetEl = target?.closest?.("[data-speed-dial-item]");
            const itemId = targetEl?.getAttribute?.("data-id");
            const item = findSpeedDialItem(itemId);
            const guessedCell = deriveCellFromEvent(event) ?? deriveCellFromAnchor();
            const toLeaf = (entry: any): ContextMenuEntry => ({
                id: String(entry?.id || "menu-action"),
                label: String(entry?.label || "Action"),
                icon: String(entry?.icon || "command"),
                action: () => entry?.action?.(targetEl as HTMLElement, entry, event)
            });
            const openViewTask = (view: string, params: Record<string, string> = {}) => {
                const opener = getSpeedDialViewOpener() || makeView;
                if (opener) {
                    opener(view, { ...params, newTask: "1" });
                    return;
                }
                getSpeedDialActionRegistry().get(`open-view-${view}`)?.({ id: "", items: speedDialItems, meta: speedDialMeta }, {});
            };

            const menuItems: ContextMenuEntry[] = item
                ? [
                    {
                        id: "open",
                        label: "Open",
                        icon: "play",
                        action: () => runItemAction(item, undefined, { event, initiator: targetEl as HTMLElement }, getSpeedDialViewOpener() || makeView)
                    },
                    {
                        id: "actions",
                        label: "Actions",
                        icon: "dots-three",
                        action: () => {},
                        children: [
                            toLeaf(createMenuEntryForAction(resolveItemAction(item) || "open-view", item, "Run action", getSpeedDialViewOpener() || makeView)),
                            ...(getSpeedDialMeta(item.id)?.href ? [
                                toLeaf(createMenuEntryForAction("open-link", item, "Open link", getSpeedDialViewOpener() || makeView)),
                                toLeaf(createMenuEntryForAction("copy-link", item, "Copy link", getSpeedDialViewOpener() || makeView))
                            ] : []),
                            toLeaf(createMenuEntryForAction("copy-state-desc", item, "Copy shortcut JSON", getSpeedDialViewOpener() || makeView))
                        ]
                    },
                    {
                        id: "open-in",
                        label: "Open In New",
                        icon: "app-window",
                        action: () => {},
                        children: [
                            {
                                id: "open-in-regular-window",
                                label: "Regular window",
                                icon: "app-window",
                                action: () => {
                                    const targetView = String(getSpeedDialMeta(item.id)?.view || "viewer");
                                    openViewTask(targetView, { windowType: "regular" });
                                }
                            },
                            {
                                id: "open-in-tabbed-window",
                                label: "Tabbed window",
                                icon: "rows-plus-bottom",
                                action: () => {
                                    const targetView = String(getSpeedDialMeta(item.id)?.view || "viewer");
                                    openViewTask(targetView, { windowType: "tabbed" });
                                }
                            }
                        ]
                    },
                    {
                        id: "manage",
                        label: "Manage",
                        icon: "wrench",
                        action: () => {},
                        children: [
                            { id: "edit", label: "Edit Properties", icon: "pencil-simple-line", action: ()=>openItemEditor(item) },
                            {
                                id: "remove",
                                label: "Remove",
                                icon: "trash",
                                danger: true,
                                action: ()=>{
                                    removeSpeedDialItem(item.id);
                                    persistSpeedDialItems();
                                    persistSpeedDialMeta();
                                    showSuccess("Shortcut removed");
                                }
                            }
                        ]
                    }
                ]
                : [
                    {
                        id: "new",
                        label: "New",
                        icon: "plus",
                        action: () => {},
                        children: [
                            {
                                id: "create-shortcut",
                                label: "Create shortcut",
                                icon: "plus",
                                action: ()=>{
                                    openItemEditor(undefined, { suggestedCell: guessedCell });
                                }
                            },
                            {
                                id: "create-link-shortcut",
                                label: "Create link shortcut",
                                icon: "link",
                                action: ()=>{
                                    openItemEditor(undefined, {
                                        suggestedCell: guessedCell,
                                        seed: {
                                            action: "open-link",
                                            icon: "link",
                                            label: "New link",
                                            href: "",
                                            description: ""
                                        }
                                    });
                                }
                            },
                            {
                                id: "paste-shortcut",
                                label: "Paste shortcut",
                                icon: "clipboard",
                                action: async ()=>{
                                    try {
                                        const speedDialItem = await createSpeedDialItemFromClipboard(guessedCell);
                                        if (!speedDialItem) {
                                            showError("Clipboard does not contain a valid URL or shortcut JSON");
                                            return;
                                        }
                                        addSpeedDialItem(speedDialItem);
                                        persistSpeedDialItems();
                                        persistSpeedDialMeta();
                                        showSuccess("Shortcut created from clipboard");
                                    } catch (e) {
                                        console.warn(e);
                                        showError("Failed to paste shortcut");
                                    }
                                }
                            }
                        ]
                    },
                    {
                        id: "open",
                        label: "Open",
                        icon: "squares-four",
                        action: () => {},
                        children: [
                            { id: "open-explorer", label: "Explorer", icon: "books", action: ()=>{
                                getSpeedDialActionRegistry().get("open-view-explorer")?.({ id: "", items: speedDialItems, meta: speedDialMeta, viewMaker: getSpeedDialViewOpener() || makeView }, {});
                            } },
                            { id: "open-settings", label: "Settings", icon: "gear-six", action: ()=>{
                                getSpeedDialActionRegistry().get("open-view-settings")?.({ id: "", items: speedDialItems, meta: speedDialMeta, viewMaker: getSpeedDialViewOpener() || makeView }, {});
                            } },
                            {
                                id: "open-window-type",
                                label: "New Window",
                                icon: "app-window",
                                action: () => {},
                                children: [
                                    {
                                        id: "open-viewer-regular",
                                        label: "Viewer (regular)",
                                        icon: "article",
                                        action: () => openViewTask("viewer", { windowType: "regular" })
                                    },
                                    {
                                        id: "open-viewer-tabbed",
                                        label: "Viewer (tabbed)",
                                        icon: "rows-plus-bottom",
                                        action: () => openViewTask("viewer", { windowType: "tabbed" })
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "wallpaper",
                        label: "Wallpaper",
                        icon: "image",
                        action: () => {},
                        children: [
                            { id: "change-wallpaper", label: "Change wallpaper", icon: "image", action: pickWallpaper }
                        ]
                    }
                ];

            openUnifiedContextMenu({
                x: event.clientX,
                y: event.clientY,
                items: menuItems,
                compact: true
            });
        }, { capture: true });
    }

    return H`<div data-home-ctx-menu style="display:none;"></div>` as HTMLElement;
}
