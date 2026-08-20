/*
 * Filename: tile-chrome.ts
 * FullPath: modules/projects/fl.ui/src/ui/navigation/app-menu/tile-chrome.ts
 * Change date and time: 11.25.00_20.08.2026
 * Reason for changes: Per-app / bookmark icon shape + display overrides in App Menu.
 */

import {
    ICON_DISPLAY_OPTIONS,
    TILE_SHAPE_OPTIONS,
    normalizeIconDisplay,
    normalizeTileShape,
    type IconDisplayMode
} from "fl-ui/speed-dial/tile-icon";

export type AppMenuTileChrome = {
    shape?: string;
    iconDisplay?: IconDisplayMode | string;
    /** Phosphor name override (glyph mode). */
    icon?: string;
    /** Resource override (masked / masked-inverse / colored). */
    iconUrl?: string;
};

const STORAGE_KEY = "cwsp-app-menu-tile-chrome-v1";

type ChromeMap = Record<string, AppMenuTileChrome>;

let cache: ChromeMap | null = null;

function readAll(): ChromeMap {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            cache = {};
            return cache;
        }
        const parsed = JSON.parse(raw);
        cache = parsed && typeof parsed === "object" ? (parsed as ChromeMap) : {};
    } catch {
        cache = {};
    }
    return cache;
}

function writeAll(map: ChromeMap): void {
    cache = map;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        /* quota / private mode */
    }
}

export function appMenuChromeKeyForPackage(packageName: string): string {
    return `app:${String(packageName || "").trim()}`;
}

export function appMenuChromeKeyForBookmark(id: string): string {
    return `bm:${String(id || "").trim()}`;
}

export function getAppMenuTileChrome(key: string): AppMenuTileChrome {
    const k = String(key || "").trim();
    if (!k) return {};
    return { ...(readAll()[k] || {}) };
}

export function setAppMenuTileChrome(key: string, patch: AppMenuTileChrome): AppMenuTileChrome {
    const k = String(key || "").trim();
    if (!k) return {};
    const all = { ...readAll() };
    const next: AppMenuTileChrome = { ...(all[k] || {}), ...patch };
    if (next.shape) next.shape = normalizeTileShape(next.shape, "circle");
    if (next.iconDisplay) {
        next.iconDisplay = normalizeIconDisplay(next.iconDisplay) || "colored";
    }
    all[k] = next;
    writeAll(all);
    return next;
}

export function clearAppMenuTileChrome(key: string): void {
    const k = String(key || "").trim();
    if (!k) return;
    const all = { ...readAll() };
    delete all[k];
    writeAll(all);
}

