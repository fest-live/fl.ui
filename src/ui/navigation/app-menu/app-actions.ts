/*
 * Filename: app-actions.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/app-menu/app-actions.ts
 * FIND:app-menu
 * TAG:sku
 * Change date and time: 12.10.00_28.08.2026
 * Reason for changes: App Menu dialogs — app info, uninstall confirm, edit launch / bookmark URL.
 */

import { showError, showSuccess } from "fl-ui/speed-dial/toast";
import {
    clearAppLaunchSpec,
    getAppLaunchSpec,
    isLauncherLaunchSpecEmpty,
    normalizeLauncherLaunchSpec,
    setAppLaunchSpec,
    type LauncherLaunchSpec
} from "fl-ui/speed-dial/app-launch";
import type { BookmarkMenuEntry, BookmarksMenuApi } from "./bookmarks-menu";

export type LauncherAppInfo = {
    packageName?: string;
    label?: string;
    versionName?: string;
    versionCode?: number;
    componentName?: string;
    installer?: string;
    system?: boolean;
    updatedSystem?: boolean;
    enabled?: boolean;
    self?: boolean;
    canUninstall?: boolean;
    firstInstallTime?: number;
    lastUpdateTime?: number;
};

const FLAG_CHOICES = [
    "NEW_TASK",
    "CLEAR_TOP",
    "SINGLE_TOP",
    "CLEAR_TASK",
    "NO_HISTORY",
    "REORDER_TO_FRONT",
    "MULTIPLE_TASK"
] as const;

const esc = (value: unknown): string =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const fmtTime = (ms: unknown): string => {
    const n = Number(ms);
    if (!Number.isFinite(n) || n <= 0) return "—";
    try {
        return new Date(n).toLocaleString();
    } catch {
        return String(n);
    }
};

const openEditorDialog = (inner: string): HTMLDialogElement => {
    const modal = document.createElement("dialog");
    modal.className = "speed-dial-editor env-shell-app-menu__chrome-editor";
    modal.innerHTML = inner;
    const close = (): void => {
        try {
            if (modal.open) modal.close();
        } catch {
            /* ignore */
        }
        modal.remove();
    };
    modal.addEventListener("cancel", (ev) => {
        ev.preventDefault();
        close();
    });
    (modal as HTMLDialogElement & { __cwspClose?: () => void }).__cwspClose = close;
    document.body.append(modal);
    try {
        modal.showModal();
    } catch {
        modal.setAttribute("open", "");
    }
    return modal;
};

const extrasToText = (extras: Record<string, string | number | boolean> | undefined): string => {
    if (!extras || !Object.keys(extras).length) return "";
    try {
        return JSON.stringify(extras, null, 2);
    } catch {
        return "";
    }
};

const parseExtrasText = (raw: string): Record<string, string | number | boolean> => {
    const text = String(raw || "").trim();
    if (!text) return {};
    if (text.startsWith("{")) {
        try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            return normalizeLauncherLaunchSpec({ extras: parsed as LauncherLaunchSpec["extras"] }).extras || {};
        } catch {
            /* fall through to lines */
        }
    }
    const extras: Record<string, string | number | boolean> = {};
    for (const line of text.split(/\r?\n/)) {
        const eq = line.indexOf("=");
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (!key) continue;
        if (value === "true" || value === "false") extras[key] = value === "true";
        else if (/^-?\d+(\.\d+)?$/.test(value)) extras[key] = Number(value);
        else extras[key] = value;
    }
    return extras;
};

export function openAppInfoDialog(opts: {
    title: string;
    fallback: {
        packageName: string;
        componentName?: string;
        label?: string;
    };
    info?: LauncherAppInfo | null;
    onOpenSystem?: () => void | Promise<void>;
}): void {
    const info = opts.info || {};
    const pkg = String(info.packageName || opts.fallback.packageName || "").trim();
    const label = String(info.label || opts.fallback.label || opts.title || pkg).trim();
    const rows: Array<[string, string]> = [
        ["Label", label],
        ["Package", pkg],
        ["Activity", String(info.componentName || opts.fallback.componentName || "—")],
        ["Version", `${info.versionName || "—"} (${info.versionCode ?? "—"})`],
        ["Installer", String(info.installer || "—")],
        ["Enabled", info.enabled === false ? "no" : "yes"],
        ["System", info.system ? (info.updatedSystem ? "updated system" : "yes") : "no"],
        ["Installed", fmtTime(info.firstInstallTime)],
        ["Updated", fmtTime(info.lastUpdateTime)]
    ];
    const modal = openEditorDialog(`
        <form class="speed-dial-editor__form" autocomplete="off">
            <header class="modal-header">
                <h2 class="modal-title">App info</h2>
                <p class="modal-description">${esc(label)}</p>
            </header>
            <div class="modal-fields">
                ${rows
                    .map(
                        ([k, v]) => `
                    <div class="modal-field">
                        <label>${esc(k)}</label>
                        <input type="text" readonly value="${esc(v)}" />
                    </div>`
                    )
                    .join("")}
            </div>
            <div class="modal-actions" role="group">
                ${
                    opts.onOpenSystem
                        ? `<button type="button" data-action="system" class="btn secondary">System details</button>`
                        : `<span></span>`
                }
                <button type="button" data-action="close" class="btn save">Close</button>
            </div>
        </form>
    `);
    const close = (modal as HTMLDialogElement & { __cwspClose?: () => void }).__cwspClose;
    modal.querySelector("form")?.addEventListener("click", (ev) => {
        const action = (ev.target as HTMLElement | null)?.closest?.("[data-action]")?.getAttribute("data-action");
        if (action === "close") {
            ev.preventDefault();
            close?.();
        }
        if (action === "system") {
            ev.preventDefault();
            void Promise.resolve(opts.onOpenSystem?.()).finally(() => close?.());
        }
    });
}

