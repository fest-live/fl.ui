/*
 * Filename: workspace-pages.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/workspace-pages.ts
 * Change date and time: 19.10.00_21.08.2026
 * Reason for changes: Mark page-turn ghosts so live labels do not copy their cells.
 */

import { resolveFsBackend } from "#fl-ui/explorer/path-router";
import {
    applySpeedDialSnapshot,
    captureSpeedDialSnapshot,
    type SpeedDialSnapshot
} from "./launcher-state";
import { hideAndroidWidgetHosts, syncAndroidWidgetHosts } from "./widgets";

export const WORKSPACES_ROOT = "/user/workspaces/";
export const WORKSPACE_PAGE_EVENT = "cwsp:workspace-page";
const CATALOG_KEY = "cw::workspace::pages";

export type WorkspacePage = {
    id: string;
    label: string;
    path: string;
};

type WorkspaceCatalog = {
    activeId: string;
    pages: WorkspacePage[];
    snapshots: Record<string, SpeedDialSnapshot>;
};

const SIDE_LETTERS = "abcdefghijklmnopqrstuvwxyz";

const slugPath = (id: string): string => `${WORKSPACES_ROOT}${id}/`;

const defaultPages = (): WorkspacePage[] =>
    ["side-a", "side-b", "side-c"].map((id) => ({
        id,
        label: `Side ${id.slice(-1).toUpperCase()}`,
        path: slugPath(id)
    }));

const emptyCatalog = (): WorkspaceCatalog => ({
    activeId: "side-a",
    pages: defaultPages(),
    snapshots: {}
});

const readCatalog = (): WorkspaceCatalog => {
    try {
        const raw = localStorage.getItem(CATALOG_KEY);
        if (!raw) return emptyCatalog();
        const parsed = JSON.parse(raw) as WorkspaceCatalog;
        if (!parsed || !Array.isArray(parsed.pages) || !parsed.pages.length) return emptyCatalog();
        return {
            activeId: String(parsed.activeId || parsed.pages[0].id),
            pages: parsed.pages.map((p) => ({
                id: String(p.id || "").trim(),
                label: String(p.label || p.id),
                path: String(p.path || slugPath(p.id))
            })).filter((p) => p.id),
            snapshots: parsed.snapshots && typeof parsed.snapshots === "object" ? parsed.snapshots : {}
        };
    } catch {
        return emptyCatalog();
    }
};

const writeCatalog = (catalog: WorkspaceCatalog): void => {
    try {
        localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
    } catch {
        /* private mode */
    }
};

const emitPageChange = (id: string): void => {
    try {
        window.dispatchEvent(
            new CustomEvent(WORKSPACE_PAGE_EVENT, { detail: { id, pages: listWorkspacePages() } })
        );
    } catch {
        /* ignore */
    }
};

export const listWorkspacePages = (): WorkspacePage[] => readCatalog().pages;

export const getActiveWorkspaceId = (): string => readCatalog().activeId || "side-a";

export const getActiveWorkspace = (): WorkspacePage => {
    const cat = readCatalog();
    return cat.pages.find((p) => p.id === cat.activeId) || cat.pages[0];
};

const nextSideId = (pages: WorkspacePage[]): string => {
    const used = new Set(pages.map((p) => p.id));
    for (const ch of SIDE_LETTERS) {
        const id = `side-${ch}`;
        if (!used.has(id)) return id;
    }
    return `side-${Date.now().toString(36)}`;
};

/** Best-effort Explorer tree: /user/workspaces/<id>/workspace.json */
export const ensureWorkspaceExplorerDir = async (page: WorkspacePage): Promise<void> => {
    try {
        const backend = resolveFsBackend("/user/");
        if (!backend?.mkdir || !backend.writable) return;
        await backend.mkdir("/user/", "workspaces").catch(() => undefined);
        await backend.mkdir(WORKSPACES_ROOT, page.id).catch(() => undefined);
        if (backend.writeFile) {
            const blob = new File(
                [JSON.stringify({ id: page.id, label: page.label, path: page.path }, null, 2)],
                "workspace.json",
                { type: "application/json" }
            );
            await backend.writeFile(page.path, blob).catch(() => undefined);
        }
    } catch (e) {
        console.warn("[workspace-pages] explorer dir failed", page.id, e);
    }
};