/** Compact dialog to tweak App Menu tile shape + icon display. */
export function openAppMenuTileChromeEditor(opts: {
    title: string;
    key: string;
    initial?: AppMenuTileChrome;
    defaults?: AppMenuTileChrome;
    onSave: (chrome: AppMenuTileChrome) => void;
}): void {
    const initial = { ...(opts.defaults || {}), ...(opts.initial || {}), ...getAppMenuTileChrome(opts.key) };
    const modal = document.createElement("dialog");
    modal.className = "speed-dial-editor env-shell-app-menu__chrome-editor";
    modal.innerHTML = `
        <form class="speed-dial-editor__form" autocomplete="off">
            <header class="modal-header">
                <h2 class="modal-title">Icon design</h2>
                <p class="modal-description">${String(opts.title || "").replace(/[<>&]/g, "")}</p>
            </header>
            <div class="modal-fields">
                <div class="modal-field">
                    <label for="am-chrome-shape">Shape</label>
                    <select id="am-chrome-shape" name="shape">
                        ${TILE_SHAPE_OPTIONS.map(
                            (o) =>
                                `<option value="${o.value}"${
                                    normalizeTileShape(initial.shape, "circle") === o.value
                                        ? " selected"
                                        : ""
                                }>${o.label}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="modal-field">
                    <label for="am-chrome-display">Icon display</label>
                    <select id="am-chrome-display" name="iconDisplay">
                        ${ICON_DISPLAY_OPTIONS.map(
                            (o) =>
                                `<option value="${o.value}"${
                                    (normalizeIconDisplay(initial.iconDisplay) || "colored") === o.value
                                        ? " selected"
                                        : ""
                                }>${o.label}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="modal-field" data-field="glyph">
                    <label for="am-chrome-icon">Icon (Phosphor)</label>
                    <input id="am-chrome-icon" name="icon" type="text" value="${String(
                        initial.icon || ""
                    ).replace(/"/g, "&quot;")}" placeholder="device-mobile" />
                </div>
                <div class="modal-field" data-field="url">
                    <label for="am-chrome-url">Icon resource</label>
                    <input id="am-chrome-url" name="iconUrl" type="text" value="${String(
                        initial.iconUrl || ""
                    ).replace(/"/g, "&quot;")}" placeholder="URL / data: / blob:…" />
                </div>
            </div>
            <div class="modal-actions" role="group" aria-label="Icon design actions">
                <button type="button" data-action="reset" class="btn secondary">Reset</button>
                <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
                <button type="submit" class="btn save">Save</button>
            </div>
        </form>
    `;

    const form = modal.querySelector("form");
    const actions = form?.querySelector(".modal-actions") as HTMLElement | null;
    if (actions) {
        actions.style.setProperty("display", "grid", "important");
        actions.style.setProperty("grid-template-columns", "1fr auto auto", "important");
        actions.style.setProperty("align-items", "center", "important");
        actions.style.setProperty("gap", "0.45rem", "important");
    }
    const shapeSelect = modal.querySelector('select[name="shape"]') as HTMLSelectElement | null;
    const displaySelect = modal.querySelector('select[name="iconDisplay"]') as HTMLSelectElement | null;
    const iconInput = modal.querySelector('input[name="icon"]') as HTMLInputElement | null;
    const urlInput = modal.querySelector('input[name="iconUrl"]') as HTMLInputElement | null;
    const glyphField = modal.querySelector('[data-field="glyph"]') as HTMLElement | null;
    const urlField = modal.querySelector('[data-field="url"]') as HTMLElement | null;

    const sync = (): void => {
        const d = normalizeIconDisplay(displaySelect?.value) || "colored";
        if (glyphField) {
            if (d === "glyph") glyphField.removeAttribute("hidden");
            else glyphField.setAttribute("hidden", "");
        }
        if (urlField) {
            if (d === "glyph") urlField.setAttribute("hidden", "");
            else urlField.removeAttribute("hidden");
        }
    };
    displaySelect?.addEventListener("change", sync);
    sync();

    const close = (): void => {
        try {
            if (modal.open) modal.close();
        } catch {
            /* ignore */
        }
        modal.remove();
    };

    form?.addEventListener("click", (ev) => {
        const action = (ev.target as HTMLElement | null)?.closest?.("[data-action]")?.getAttribute("data-action");
        if (action === "cancel") {
            ev.preventDefault();
            close();
        }
        if (action === "reset") {
            ev.preventDefault();
            clearAppMenuTileChrome(opts.key);
            opts.onSave({});
            close();
        }
    });

    form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const chrome: AppMenuTileChrome = {
            shape: normalizeTileShape(shapeSelect?.value, "circle"),
            iconDisplay: normalizeIconDisplay(displaySelect?.value) || "colored",
            icon: String(iconInput?.value || "").trim(),
            iconUrl: String(urlInput?.value || "").trim()
        };
        setAppMenuTileChrome(opts.key, chrome);
        opts.onSave(chrome);
        close();
    });

    modal.addEventListener("cancel", (ev) => {
        ev.preventDefault();
        close();
    });

    document.body.append(modal);
    try {
        modal.showModal();
    } catch {
        modal.setAttribute("open", "");
    }
}
