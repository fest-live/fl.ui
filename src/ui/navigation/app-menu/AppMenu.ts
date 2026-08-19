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
import {
    applyLauncherIconToUiIcon,
    createLauncherUiIconElement,
    ensureLauncherIconObjectUrl,
    getCachedLauncherIconObjectUrl,
} from "fl-ui/speed-dial/action-registry";
import { openUnifiedContextMenu } from "fl-ui/explorer/ContextMenu";
import {
    applyBookmarkIconToPlate,
    createChromeBookmarksMenuApi,
    hasBookmarksMenuApi,
    isBookmarkPinnedToStart,
    placeBookmarkOnDesktop,
    pinBookmarkToStart,
    pushRecentBookmark,
    readPinnedBookmarks,
    readRecentBookmarks,
    resolveBookmarkDesktopIconUrl,
    resolveBookmarksMenuApi,
    setBookmarksMenuApi,
    unpinBookmarkFromStart,
    type BookmarkMenuEntry,
    type BookmarksMenuApi,
} from "./bookmarks-menu";

// @ts-ignore — Vite inline SCSS → adopted stylesheet
import styles from "./AppMenu.scss?inline";

export {
    setBookmarksMenuApi,
    createChromeBookmarksMenuApi,
    hasBookmarksMenuApi,
    type BookmarkMenuEntry,
    type BookmarksMenuApi,
};

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

/** App Menu mounts for Android launcher SKU or CRX bookmarks Start. */
export function isAppMenuEnabled(): boolean {
    return isLauncherSku() || hasBookmarksMenuApi();
}

export type AppMenuMode = "launcher" | "bookmarks";

export function resolveAppMenuMode(): AppMenuMode | null {
    if (isLauncherSku()) return "launcher";
    if (hasBookmarksMenuApi()) return "bookmarks";
    return null;
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
    onStartPinsChanged?: () => void;
};

function createDragGhost(iconPlate: HTMLElement, label: string): HTMLElement {
    const ghost = document.createElement("div");
    ghost.className = "env-shell-app-menu__drag-ghost";
    ghost.setAttribute("aria-hidden", "true");

    const ghostIcon = iconPlate.cloneNode(true) as HTMLElement;
    ghostIcon.className = "env-shell-app-menu__drag-ghost-icon ui-ws-item-icon shaped";
    ghostIcon.setAttribute("data-shape", "squircle");

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
    tile.title = `${app.label} — right-click: desktop; hold and drag`;

    const iconPlate = document.createElement("span");
    iconPlate.className = "env-shell-app-menu__tile-icon ui-ws-item-icon shaped";
    iconPlate.setAttribute("data-shape", "squircle");

    const label = document.createElement("span");
    label.className = "env-shell-app-menu__tile-label";
    label.textContent = app.label;

    tile.append(iconPlate, label);

    const cacheKey = app.iconCacheKey || app.packageName;
    const cached = getCachedLauncherIconObjectUrl(cacheKey);
    if (cached) {
        const icon = createLauncherUiIconElement();
        applyLauncherIconToUiIcon(icon, cached);
        iconPlate.append(icon);
    }

    void ensureLauncherIconObjectUrl(cacheKey, 96)
        .then((objectUrl) => {
            if (gen !== refreshGen()) return;
            if (!objectUrl) return;
            let icon = iconPlate.querySelector<HTMLElement>("ui-icon[data-launcher-icon]");
            if (!icon) {
                icon = createLauncherUiIconElement();
                iconPlate.textContent = "";
                iconPlate.append(icon);
            }
            applyLauncherIconToUiIcon(icon, objectUrl);
        })
        .catch(() => {
            /* ignore */
        });

    bindLauncherAppTileDrag(tile, app, iconPlate, hooks);

    tile.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openUnifiedContextMenu({
            x: ev.clientX,
            y: ev.clientY,
            compact: true,
            items: [
                {
                    id: "place-desktop",
                    label: "Place on desktop",
                    icon: "desktop",
                    action: () => {
                        const pinned = pinLauncherAppEntry(app);
                        if (pinned) {
                            showSuccess(`Placed “${app.label}” on desktop`);
                            hooks.onDragStart?.();
                        }
                    }
                },
                {
                    id: "launch",
                    label: "Open",
                    icon: "arrow-square-out",
                    action: async () => {
                        try {
                            await bridge.launcherLaunch(app.packageName, app.componentName);
                        } catch {
                            /* ignore */
                        }
                    }
                }
            ]
        });
    });

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