export const addWorkspacePage = (label?: string): WorkspacePage => {
    const cat = readCatalog();
    const id = nextSideId(cat.pages);
    const page: WorkspacePage = {
        id,
        label: String(label || `Side ${id.slice(-1).toUpperCase()}`).trim() || id,
        path: slugPath(id)
    };
    cat.pages.push(page);
    writeCatalog(cat);
    void ensureWorkspaceExplorerDir(page);
    emitPageChange(cat.activeId);
    return page;
};

export const renameWorkspacePage = (id: string, label: string): void => {
    const cat = readCatalog();
    const page = cat.pages.find((p) => p.id === id);
    if (!page) return;
    page.label = String(label || page.label).trim() || page.label;
    writeCatalog(cat);
    void ensureWorkspaceExplorerDir(page);
    emitPageChange(cat.activeId);
};

export const removeWorkspacePage = (id: string): boolean => {
    const cat = readCatalog();
    if (cat.pages.length <= 1) return false;
    const idx = cat.pages.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    cat.pages.splice(idx, 1);
    delete cat.snapshots[id];
    if (cat.activeId === id) cat.activeId = cat.pages[Math.max(0, idx - 1)].id;
    writeCatalog(cat);
    emitPageChange(cat.activeId);
    return true;
};

const prefersReducedMotion = (): boolean => {
    try {
        return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
};

const workspaceTurnTargets = (): HTMLElement[] => {
    const root =
        document.querySelector<HTMLElement>(".speed-dial-root") ||
        document.getElementById("home");
    if (!root) return [];
    const grids = [...root.querySelectorAll<HTMLElement>(".speed-dial-grid")];
    return grids.length ? grids : [root];
};

/**
 * Clone outgoing tiles, then return a closer that turns the new page in.
 * WHY: snapshot apply stays synchronous so rapid A→C clicks never persist the wrong page.
 */
const beginWorkspacePageTurn = (direction: number): (() => void) => {
    const targets = workspaceTurnTargets();
    if (!targets.length || prefersReducedMotion() || typeof targets[0].animate !== "function") {
        return () => undefined;
    }
    const dir = direction < 0 ? -1 : 1;
    const outDeg = `${-88 * dir}deg`;
    const inDeg = `${88 * dir}deg`;
    const outX = `${-18 * dir}%`;
    const inX = `${18 * dir}%`;
    const root = targets[0].closest<HTMLElement>(".speed-dial-root") || targets[0];
    root.dataset.wsTurning = dir > 0 ? "next" : "prev";
    const ghosts: HTMLElement[] = [];
    for (const el of targets) {
        const ghost = el.cloneNode(true) as HTMLElement;
        ghost.classList.add("speed-dial-grid--turn-ghost");
        ghost.dataset.wsGhost = "1";
        ghost.setAttribute("aria-hidden", "true");
        el.parentElement?.insertBefore(ghost, el.nextSibling);
        el.style.opacity = "0";
        ghosts.push(ghost);
        ghost.animate(
            [
                { transform: "translateX(0) rotateY(0deg)", opacity: 1 },
                { transform: `translateX(${outX}) rotateY(${outDeg})`, opacity: 0 }
            ],
            { duration: 180, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" }
        );
    }
    return () => {
        const incoming = targets.map((el) =>
            el.animate(
                [
                    { transform: `translateX(${inX}) rotateY(${inDeg})`, opacity: 0.2 },
                    { transform: "translateX(0) rotateY(0deg)", opacity: 1 }
                ],
                { duration: 220, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "none" }
            )
        );
        void Promise.all(incoming.map((anim) => anim.finished.catch(() => undefined))).then(() => {
            for (const el of targets) el.style.opacity = "";
            for (const ghost of ghosts) ghost.remove();
            delete root.dataset.wsTurning;
        });
    };
};

/**
 * Persist the live Speed Dial into the active page, then load another page.
 * INVARIANT: the in-memory `speedDialItems` array is always the active workspace.
 */
export const switchWorkspacePage = (id: string): boolean => {
    const cat = readCatalog();
    const next = cat.pages.find((p) => p.id === id);
    if (!next) return false;
    const currentId = cat.activeId || cat.pages[0].id;
    if (currentId === next.id) return true;
    const fromIdx = Math.max(0, cat.pages.findIndex((p) => p.id === currentId));
    const toIdx = Math.max(0, cat.pages.findIndex((p) => p.id === next.id));
    let turnDir = toIdx - fromIdx;
    if (Math.abs(turnDir) > cat.pages.length / 2) {
        turnDir += turnDir > 0 ? -cat.pages.length : cat.pages.length;
    }
    cat.snapshots[currentId] = captureSpeedDialSnapshot();
    cat.activeId = next.id;
    writeCatalog(cat);
    hideAndroidWidgetHosts();
    const finishTurn = beginWorkspacePageTurn(turnDir);
    applySpeedDialSnapshot(cat.snapshots[next.id] || { items: [] });
    requestAnimationFrame(() => {
        finishTurn();
        requestAnimationFrame(() => syncAndroidWidgetHosts());
    });
    void ensureWorkspaceExplorerDir(next);
    emitPageChange(next.id);
    return true;
};

export const switchWorkspaceByDelta = (delta: number): boolean => {
    const cat = readCatalog();
    if (cat.pages.length < 2) return false;
    const idx = Math.max(0, cat.pages.findIndex((p) => p.id === cat.activeId));
    const next = cat.pages[(idx + delta + cat.pages.length) % cat.pages.length];
    return switchWorkspacePage(next.id);
};

/** First boot: treat the current grid as side-a; ensure Explorer folders. */
export const bootWorkspacePages = (): void => {
    const cat = readCatalog();
    if (!cat.snapshots[cat.activeId]) {
        cat.snapshots[cat.activeId] = captureSpeedDialSnapshot();
        writeCatalog(cat);
    }
    for (const page of cat.pages) void ensureWorkspaceExplorerDir(page);
};

export const WORKSPACE_CMD_EVENT = "cwsp:workspace-cmd";

export const handleWorkspaceCommand = (cmd: string, id?: string, label?: string): void => {
    if (cmd === "add") addWorkspacePage(label);
    else if (cmd === "prev") switchWorkspaceByDelta(-1);
    else if (cmd === "next") switchWorkspaceByDelta(1);
    else if (cmd === "switch" && id) switchWorkspacePage(id);
    else if (cmd === "rename" && id) renameWorkspacePage(id, String(label || ""));
    else if (cmd === "remove" && id) removeWorkspacePage(id);
};

export const bindWorkspacePageHotkeys = (): () => void => {
    const g = globalThis as { __CWSP_WS_HOTKEYS__?: boolean };
    if (g.__CWSP_WS_HOTKEYS__) return () => undefined;
    g.__CWSP_WS_HOTKEYS__ = true;
    const onKey = (ev: KeyboardEvent): void => {
        if (!(ev.ctrlKey || ev.metaKey) || !ev.altKey) return;
        if (ev.key === "ArrowLeft") {
            ev.preventDefault();
            switchWorkspaceByDelta(-1);
        } else if (ev.key === "ArrowRight") {
            ev.preventDefault();
            switchWorkspaceByDelta(1);
        }
    };
    window.addEventListener("keydown", onKey);
    const onCmd = (ev: Event): void => {
        const detail = (ev as CustomEvent).detail || {};
        handleWorkspaceCommand(String(detail.cmd || ""), detail.id, detail.label);
    };
    window.addEventListener(WORKSPACE_CMD_EVENT, onCmd);
    return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener(WORKSPACE_CMD_EVENT, onCmd);
    };
};
