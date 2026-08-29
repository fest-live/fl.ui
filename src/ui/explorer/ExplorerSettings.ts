/*
 * Filename: ExplorerSettings.ts
 * FullPath: modules/projects/fl.ui/src/ui/explorer/ExplorerSettings.ts
 * Change date: 22.30.00_29.08.2026
 * Reason: Explorer settings — list sort plus SAF / all-files / PWA mounts.
 */

import { H, defineElement } from "@fest-lib/lure";
import { addEvent, preloadStyle } from "@fest-lib/dom";
import { UIElement } from "fl-ui/base/UIElement";
import {
    addDirectoryMount,
    listExplorerMounts,
    removeDirectoryMount
} from "./mounts.ts";
import { peekExplorerSort, writeExplorerSort, type ExplorerSortBy } from "./entry-sort";
import {
    canShowDirectoryPicker,
    getAllFilesStatus,
    isNativeStorageAvailable,
    pickBrowserDirectory,
    pickSafTree,
    requestAllFilesAccess,
    type AllFilesStatus
} from "./storage-bridge.ts";

// @ts-ignore
import settingsCss from "./ExplorerSettings.scss?inline";

const styled = preloadStyle(settingsCss);

const paintMounts = (host: HTMLElement): void => {
    const list = host.querySelector("[data-explorer-mounts]") as HTMLElement | null;
    if (!list) return;
    const mounts = listExplorerMounts();
    list.replaceChildren();
    if (!mounts.length) {
        list.textContent = "No mounted folders yet.";
        return;
    }
    for (const mount of mounts) {
        const row = document.createElement("div");
        row.className = "explorer-settings__mount";
        row.innerHTML = `<span>${mount.label}</span><code>${mount.path}</code>`;
        const unmount = document.createElement("button");
        unmount.className = "btn";
        unmount.type = "button";
        unmount.textContent = "Unmount";
        unmount.addEventListener("click", () => {
            removeDirectoryMount(mount.id);
            paintMounts(host);
            window.dispatchEvent(new CustomEvent("cwsp:explorer-mount-change"));
        });
        row.append(unmount);
        list.append(row);
    }
};

const paintSort = (host: HTMLElement): void => {
    const prefs = peekExplorerSort();
    const by = host.querySelector("[data-explorer-sort-by]") as HTMLSelectElement | null;
    const dir = host.querySelector("[data-explorer-sort-dir]") as HTMLSelectElement | null;
    const folders = host.querySelector("[data-explorer-folders-first]") as HTMLInputElement | null;
    if (by) by.value = prefs.sortBy;
    if (dir) dir.value = prefs.sortDir;
    if (folders) folders.checked = prefs.foldersFirst;
};

const paintStatus = (host: HTMLElement, status: AllFilesStatus | null, note = ""): void => {
    const el = host.querySelector("[data-explorer-status]") as HTMLElement | null;
    if (!el) return;
    const lines = [
        `All-files (/sdcard/): ${status?.allFilesAccess ? "granted" : "not granted"}`,
        status?.note ? status.note : "",
        note
    ].filter(Boolean);
    el.textContent = lines.join("\n");
};

@defineElement("ui-explorer-settings")
export class ExplorerSettings extends UIElement {
    styles = () => styled;

    onInitialize(): this {
        const result = super.onInitialize();
        queueMicrotask(() => {
            paintSort(this);
            paintMounts(this);
            if (isNativeStorageAvailable()) {
                void getAllFilesStatus().then((s) => paintStatus(this, s));
            } else {
                paintStatus(this, null, "Browser / PWA: use Mount folder (showDirectoryPicker).");
            }
        });
        return (result ?? this) as this;
    }

