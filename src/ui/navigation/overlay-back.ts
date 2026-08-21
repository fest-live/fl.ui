/*
 * Filename: overlay-back.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/overlay-back.ts
 * Change date and time: 16.10.00_21.08.2026
 * Reason for changes: Android/Cap back closes menus, App Menu, flyouts before leaving Home.
 */

import {
    ClosePriority,
    closeHighestPriority,
    hasActiveCloseable,
    initBackNavigation,
    registerCloseable
} from "@fest-lib/lure";
import { closeUnifiedContextMenu } from "../explorer/ContextMenu";
import { closeChromeFlyout, isChromeFlyoutOpen } from "./flyout/ChromeFlyout";

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
        App.addListener("backButton", ({ canGoBack }: { canGoBack?: boolean }) => {
            if (hasActiveCloseable() && closeHighestPriority()) return;
            if (document.querySelector(".cw-context-menu-layer")) {
                closeUnifiedContextMenu();
                return;
            }
            if (document.querySelector(".env-shell-app-menu[data-open]")) {
                document.querySelector<HTMLElement>(".env-shell-app-menu")
                    ?.dispatchEvent(new CustomEvent("env-app-menu-request-close", { bubbles: true }));
                return;
            }
            if (isChromeFlyoutOpen("quick-settings")) {
                closeChromeFlyout("quick-settings");
                return;
            }
            if (isChromeFlyoutOpen("calendar")) {
                closeChromeFlyout("calendar");
                return;
            }
            const dialog = document.querySelector<HTMLDialogElement>("dialog[open], .speed-dial-editor");
            if (dialog) {
                dialog.close?.();
                dialog.remove?.();
                return;
            }
            if (canGoBack) {
                history.back();
                return;
            }
            /* Home launcher: stay on Speed Dial instead of exiting. */
        });
    } catch (e) {
        console.warn("[overlay-back] Capacitor backButton bind failed", e);
    }
};

const registerShellOverlays = (): void => {
    registerCloseable({
        id: "ctx-menu-layer",
        priority: ClosePriority.CONTEXT_MENU,
        isActive: () => Boolean(document.querySelector(".cw-context-menu-layer")),
        close: () => {
            closeUnifiedContextMenu();
            return true;
        }
    });
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
        id: "chrome-flyouts",
        priority: ClosePriority.OVERLAY,
        isActive: () => isChromeFlyoutOpen("quick-settings") || isChromeFlyoutOpen("calendar"),
        close: () => {
            closeChromeFlyout("quick-settings");
            closeChromeFlyout("calendar");
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
        return;
    }
    g.__CWSP_LAUNCHER_BACK_STACK__ = true;
    try {
        initBackNavigation({ preventDefaultNavigation: true, pushInitialState: true });
    } catch {
        /* already inited by tasking Manager */
    }
    registerShellOverlays();
    installCapacitorBackButton();
};
