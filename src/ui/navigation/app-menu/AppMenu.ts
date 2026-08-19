/*
 * Filename: AppMenu.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/app-menu/AppMenu.ts
 * Change date and time: 19.00.00_19.08.2026
 * Reason for changes: Task 8 L3 — long-press drag AppMenu tiles → SpeedDial desktop.
 */
/**
 * WHY: `.env-shell-app-menu` slide-over host for launcher SKU.
 * Avoids a static import of subsystem `launcher-bridge` (fl.ui ↔ subsystem cycle) — hosts
 * resolve `com/routing/native/launcher-bridge` at runtime, or register via {@link setLauncherBridgeForAppMenu}.
 */
import { preloadStyle } from "@fest-lib/dom";
import "@fest-lib/icon";
import {
    buildLauncherAppDragEnvelope,
    isClientPointOverSpeedDial,
    pinLauncherAppEntry,
    resolveSpeedDialCellFromClientPoint,
    type LauncherAppPinPayload
} from "fl-ui/speed-dial/launcher-state";
import { showSuccess } from "fl-ui/speed-dial/toast";
import { applyLauncherIconImgUrl, createLauncherIconImgElement } from "fl-ui/speed-dial/action-registry";

// @ts-ignore — Vite inline SCSS → adopted stylesheet
import styles from "./AppMenu.scss?inline";

const styled = preloadStyle(styles);
let documentStylesApplied = false;

const LONG_PRESS_MS = 420;
const PRE_DRAG_MOVE_PX = 10;

export type LauncherAppEntry = LauncherAppPinPayload;

export type LauncherBridgeApi = {
    launcherIsDefault: () => Promise<boolean>;
    launcherRequestDefault: () => Promise<boolean>;
    launcherList: (query?: string) => Promise<LauncherAppEntry[]>;
    launcherLaunch: (pkg: string, component?: string) => Promise<boolean>;
    launcherIcon: (cacheKey: string, size?: number) => Promise<string>;
};

let registeredLauncherBridge: LauncherBridgeApi | null = null;

/** Host may inject launcher IPC when `com/routing/native/launcher-bridge` is unavailable to fl.ui. */
export function setLauncherBridgeForAppMenu(api: LauncherBridgeApi | null): void {
    registeredLauncherBridge = api;
}

/** Re-export for hosts/tests — same envelope as {@link buildLauncherAppDragEnvelope}. */
export { buildLauncherAppDragEnvelope };

/** Matches {@code BootLoader} + launcher design spec. */
export function isLauncherSku(): boolean {
    return (
        document.documentElement.dataset.cwspShellRole === "launcher" ||
        (globalThis as { __RS_SHELL_ROLE__?: string }).__RS_SHELL_ROLE__ === "launcher"
    );
}

async function resolveLauncherBridge(): Promise<LauncherBridgeApi | null> {
    if (registeredLauncherBridge) return registeredLauncherBridge;
    try {
        const mod = (await import("com/routing/native/launcher-bridge")) as LauncherBridgeApi;
        return mod;
    } catch {
        return null;
    }
}

function ensureDocumentStyles(): void {
    if (documentStylesApplied) return;
    documentStylesApplied = true;
    try {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, styled];
    } catch {
        /* adoptedStyleSheets unsupported — env-shell SCSS bridge covers layout */
    }
}

function resolveAppMenuHost(): HTMLElement {
    return (
        document.querySelector<HTMLElement>(".env-shell-root") ||
        document.querySelector<HTMLElement>("env-shell-container") ||
        document.querySelector<HTMLElement>(".env-shell-chrome")?.parentElement ||
        document.body
    );
}

type TileDragHooks = {
    onDragStart?: () => void;
};