    render = function (this: ExplorerSettings) {
        const self = this;
        const native = isNativeStorageAvailable();
        const picker = canShowDirectoryPicker();
        return H`<div class="explorer-settings" part="root">
            <header class="explorer-settings__head">
                <h2>Explorer</h2>
                <p>Mounts sit beside <code>/user/</code> and <code>/assets/</code>. Android all-files is <code>/sdcard/</code>; SAF trees are <code>/saf/</code>.</p>
            </header>
            <section class="explorer-settings__card">
                <h3>List sort</h3>
                <p>Name, date, type, size, or kind. Folders can stay on top.</p>
                <label class="explorer-settings__field">
                    <span>Sort by</span>
                    <select data-explorer-sort-by on:change=${(ev: Event) => {
                        const v = (ev.currentTarget as HTMLSelectElement).value as ExplorerSortBy;
                        writeExplorerSort({ sortBy: v });
                    }}>
                        <option value="name">Name</option>
                        <option value="date">Date modified</option>
                        <option value="type">Type</option>
                        <option value="size">Size</option>
                        <option value="kind">Kind (file / folder)</option>
                    </select>
                </label>
                <label class="explorer-settings__field">
                    <span>Order</span>
                    <select data-explorer-sort-dir on:change=${(ev: Event) => {
                        writeExplorerSort({
                            sortDir: (ev.currentTarget as HTMLSelectElement).value === "desc" ? "desc" : "asc"
                        });
                    }}>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </label>
                <label class="explorer-settings__check">
                    <input type="checkbox" data-explorer-folders-first on:change=${(ev: Event) => {
                        writeExplorerSort({ foldersFirst: (ev.currentTarget as HTMLInputElement).checked });
                    }} />
                    <span>Folders first</span>
                </label>
            </section>
            <section class="explorer-settings__card">
                <h3>Android storage</h3>
                <pre data-explorer-status class="explorer-settings__status">Checking…</pre>
                <div class="explorer-settings__actions">
                    <button class="btn" type="button" disabled=${!native} on:click=${() => {
                        void requestAllFilesAccess().then(() =>
                            getAllFilesStatus().then((s) => paintStatus(self, s, "Opened system all-files settings."))
                        );
                    }}>Allow all files</button>
                    <button class="btn" type="button" disabled=${!native} on:click=${() => {
                        void pickSafTree().then((uri) => {
                            paintStatus(self, null, uri ? `SAF tree: ${uri}` : "SAF pick cancelled.");
                            window.dispatchEvent(new CustomEvent("cwsp:explorer-mount-change"));
                        });
                    }}>Pick SAF folder</button>
                </div>
            </section>
            <section class="explorer-settings__card">
                <h3>Browser mounts</h3>
                <p>Uses <code>showDirectoryPicker</code> (Chromium PWA). Handles stay in this session.</p>
                <div class="explorer-settings__actions">
                    <button class="btn" type="button" disabled=${!picker} on:click=${() => {
                        void pickBrowserDirectory().then((handle) => {
                            if (!handle) return;
                            addDirectoryMount(handle);
                            paintMounts(self);
                            window.dispatchEvent(new CustomEvent("cwsp:explorer-mount-change"));
                        });
                    }}>Mount folder</button>
                </div>
                <div data-explorer-mounts class="explorer-settings__mounts"></div>
            </section>
        </div>`;
    };
}

export const openExplorerSettings = (host?: HTMLElement | null): ExplorerSettings => {
    const existing = document.querySelector("ui-explorer-settings") as ExplorerSettings | null;
    if (existing) {
        existing.hidden = false;
        return existing;
    }
    const page = document.createElement("ui-explorer-settings") as ExplorerSettings;
    (host || document.body).append(page);
    return page;
};

export const closeExplorerSettings = (): void => {
    document.querySelectorAll("ui-file-manager").forEach((fm) => {
        fm.shadowRoot?.querySelector("ui-explorer-settings")?.remove();
    });
    document.querySelector("ui-explorer-settings")?.remove();
};

addEvent(window, "keydown", (ev: KeyboardEvent) => {
    if (ev.key === "Escape") closeExplorerSettings();
});

export default ExplorerSettings;
