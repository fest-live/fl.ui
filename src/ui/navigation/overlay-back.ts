/*
 * Filename: overlay-back.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/overlay-back.ts
 * Change date and time: 08.55.00_30.08.2026
 * Reason for changes: Capacitor system back — close overlays, then Explorer goUp.
 */

import {
    ClosePriority,
    closeHighestPriority,
    hasActiveCloseable,
    initBackNavigation,
    registerCloseable
} from "@fest-lib/lure";
import { closeUnifiedContextMenu } from "../explorer/ContextMenu";
import { closeExplorerSettings } from "../explorer/ExplorerSettings";

type FileManagerBackHost = HTMLElement & {
    path?: string;
    goUp?: () => void | Promise<void>;
};

const explorerFileManager = (): FileManagerBackHost | null =>
    document.querySelector("ui-file-manager") as FileManagerBackHost | null;

const explorerSettingsEl = (): Element | null =>
    explorerFileManager()?.shadowRoot?.querySelector("ui-explorer-settings")
    ?? document.querySelector("ui-explorer-settings");

const explorerFolderNorm = (): string => {
    const raw = String(explorerFileManager()?.path || "/").trim() || "/";
    const p = raw.replace(/\/+$/, "");
    return p || "/";
};

const explorerCanGoUp = (): boolean => explorerFolderNorm() !== "/";

const registerExplorerFolderCloseable = (): void => {
    const g = globalThis as typeof globalThis & { __CWSP_EXPLORER_FOLDER_BACK__?: boolean };
    if (g.__CWSP_EXPLORER_FOLDER_BACK__) return;
    g.__CWSP_EXPLORER_FOLDER_BACK__ = true;
    registerCloseable({
        id: "explorer-folder",
        priority: ClosePriority.VIEW,
        isActive: explorerCanGoUp,
        close: () => {
            const fm = explorerFileManager();
            if (!fm?.goUp || !explorerCanGoUp()) return false;
            void fm.goUp();
            return true;
        }
    });
    registerCloseable({
        id: "explorer-ctx-menu",
        priority: ClosePriority.CONTEXT_MENU,
        isActive: () => Boolean(document.querySelector(".cw-context-menu, .cw-context-menu-layer")),
        close: () => {
            closeUnifiedContextMenu();
            return true;
        }
    });
    registerCloseable({
        id: "explorer-settings",
        priority: ClosePriority.PANEL,
        isActive: () => Boolean(explorerSettingsEl()),
        close: () => {
            closeExplorerSettings();
            return true;
        }
    });
};

/** Close menu / settings / folder. `true` = consumed (do not leave the Activity). */
export const handleNativeBackPress = (): boolean => {
    if (hasActiveCloseable() && closeHighestPriority()) return true;
    if (document.querySelector(".cw-context-menu, .cw-context-menu-layer")) {
        closeUnifiedContextMenu();
        return true;
    }
    if (explorerSettingsEl()) {
        closeExplorerSettings();
        return true;
    }
    return false;
};

const bindNativeBackHook = (): void => {
    const g = globalThis as typeof globalThis & {
        __CWSP_NATIVE_BACK__?: { handleBackPress?: () => boolean };
        __CWSP_LAUNCHER_HOME__?: { handleBackPress?: () => boolean };
    };
    g.__CWSP_NATIVE_BACK__ = { handleBackPress: handleNativeBackPress };
    const prev = g.__CWSP_LAUNCHER_HOME__?.handleBackPress;
    g.__CWSP_LAUNCHER_HOME__ = {
        ...(g.__CWSP_LAUNCHER_HOME__ || {}),
        handleBackPress: () => handleNativeBackPress() || (typeof prev === "function" ? prev() : false)
    };
};

const installCapacitorBackButton = (): void => {
    const g = globalThis as typeof globalThis & {
        __CWSP_CAP_BACK_BOUND__?: boolean;
        Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { App?: { addListener?: Function } } };
    };
    if (g.__CWSP_CAP_BACK_BOUND__) return;
    const App = g.Capacitor?.Plugins?.App;
    if (typeof App?.addListener !== "function") return;
    g.__CWSP_CAP_BACK_BOUND__ = true;
    try {
        App.addListener("backButton", () => {
            if (handleNativeBackPress()) return;
        });
    } catch (e) {
        console.warn("[overlay-back] Capacitor backButton bind failed", e);
    }
};

const registerShellOverlays = (): void => {
    registerCloseable({
        id: "app-menu-overlay",
        priority: ClosePriority.SIDEBAR,
        isActive: () => Boolean(document.querySelector(".env-shell-app-menu[data-open]")),
        close: () => {
            document
                .querySelector<HTMLElement>(".env-shell-app-menu")
                ?.dispatchEvent(new CustomEvent("env-app-menu-request-close", { bubbles: true }));
            return true;
        }
    });
    registerCloseable({
        id: "speed-dial-editor",
        priority: ClosePriority.MODAL,
        isActive: () => Boolean(document.querySelector("dialog.speed-dial-editor[open], dialog.sd-icon-picker[open]")),
        close: () => {
            document.querySelectorAll<HTMLDialogElement>("dialog.speed-dial-editor[open], dialog.sd-icon-picker[open]").forEach((d) => {
                try {
                    d.close();
                } catch {
                    d.remove();
                }
            });
            return true;
        }
    });
};

/** Idempotent — Speed Dial / TaskBar / App Menu can all call this. */
export const installLauncherBackStack = (): void => {
    const g = globalThis as typeof globalThis & { __CWSP_LAUNCHER_BACK_STACK__?: boolean };
    if (g.__CWSP_LAUNCHER_BACK_STACK__) {
        installCapacitorBackButton();
        bindNativeBackHook();
        return;
    }
    g.__CWSP_LAUNCHER_BACK_STACK__ = true;
    try {
        initBackNavigation({ preventDefaultNavigation: true, pushInitialState: false });
    } catch {
        /* already inited by tasking Manager */
    }
    registerShellOverlays();
    installCapacitorBackButton();
    bindNativeBackHook();
};

/** Explorer SKU: overlays first, then parent folder, then Activity may background. */
export const installExplorerBackStack = (): void => {
    installLauncherBackStack();
    registerExplorerFolderCloseable();
    bindNativeBackHook();
};