export function openAppLaunchEditor(opts: {
    title: string;
    packageName: string;
    defaultComponent?: string;
    onSave?: (spec: LauncherLaunchSpec) => void;
}): void {
    const initial = getAppLaunchSpec(opts.packageName);
    const selected = new Set((initial.flags || []).map((f) => f.toUpperCase()));
    const modal = openEditorDialog(`
        <form class="speed-dial-editor__form" autocomplete="off">
            <header class="modal-header">
                <h2 class="modal-title">Edit launch</h2>
                <p class="modal-description">${esc(opts.title)} — action, data URI, extras, flags</p>
            </header>
            <div class="modal-fields">
                <div class="modal-field">
                    <label for="am-launch-component">Activity</label>
                    <input id="am-launch-component" name="componentName" type="text" value="${esc(
                        initial.componentName || opts.defaultComponent || ""
                    )}" placeholder="pkg/.MainActivity" />
                </div>
                <div class="modal-field">
                    <label for="am-launch-action">Intent action</label>
                    <input id="am-launch-action" name="action" type="text" value="${esc(
                        initial.action || ""
                    )}" placeholder="android.intent.action.MAIN" />
                </div>
                <div class="modal-field">
                    <label for="am-launch-data">Data URI</label>
                    <input id="am-launch-data" name="data" type="text" value="${esc(
                        initial.data || ""
                    )}" placeholder="https://…  content://…  app scheme" />
                </div>
                <div class="modal-field">
                    <label for="am-launch-mime">MIME</label>
                    <input id="am-launch-mime" name="mimeType" type="text" value="${esc(
                        initial.mimeType || ""
                    )}" placeholder="text/plain" />
                </div>
                <div class="modal-field">
                    <label for="am-launch-categories">Categories (comma)</label>
                    <input id="am-launch-categories" name="categories" type="text" value="${esc(
                        (initial.categories || []).join(", ")
                    )}" placeholder="android.intent.category.LAUNCHER" />
                </div>
                <div class="modal-field">
                    <label>Flags</label>
                    <div>
                        ${FLAG_CHOICES.map(
                            (flag) => `
                        <label style="display:flex;gap:0.4rem;align-items:center;margin:0.2rem 0;">
                            <input type="checkbox" name="flag" value="${flag}"${
                                selected.has(flag) ? " checked" : ""
                            } />
                            <span>${flag}</span>
                        </label>`
                        ).join("")}
                    </div>
                </div>
                <div class="modal-field">
                    <label for="am-launch-extras">Extras (JSON or key=value)</label>
                    <textarea id="am-launch-extras" name="extras" rows="5" placeholder='{"debug": true}'>${esc(
                        extrasToText(initial.extras)
                    )}</textarea>
                </div>
            </div>
            <div class="modal-actions" role="group">
                <button type="button" data-action="reset" class="btn secondary">Reset</button>
                <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
                <button type="submit" class="btn save">Save</button>
            </div>
        </form>
    `);
    const close = (modal as HTMLDialogElement & { __cwspClose?: () => void }).__cwspClose;
    const form = modal.querySelector("form");
    const readSpec = (): LauncherLaunchSpec => {
        const flags = [...modal.querySelectorAll<HTMLInputElement>('input[name="flag"]:checked')].map(
            (el) => el.value
        );
        const categories = String(
            (modal.querySelector('[name="categories"]') as HTMLInputElement | null)?.value || ""
        )
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
        return normalizeLauncherLaunchSpec({
            componentName: (modal.querySelector('[name="componentName"]') as HTMLInputElement | null)?.value,
            action: (modal.querySelector('[name="action"]') as HTMLInputElement | null)?.value,
            data: (modal.querySelector('[name="data"]') as HTMLInputElement | null)?.value,
            mimeType: (modal.querySelector('[name="mimeType"]') as HTMLInputElement | null)?.value,
            categories,
            flags,
            extras: parseExtrasText(
                (modal.querySelector('[name="extras"]') as HTMLTextAreaElement | null)?.value || ""
            )
        });
    };
    form?.addEventListener("click", (ev) => {
        const action = (ev.target as HTMLElement | null)?.closest?.("[data-action]")?.getAttribute("data-action");
        if (action === "cancel") {
            ev.preventDefault();
            close?.();
        }
        if (action === "reset") {
            ev.preventDefault();
            clearAppLaunchSpec(opts.packageName);
            opts.onSave?.({});
            showSuccess("Launch reset to default");
            close?.();
        }
    });
    form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const spec = readSpec();
        setAppLaunchSpec(opts.packageName, spec);
        opts.onSave?.(spec);
        showSuccess(isLauncherLaunchSpecEmpty(spec) ? "Launch reset to default" : "Launch saved");
        close?.();
    });
}