function createDragGhost(iconPlate: HTMLElement, label: string): HTMLElement {
    const ghost = document.createElement("div");
    ghost.className = "env-shell-app-menu__drag-ghost";
    ghost.setAttribute("aria-hidden", "true");

    const ghostIcon = iconPlate.cloneNode(true) as HTMLElement;
    ghostIcon.className = "env-shell-app-menu__drag-ghost-icon";

    const ghostLabel = document.createElement("span");
    ghostLabel.className = "env-shell-app-menu__drag-ghost-label";
    ghostLabel.textContent = label;

    ghost.append(ghostIcon, ghostLabel);
    return ghost;
}

function bindLauncherAppTileDrag(
    tile: HTMLElement,
    app: LauncherAppEntry,
    iconPlate: HTMLElement,
    hooks: TileDragHooks
): void {
    const envelope = (): string => buildLauncherAppDragEnvelope(app);

    tile.draggable = true;
    tile.addEventListener("dragstart", (ev) => {
        const json = envelope();
        ev.dataTransfer?.setData("text/plain", json);
        ev.dataTransfer?.setData("application/json", json);
        if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = "copy";
            try {
                ev.dataTransfer.setDragImage(iconPlate, 24, 24);
            } catch {
                /* ignore */
            }
        }
        hooks.onDragStart?.();
    });

    let pressTimer: ReturnType<typeof setTimeout> | undefined;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let suppressClick = false;
    let ghost: HTMLElement | null = null;

    const clearPressTimer = (): void => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = undefined;
        }
    };

    const moveGhost = (clientX: number, clientY: number): void => {
        if (!ghost) return;
        ghost.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
    };

    const finishPointerDrag = (clientX: number, clientY: number): void => {
        if (!isClientPointOverSpeedDial(clientX, clientY)) return;
        const cell = resolveSpeedDialCellFromClientPoint(clientX, clientY);
        const pinned = pinLauncherAppEntry(app, cell ?? undefined);
        if (pinned) {
            showSuccess(`Pinned ${app.label} to desktop`);
            hooks.onDragStart?.();
        }
    };

    const endPointerDrag = (ev: PointerEvent): void => {
        if (!dragging) return;
        dragging = false;
        tile.classList.remove("env-shell-app-menu__tile--dragging");
        document.documentElement.toggleAttribute("data-app-menu-dragging", false);
        ghost?.remove();
        ghost = null;
        if (pointerId != null) {
            try {
                tile.releasePointerCapture(pointerId);
            } catch {
                /* ignore */
            }
            pointerId = null;
        }
        finishPointerDrag(ev.clientX, ev.clientY);
    };

    tile.addEventListener(
        "pointerdown",
        (ev) => {
            if (ev.button !== 0) return;
            clearPressTimer();
            pointerId = ev.pointerId;
            startX = ev.clientX;
            startY = ev.clientY;
            suppressClick = false;
            dragging = false;

            pressTimer = setTimeout(() => {
                pressTimer = undefined;
                dragging = true;
                suppressClick = true;
                tile.classList.add("env-shell-app-menu__tile--dragging");
                document.documentElement.toggleAttribute("data-app-menu-dragging", true);
                ghost = createDragGhost(iconPlate, app.label);
                document.body.appendChild(ghost);
                moveGhost(ev.clientX, ev.clientY);
                try {
                    tile.setPointerCapture(ev.pointerId);
                } catch {
                    /* ignore */
                }
                hooks.onDragStart?.();
            }, LONG_PRESS_MS);
        },
        { passive: true }
    );

    tile.addEventListener("pointermove", (ev) => {
        if (pressTimer && !dragging) {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (Math.hypot(dx, dy) > PRE_DRAG_MOVE_PX) {
                clearPressTimer();
            }
        }
        if (dragging) {
            moveGhost(ev.clientX, ev.clientY);
        }
    });

    tile.addEventListener("pointerup", (ev) => {
        clearPressTimer();
        if (dragging) {
            endPointerDrag(ev);
            return;
        }
    });

    tile.addEventListener("pointercancel", (ev) => {
        clearPressTimer();
        if (dragging) endPointerDrag(ev);
    });

    tile.addEventListener(
        "click",
        (ev) => {
            if (suppressClick) {
                ev.preventDefault();
                ev.stopPropagation();
                suppressClick = false;
            }
        },
        true
    );
}