function bindBookmarkTileDrag(
    tile: HTMLElement,
    entry: BookmarkMenuEntry,
    iconPlate: HTMLElement,
    iconUrl: { current: string },
    hooks: TileDragHooks
): void {
    if (entry.folder || !String(entry.url || "").trim()) return;

    let pressTimer: ReturnType<typeof setTimeout> | undefined;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let pointerId = -1;
    let ghost: HTMLElement | null = null;

    const clearPress = (): void => {
        if (pressTimer != null) {
            clearTimeout(pressTimer);
            pressTimer = undefined;
        }
    };

    const endDrag = (clientX: number, clientY: number): void => {
        clearPress();
        if (!dragging) return;
        dragging = false;
        tile.classList.remove("env-shell-app-menu__tile--dragging");
        document.documentElement.toggleAttribute("data-app-menu-dragging", false);
        ghost?.remove();
        ghost = null;
        try {
            tile.releasePointerCapture?.(pointerId);
        } catch {
            /* ignore */
        }
        if (isClientPointOverSpeedDial(clientX, clientY)) {
            const cell = resolveSpeedDialCellFromClientPoint(clientX, clientY) ?? undefined;
            const paint =
                String(iconUrl.current || "").trim() ||
                resolveBookmarkDesktopIconUrl(entry, resolveBookmarksMenuApi());
            const pinned = placeBookmarkOnDesktop(entry, cell, resolveBookmarksMenuApi(), paint);
            if (pinned) {
                showSuccess(`Placed “${entry.title}” on desktop`);
                hooks.onDragStart?.();
            }
        }
    };

    tile.addEventListener("pointerdown", (ev) => {
        if (ev.button != null && ev.button !== 0) return;
        startX = ev.clientX;
        startY = ev.clientY;
        pointerId = ev.pointerId;
        clearPress();
        pressTimer = setTimeout(() => {
            pressTimer = undefined;
            dragging = true;
            tile.classList.add("env-shell-app-menu__tile--dragging");
            document.documentElement.toggleAttribute("data-app-menu-dragging", true);
            ghost = createDragGhost(iconPlate, entry.title);
            document.body.appendChild(ghost);
            ghost.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px) translate(-50%, -50%)`;
            try {
                tile.setPointerCapture?.(pointerId);
            } catch {
                /* ignore */
            }
        }, LONG_PRESS_MS);
    });

    tile.addEventListener("pointermove", (ev) => {
        if (!dragging) {
            if (pressTimer == null) return;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (dx * dx + dy * dy > PRE_DRAG_MOVE_PX * PRE_DRAG_MOVE_PX) clearPress();
            return;
        }
        if (ghost) ghost.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px) translate(-50%, -50%)`;
    });

    tile.addEventListener("pointerup", (ev) => endDrag(ev.clientX, ev.clientY));
    tile.addEventListener("pointercancel", (ev) => endDrag(ev.clientX, ev.clientY));
}

function bindBookmarkTileContextMenu(
    tile: HTMLElement,
    entry: BookmarkMenuEntry,
    api: BookmarksMenuApi,
    iconUrl: { current: string },
    hooks: TileDragHooks & { onStartPinsChanged?: () => void }
): void {
    tile.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (entry.folder) {
            openUnifiedContextMenu({
                x: ev.clientX,
                y: ev.clientY,
                compact: true,
                items: [
                    {
                        id: "open-folder",
                        label: "Open folder",
                        icon: "folder-open",
                        action: () => {
                            tile.click();
                        }
                    }
                ]
            });
            return;
        }

        const pinned = isBookmarkPinnedToStart(entry.id);
        openUnifiedContextMenu({
            x: ev.clientX,
            y: ev.clientY,
            compact: true,
            items: [
                {
                    id: "place-desktop",
                    label: "Place on desktop",
                    icon: "desktop",
                    action: () => {
                        const paint =
                            String(iconUrl.current || "").trim() ||
                            resolveBookmarkDesktopIconUrl(entry, api);
                        const item = placeBookmarkOnDesktop(entry, undefined, api, paint);
                        if (item) {
                            showSuccess(`Placed “${entry.title}” on desktop`);
                            hooks.onDragStart?.();
                        }
                    }
                },
                pinned
                    ? {
                          id: "unpin-start",
                          label: "Unpin from Start",
                          icon: "push-pin-slash",
                          action: () => {
                              if (unpinBookmarkFromStart(entry.id)) {
                                  showSuccess(`Unpinned “${entry.title}”`);
                                  hooks.onStartPinsChanged?.();
                              }
                          }
                      }
                    : {
                          id: "pin-start",
                          label: "Pin to Start",
                          icon: "push-pin",
                          action: () => {
                              if (pinBookmarkToStart(entry)) {
                                  showSuccess(`Pinned “${entry.title}” to Start`);
                                  hooks.onStartPinsChanged?.();
                              }
                          }
                      },
                {
                    id: "open",
                    label: "Open",
                    icon: "arrow-square-out",
                    action: async () => {
                        pushRecentBookmark(entry);
                        try {
                            await api.open(entry);
                        } catch {
                            /* ignore */
                        }
                    }
                }
            ]
        });
    });
}