export function confirmUninstall(label: string, verb = "Uninstall"): boolean {
    return globalThis.confirm?.(`${verb} “${label}”?`) === true;
}

export function refreshWhenVisible(onRefresh: () => void): void {
    const tick = (): void => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", tick);
        onRefresh();
    };
    document.addEventListener("visibilitychange", tick);
    globalThis.setTimeout?.(onRefresh, 1600);
}

export function openBookmarkInfoDialog(entry: BookmarkMenuEntry): void {
    const rows: Array<[string, string]> = [
        ["Title", entry.title || "—"],
        ["URL", entry.url || "—"],
        ["Id", entry.id],
        ["Type", entry.folder ? "Folder" : "Bookmark"]
    ];
    const modal = openEditorDialog(`
        <form class="speed-dial-editor__form" autocomplete="off">
            <header class="modal-header">
                <h2 class="modal-title">${entry.folder ? "Folder info" : "Bookmark info"}</h2>
                <p class="modal-description">${esc(entry.title)}</p>
            </header>
            <div class="modal-fields">
                ${rows
                    .map(
                        ([k, v]) => `
                    <div class="modal-field">
                        <label>${esc(k)}</label>
                        <input type="text" readonly value="${esc(v)}" />
                    </div>`
                    )
                    .join("")}
            </div>
            <div class="modal-actions" role="group">
                <span></span>
                <button type="button" data-action="close" class="btn save">Close</button>
            </div>
        </form>
    `);
    const close = (modal as HTMLDialogElement & { __cwspClose?: () => void }).__cwspClose;
    modal.querySelector("form")?.addEventListener("click", (ev) => {
        const action = (ev.target as HTMLElement | null)?.closest?.("[data-action]")?.getAttribute("data-action");
        if (action === "close") {
            ev.preventDefault();
            close?.();
        }
    });
}

export function openBookmarkLaunchEditor(opts: {
    entry: BookmarkMenuEntry;
    api: BookmarksMenuApi;
    onSaved?: (entry: BookmarkMenuEntry) => void;
}): void {
    const entry = opts.entry;
    const modal = openEditorDialog(`
        <form class="speed-dial-editor__form" autocomplete="off">
            <header class="modal-header">
                <h2 class="modal-title">Edit launch</h2>
                <p class="modal-description">${esc(entry.title)} — title and URL</p>
            </header>
            <div class="modal-fields">
                <div class="modal-field">
                    <label for="am-bm-title">Title</label>
                    <input id="am-bm-title" name="title" type="text" value="${esc(entry.title)}" />
                </div>
                <div class="modal-field">
                    <label for="am-bm-url">URL</label>
                    <input id="am-bm-url" name="url" type="text" value="${esc(entry.url || "")}" />
                </div>
            </div>
            <div class="modal-actions" role="group">
                <span></span>
                <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
                <button type="submit" class="btn save">Save</button>
            </div>
        </form>
    `);
    const close = (modal as HTMLDialogElement & { __cwspClose?: () => void }).__cwspClose;
    const form = modal.querySelector("form");
    form?.addEventListener("click", (ev) => {
        const action = (ev.target as HTMLElement | null)?.closest?.("[data-action]")?.getAttribute("data-action");
        if (action === "cancel") {
            ev.preventDefault();
            close?.();
        }
    });
    form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const title = String((modal.querySelector('[name="title"]') as HTMLInputElement | null)?.value || "").trim();
        const url = String((modal.querySelector('[name="url"]') as HTMLInputElement | null)?.value || "").trim();
        void (async () => {
            if (!opts.api.update) {
                showError("Bookmark edit unavailable");
                return;
            }
            const next = await opts.api.update(entry.id, { title, url });
            if (!next) {
                showError("Could not update bookmark");
                return;
            }
            showSuccess("Bookmark updated");
            opts.onSaved?.(next);
            close?.();
        })();
    });
}

export { type LauncherLaunchSpec };