function renderAppTile(
    app: LauncherAppEntry,
    bridge: LauncherBridgeApi,
    gen: number,
    refreshGen: () => number,
    hooks: TileDragHooks
): HTMLElement {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "env-shell-app-menu__tile";
    tile.setAttribute("data-package", app.packageName);
    tile.title = `${app.label} — hold and drag to desktop`;

    const iconPlate = document.createElement("span");
    iconPlate.className = "env-shell-app-menu__tile-icon";

    const label = document.createElement("span");
    label.className = "env-shell-app-menu__tile-label";
    label.textContent = app.label;

    tile.append(iconPlate, label);

    void bridge
        .launcherIcon(app.iconCacheKey || app.packageName, 64)
        .then((dataUrl) => {
            if (gen !== refreshGen()) return;
            if (!dataUrl) return;
            let img = iconPlate.querySelector<HTMLImageElement>("img[data-launcher-icon]");
            if (!img) {
                img = createLauncherIconImgElement();
                iconPlate.append(img);
            }
            applyLauncherIconImgUrl(img, dataUrl);
        })
        .catch(() => {
            /* ignore */
        });

    bindLauncherAppTileDrag(tile, app, iconPlate, hooks);

    tile.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        try {
            await bridge.launcherLaunch(app.packageName, app.componentName);
        } catch {
            /* ignore */
        }
    });

    return tile;
}

export type MountAppMenuResult = {
    element: HTMLElement;
    toggle: () => void;
    open: () => void;
    close: () => void;
    isOpen: () => boolean;
    refresh: () => Promise<void>;
    dispose: () => void;
};

/**
 * Mount `.env-shell-app-menu` beside the shell chrome. Hidden unless launcher SKU and opened.
 */