function renderBookmarkTile(
    entry: BookmarkMenuEntry,
    api: BookmarksMenuApi,
    hooks: TileDragHooks & { onStartPinsChanged?: () => void },
    onFolder: (id: string, title: string) => void
): HTMLElement {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "env-shell-app-menu__tile";
    tile.setAttribute("data-bookmark-id", entry.id);
    if (entry.folder) tile.setAttribute("data-folder", "");
    tile.title = entry.folder
        ? `${entry.title} — open folder`
        : `${entry.title} — right-click: desktop / pin; hold to drag`;

    const iconPlate = document.createElement("span");
    iconPlate.className = "env-shell-app-menu__tile-icon";
    iconPlate.setAttribute("data-shape", "squircle");

    const label = document.createElement("span");
    label.className = "env-shell-app-menu__tile-label";
    label.textContent = entry.title;

    tile.append(iconPlate, label);

    const iconUrl = { current: "" };
    void applyBookmarkIconToPlate(iconPlate, entry, api).then((url) => {
        iconUrl.current = url;
    });

    bindBookmarkTileDrag(tile, entry, iconPlate, iconUrl, hooks);
    bindBookmarkTileContextMenu(tile, entry, api, iconUrl, hooks);

    tile.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (document.documentElement.hasAttribute("data-app-menu-dragging")) return;
        if (entry.folder) {
            onFolder(entry.id, entry.title);
            return;
        }
        pushRecentBookmark(entry);
        try {
            await api.open(entry);
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
 * Mount `.env-shell-app-menu` beside the shell chrome.
 * Launcher SKU → Android apps grid; CRX bookmarks API → Win7-style Start (recent | folders).
 */
export function mountEnvironmentAppMenu(): MountAppMenuResult {
    ensureDocumentStyles();

    const mode = resolveAppMenuMode();
    const root = document.createElement("div");
    root.className = "env-shell-app-menu";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "false");
    root.setAttribute("aria-label", mode === "bookmarks" ? "Bookmarks" : "Apps");
    if (mode) root.setAttribute("data-menu-mode", mode);

    const panel = document.createElement("div");
    panel.className = "env-shell-app-menu__panel";
    if (mode === "bookmarks") panel.setAttribute("data-layout", "start-split");

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
    search.placeholder = mode === "bookmarks" ? "Search bookmarks" : "Search apps";
    search.autocomplete = "off";
    search.setAttribute("aria-label", mode === "bookmarks" ? "Search bookmarks" : "Search apps");

    const startBody = document.createElement("div");
    startBody.className = "env-shell-app-menu__start-body";
    startBody.hidden = mode !== "bookmarks";

    const leftCol = document.createElement("div");
    leftCol.className = "env-shell-app-menu__start-left";
    leftCol.setAttribute("aria-label", "Pinned and recent bookmarks");

    const pinnedHeading = document.createElement("div");
    pinnedHeading.className = "env-shell-app-menu__start-heading";
    pinnedHeading.textContent = "Pinned";

    const pinnedList = document.createElement("div");
    pinnedList.className = "env-shell-app-menu__start-recent env-shell-app-menu__start-pinned";

    const recentHeading = document.createElement("div");
    recentHeading.className = "env-shell-app-menu__start-heading";
    recentHeading.textContent = "Recent";

    const recentList = document.createElement("div");
    recentList.className = "env-shell-app-menu__start-recent";

    leftCol.append(pinnedHeading, pinnedList, recentHeading, recentList);

    const rightCol = document.createElement("div");
    rightCol.className = "env-shell-app-menu__start-right";

    const crumb = document.createElement("div");
    crumb.className = "env-shell-app-menu__crumb";

    const gridHost = document.createElement("div");
    gridHost.className = "env-shell-app-menu__grid";
    gridHost.setAttribute("data-part", "grid");
    gridHost.setAttribute("aria-label", mode === "bookmarks" ? "Bookmarks" : "Installed apps");

    rightCol.append(crumb, gridHost);
    startBody.append(leftCol, rightCol);

    if (mode === "bookmarks") {
        panel.append(banner, search, startBody);
    } else {
        panel.append(banner, search, gridHost);
    }
    root.appendChild(panel);

    const host = resolveAppMenuHost();
    host.appendChild(root);

    let open = false;
    let refreshGen = 0;
    let searchQuery = "";
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    let folderStack: Array<{ id: string; title: string }> = [];

    const syncVisibility = (): void => {
        if (!isAppMenuEnabled()) {
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
        if (!isAppMenuEnabled()) return;
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
        },
        onStartPinsChanged: () => {
            void refresh();
        }
    };

    const paintCrumb = (): void => {
        crumb.replaceChildren();
        if (mode !== "bookmarks") return;
        const rootBtn = document.createElement("button");
        rootBtn.type = "button";
        rootBtn.className = "env-shell-app-menu__crumb-item";
        rootBtn.textContent = "Bookmarks";
        rootBtn.addEventListener("click", () => {
            folderStack = [];
            void refresh();
        });
        crumb.appendChild(rootBtn);
        folderStack.forEach((seg, idx) => {
            const sep = document.createElement("span");
            sep.className = "env-shell-app-menu__crumb-sep";
            sep.textContent = "›";
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "env-shell-app-menu__crumb-item";
            btn.textContent = seg.title;
            btn.addEventListener("click", () => {
                folderStack = folderStack.slice(0, idx + 1);
                void refresh();
            });
            crumb.append(sep, btn);
        });
    };

    const populateLauncherGrid = async (bridge: LauncherBridgeApi, gen: number): Promise<void> => {
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

    const enterFolder = (id: string, title: string): void => {
        folderStack.push({ id, title });
        searchQuery = "";
        search.value = "";
        void refresh();
    };

    const populateBookmarks = async (api: BookmarksMenuApi, gen: number): Promise<void> => {
        paintCrumb();

        const fillLeftSection = (
            host: HTMLElement,
            entries: BookmarkMenuEntry[],
            emptyLabel: string
        ): void => {
            host.replaceChildren();
            if (entries.length === 0) {
                const empty = document.createElement("p");
                empty.className = "env-shell-app-menu__empty env-shell-app-menu__empty--compact";
                empty.textContent = emptyLabel;
                host.appendChild(empty);
                return;
            }
            for (const entry of entries) {
                host.appendChild(renderBookmarkTile(entry, api, tileDragHooks, enterFolder));
            }
        };

        fillLeftSection(pinnedList, readPinnedBookmarks(), "No pinned bookmarks");
        fillLeftSection(recentList, readRecentBookmarks(), "No recent bookmarks");

        let entries: BookmarkMenuEntry[] = [];
        try {
            if (searchQuery) {
                entries = await api.search(searchQuery);
            } else {
                const folderId = folderStack.length ? folderStack[folderStack.length - 1]!.id : undefined;
                entries = await api.listChildren(folderId);
            }
        } catch {
            entries = [];
        }
        if (gen !== refreshGen) return;

        gridHost.replaceChildren();
        if (entries.length === 0) {
            const empty = document.createElement("p");
            empty.className = "env-shell-app-menu__empty";
            empty.textContent = searchQuery ? "No matching bookmarks" : "This folder is empty";
            gridHost.appendChild(empty);
            return;
        }

        const frag = document.createDocumentFragment();
        const folders = entries.filter((e) => e.folder);
        const links = entries.filter((e) => !e.folder);
        for (const entry of [...folders, ...links]) {
            frag.appendChild(renderBookmarkTile(entry, api, tileDragHooks, enterFolder));
        }
        gridHost.appendChild(frag);
    };

    const refresh = async (): Promise<void> => {
        const gen = ++refreshGen;
        banner.hidden = true;
        search.hidden = false;

        const activeMode = resolveAppMenuMode();
        if (!activeMode) {
            syncVisibility();
            return;
        }
        root.setAttribute("data-menu-mode", activeMode);

        if (activeMode === "bookmarks") {
            panel.setAttribute("data-layout", "start-split");
            startBody.hidden = false;
            if (!panel.contains(startBody)) {
                panel.append(banner, search, startBody);
                if (gridHost.parentElement !== rightCol) rightCol.append(crumb, gridHost);
            }
            const api = resolveBookmarksMenuApi();
            if (!api) {
                banner.hidden = false;
                bannerText.textContent = "Bookmarks API unavailable in this context";
                bannerAction.hidden = true;
                search.hidden = true;
                startBody.hidden = true;
                return;
            }
            bannerAction.hidden = true;
            await populateBookmarks(api, gen);
            return;
        }

        panel.removeAttribute("data-layout");
        startBody.hidden = true;
        if (gridHost.parentElement !== panel) panel.append(gridHost);

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
        await populateLauncherGrid(bridge, gen);
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
            if (n instanceof Element && n.closest?.(".cw-context-menu-layer")) return;
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