export function mountEnvironmentAppMenu(): MountAppMenuResult {
    ensureDocumentStyles();

    const root = document.createElement("div");
    root.className = "env-shell-app-menu";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "false");
    root.setAttribute("aria-label", "Apps");

    const panel = document.createElement("div");
    panel.className = "env-shell-app-menu__panel";

    const banner = document.createElement("div");
    banner.className = "env-shell-app-menu__banner";
    banner.hidden = true;

    const bannerText = document.createElement("p");
    bannerText.className = "env-shell-app-menu__banner-text";
    bannerText.textContent = "Set CWSP Launcher as Home";

    const bannerAction = document.createElement("button");
    bannerAction.type = "button";
    bannerAction.className = "env-shell-app-menu__banner-action btn";
    bannerAction.textContent = "Set as default";

    banner.append(bannerText, bannerAction);

    const search = document.createElement("input");
    search.type = "search";
    search.className = "env-shell-app-menu__search";
    search.placeholder = "Search apps";
    search.autocomplete = "off";
    search.setAttribute("aria-label", "Search apps");

    const gridHost = document.createElement("div");
    gridHost.className = "env-shell-app-menu__grid";
    gridHost.setAttribute("data-part", "grid");
    gridHost.setAttribute("aria-label", "Installed apps");

    panel.append(banner, search, gridHost);
    root.appendChild(panel);

    const host = resolveAppMenuHost();
    host.appendChild(root);

    let open = false;
    let refreshGen = 0;
    let searchQuery = "";
    let searchTimer: ReturnType<typeof setTimeout> | undefined;

    const syncVisibility = (): void => {
        if (!isLauncherSku()) {
            root.hidden = true;
            root.toggleAttribute("data-open", false);
            return;
        }
        root.hidden = !open;
        root.toggleAttribute("data-open", open);
    };

    const close = (): void => {
        if (!open) return;
        open = false;
        syncVisibility();
        root.dispatchEvent(new CustomEvent("env-app-menu-close", { bubbles: true }));
    };

    const openMenu = (): void => {
        if (!isLauncherSku()) return;
        open = true;
        syncVisibility();
        void refresh();
        root.dispatchEvent(new CustomEvent("env-app-menu-open", { bubbles: true }));
    };

    const toggle = (): void => {
        if (open) close();
        else openMenu();
    };

    const tileDragHooks: TileDragHooks = {
        onDragStart: () => {
            close();
        }
    };

    const populateGrid = async (bridge: LauncherBridgeApi, gen: number): Promise<void> => {
        let apps: LauncherAppEntry[] = [];
        try {
            apps = await bridge.launcherList(searchQuery || undefined);
        } catch {
            apps = [];
        }
        if (gen !== refreshGen) return;

        gridHost.replaceChildren();
        if (apps.length === 0) {
            const empty = document.createElement("p");
            empty.className = "env-shell-app-menu__empty";
            empty.textContent = searchQuery ? "No matching apps" : "No apps found";
            gridHost.appendChild(empty);
            return;
        }

        const frag = document.createDocumentFragment();
        for (const app of apps) {
            frag.appendChild(renderAppTile(app, bridge, gen, () => refreshGen, tileDragHooks));
        }
        gridHost.appendChild(frag);
    };

    const refresh = async (): Promise<void> => {
        const gen = ++refreshGen;
        banner.hidden = true;
        search.hidden = false;
        gridHost.hidden = false;

        if (!isLauncherSku()) {
            syncVisibility();
            return;
        }

        const bridge = await resolveLauncherBridge();
        if (gen !== refreshGen) return;

        if (!bridge?.launcherList || !bridge?.launcherLaunch || !bridge?.launcherIcon) {
            banner.hidden = false;
            bannerText.textContent = "Launcher bridge unavailable — rebuild the Capacitor APK";
            bannerAction.hidden = true;
            search.hidden = true;
            gridHost.hidden = true;
            return;
        }

        let isDefault = false;
        try {
            isDefault = await bridge.launcherIsDefault();
        } catch {
            isDefault = false;
        }
        if (gen !== refreshGen) return;

        if (!isDefault) {
            banner.hidden = false;
            bannerText.textContent = "Set CWSP Launcher as Home for full launcher integration";
            bannerAction.hidden = false;
        } else {
            banner.hidden = true;
        }

        search.hidden = false;
        gridHost.hidden = false;
        await populateGrid(bridge, gen);
    };

    search.addEventListener("input", () => {
        searchQuery = search.value.trim();
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            void refresh();
        }, 180);
    });

    bannerAction.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const bridge = await resolveLauncherBridge();
        if (!bridge) return;
        try {
            await bridge.launcherRequestDefault();
        } catch {
            /* ignore */
        }
        void refresh();
    });

    const onDocPointer = (ev: Event): void => {
        if (!open) return;
        if (document.documentElement.hasAttribute("data-app-menu-dragging")) return;
        const path =
            typeof (ev as PointerEvent).composedPath === "function"
                ? (ev as PointerEvent).composedPath()
                : [];
        for (const n of path) {
            if (n === root || n === panel) return;
            if (n instanceof Element && root.contains(n)) return;
        }
        close();
    };
    document.addEventListener("pointerdown", onDocPointer, { capture: true });

    syncVisibility();

    const dispose = (): void => {
        if (searchTimer) clearTimeout(searchTimer);
        document.documentElement.toggleAttribute("data-app-menu-dragging", false);
        document.removeEventListener("pointerdown", onDocPointer, { capture: true } as EventListenerOptions);
        root.remove();
    };

    return {
        element: root,
        toggle,
        open: openMenu,
        close,
        isOpen: () => open,
        refresh,
        dispose
    };
}
