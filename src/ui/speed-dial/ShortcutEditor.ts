/*
 * Filename: ShortcutEditor.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/ShortcutEditor.ts
 * Change date and time: 12.45.00_03.08.2026
 * Reason for changes: Widget span/kind/clock/search fields in the shortcut editor.
 */
import { registerModal } from "@fest-lib/lure";
import {
    ICON_DISPLAY_OPTIONS,
    TILE_SHAPE_OPTIONS,
    normalizeIconDisplay,
    type IconDisplayMode
} from "./tile-icon";
import { ICON_BITMAP_SCALE_OPTIONS, normalizeItemIconBitmapScale } from "./launcher-state";
import { attachIconResourcePickButton } from "./icon-resource-picker";

/** WHY: Match context-menu pin — Settings may not have applied data-theme yet. */
function resolveEditorTheme(): "light" | "dark" {
    const root = document.documentElement;
    const pinned = String(root.getAttribute("data-theme") || "").trim().toLowerCase();
    if (pinned === "light" || pinned === "dark") return pinned;
    const scheme = String(root.getAttribute("data-scheme") || "").trim().toLowerCase();
    if (scheme === "light" || scheme === "dark") return scheme;
    try {
        const stored = String(localStorage.getItem("rs-appearance-theme") || "").trim().toLowerCase();
        if (stored === "light" || stored === "dark") return stored;
    } catch {
        // private mode
    }
    return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
}

function synthesizeViewHref(view: string, openLinkTarget = "inline"): string {
    const id = String(view || "").trim().replace(/^#/, "").replace(/^\/+/, "");
    if (!id) return "";
    const target = String(openLinkTarget || "inline").trim().toLowerCase();
    /* WHY: native=1 only for native-window; inline / new-tab stay in-shell / tab without mono flag. */
    const native = target === "native-window" || target === "native" || target === "window" ? "&native=1" : "";
    return `/${id}?shell=environment${native}&view=${encodeURIComponent(id)}`;
}

/** WHY: Coerce fest refs / odd wrappers into a plain string for form controls. */
function asDraftText(value: unknown, fallback = ""): string {
    if (value == null) return fallback;
    if (typeof value === "object" && value !== null && "value" in (value as object)) {
        const inner = (value as { value: unknown }).value;
        if (inner == null) return fallback;
        return String(inner);
    }
    const text = String(value);
    return text || fallback;
}

function fillTextControl(
    el: HTMLInputElement | HTMLTextAreaElement | null,
    value: string
): void {
    if (!el) return;
    el.value = value;
    /* COMPAT: some UA / CSS paths still paint from the attribute for first paint. */
    if (el instanceof HTMLInputElement) el.setAttribute("value", value);
}

export type ShortcutActionOption = {
    value: string;
    label: string;
};

export type ShortcutViewOption = {
    value: string;
    label: string;
};

export type ShortcutEditorDraft = {
    label: string;
    icon: string;
    action: string;
    view: string;
    href: string;
    description: string;
    /** Tile shape: square, circle, squircle, wavy */
    shape: string;
    /** glyph | masked | masked-inverse | colored */
    iconDisplay: IconDisplayMode | string;
    /** Resource for non-glyph modes (URL / data: / android-icon:) */
    iconUrl: string;
    /**
     * Per-tile bitmap zoom: `auto` | `fit` | `fill` | `zoom` | `max`.
     */
    iconScale?: string;
    /** Open link: native immersive vs inline env window (same tab). */
    openLinkTarget: string;
    /** Android package for launch-app tiles — seeds icon picker variants. */
    packageName?: string;
    widgetKind?: string;
    spanCols?: number;
    spanRows?: number;
    clockFormat?: string;
    searchUrl?: string;
};

type ShortcutEditorOptions = {
    mode: "create" | "edit";
    initial: ShortcutEditorDraft;
    actionOptions: ShortcutActionOption[];
    viewOptions: ShortcutViewOption[];
    onSave: (draft: ShortcutEditorDraft) => void;
    onDelete?: () => void;
    isViewAction?: (action: string) => boolean;
    isHrefAction?: (action: string) => boolean;
    isWidgetAction?: (action: string) => boolean;
    registerForBackNavigation?: boolean;
};

const isDefaultViewAction = (action: string): boolean => action === "open-view";
const isDefaultHrefAction = (action: string): boolean => action === "open-link";

const setSelectOptions = (
    select: HTMLSelectElement | null,
    options: Array<{ value: string; label: string }>,
    selectedValue: string,
    placeholder?: { value: string; label: string }
): void => {
    if (!select) return;
    select.innerHTML = "";
    if (placeholder) {
        const placeholderOption = document.createElement("option");
        placeholderOption.value = placeholder.value;
        placeholderOption.textContent = placeholder.label;
        placeholderOption.selected = selectedValue === placeholder.value;
        select.append(placeholderOption);
    }
    for (const option of options) {
        const node = document.createElement("option");
        node.value = option.value;
        node.textContent = option.label;
        node.selected = option.value === selectedValue;
        select.append(node);
    }
    if (selectedValue && !options.some((option) => option.value === selectedValue)) {
        const fallbackOption = document.createElement("option");
        fallbackOption.value = selectedValue;
        fallbackOption.textContent = selectedValue;
        fallbackOption.selected = true;
        select.append(fallbackOption);
    }
    /* INVARIANT: selectedIndex must reflect draft even if option.selected races. */
    if (selectedValue) select.value = selectedValue;
};

export const openShortcutEditor = (options: ShortcutEditorOptions): void => {
    const {
        mode,
        initial,
        actionOptions,
        viewOptions,
        onSave,
        onDelete,
        isViewAction = isDefaultViewAction,
        isHrefAction = isDefaultHrefAction,
        isWidgetAction = (action: string) => action === "widget",
        registerForBackNavigation = false
    } = options;

    /*
     * WHY: <dialog>.showModal() promotes to the top layer — beats overlay
     * `pointer-events: none` hosts, shell chrome z-index, and open ui-window frames.
     * Drop `modal-form` so global `.modal-form { contain: strict }` never attaches.
     */
    const modal = document.createElement("dialog");
    modal.className = "speed-dial-editor";
    const theme = resolveEditorTheme();
    modal.dataset.theme = theme;
    /*
     * WHY: global `:where(label) { pointer-events: none }` (fl.ui normalize) makes
     * wrapper <label> fields untouchable — clicks fall through to `.modal-fields`.
     * Use <div class="modal-field"> + <label for> so controls stay hittable.
     */
    modal.innerHTML = `
        <form class="speed-dial-editor__form" data-theme="${theme}" autocomplete="off">
            <header class="modal-header">
                <h2 class="modal-title">${mode === "create" ? "Create shortcut" : "Edit shortcut"}</h2>
                <p class="modal-description">Configure quick access tiles for frequently used views or links.</p>
            </header>
            <div class="modal-fields">
                <div class="modal-field">
                    <label for="sd-edit-label">Label</label>
                    <input id="sd-edit-label" name="label" type="text" minlength="1" required />
                </div>
                <div class="modal-field">
                    <label for="sd-edit-icon-display">Icon display</label>
                    <select id="sd-edit-icon-display" name="iconDisplay">
                        ${ICON_DISPLAY_OPTIONS.map(
                            (o) => `<option value="${o.value}">${o.label}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="modal-field" data-field="icon-glyph">
                    <label for="sd-edit-icon">Icon (Phosphor name)</label>
                    <input id="sd-edit-icon" name="icon" type="text" placeholder="phosphor icon name" />
                </div>
                <div class="modal-field" data-field="icon-url">
                    <label for="sd-edit-icon-url">Icon resource</label>
                    <div class="sd-icon-resource-row">
                        <input id="sd-edit-icon-url" name="iconUrl" type="text" inputmode="url" autocomplete="off" placeholder="URL, data:, or android-icon:…" />
                        <button type="button" class="btn secondary sd-icon-resource-pick" data-action="pick-icon" title="Pick alternative icon" aria-label="Pick alternative icon">
                            <ui-icon icon="squares-four" icon-style="duotone" aria-hidden="true"></ui-icon>
                        </button>
                        <button type="button" class="btn secondary sd-icon-resource-pick" data-action="pick-photo" title="Use photo / avatar" aria-label="Use photo or avatar">
                            <ui-icon icon="user-circle" icon-style="duotone" aria-hidden="true"></ui-icon>
                        </button>
                    </div>
                </div>
                <div class="modal-field">
                    <label for="sd-edit-shape">Shape</label>
                    <select id="sd-edit-shape" name="shape">
                        ${TILE_SHAPE_OPTIONS.map(
                            (o) => `<option value="${o.value}">${o.label}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="modal-field">
                    <label for="sd-edit-icon-scale">Icon scale (inside plate)</label>
                    <select id="sd-edit-icon-scale" name="iconScale">
                        ${ICON_BITMAP_SCALE_OPTIONS.map(
                            (o) => `<option value="${o.value}">${o.label}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="modal-field">
                    <label for="sd-edit-action">Action</label>
                    <select id="sd-edit-action" name="action"></select>
                </div>
                <div class="modal-field" data-field="view">
                    <label for="sd-edit-view">View</label>
                    <select id="sd-edit-view" name="view"></select>
                </div>
                <div class="modal-field" data-field="href">
                    <label for="sd-edit-href">Link</label>
                    <input id="sd-edit-href" name="href" type="text" inputmode="url" autocomplete="off" placeholder="/settings?native=1, /workcenter, or https://…" />
                </div>
                <div class="modal-field" data-field="open-link-target">
                    <label for="sd-edit-open-target">Open link in</label>
                    <select id="sd-edit-open-target" name="openLinkTarget">
                        <option value="inline">Open Inline (iframe window, same tab)</option>
                        <option value="external-app">Open in app (Android chooser)</option>
                        <option value="native-window">Native window (new browser window)</option>
                        <option value="new-tab">Open in new tab</option>
                    </select>
                </div>
                <div class="modal-field" data-field="widget-kind">
                    <label for="sd-edit-widget-kind">Widget</label>
                    <select id="sd-edit-widget-kind" name="widgetKind">
                        <option value="clock">Clock</option>
                        <option value="search">Search</option>
                        <option value="android">Android</option>
                    </select>
                </div>
                <div class="modal-field" data-field="span">
                    <label for="sd-edit-span-cols">Size (columns × rows)</label>
                    <div class="sd-icon-resource-row">
                        <input id="sd-edit-span-cols" name="spanCols" type="number" min="1" max="8" step="1" />
                        <input id="sd-edit-span-rows" name="spanRows" type="number" min="1" max="8" step="1" />
                    </div>
                </div>
                <div class="modal-field" data-field="clock-format">
                    <label for="sd-edit-clock-format">Clock format</label>
                    <select id="sd-edit-clock-format" name="clockFormat">
                        <option value="24h">24-hour</option>
                        <option value="12h">12-hour</option>
                    </select>
                </div>
                <div class="modal-field" data-field="search-url">
                    <label for="sd-edit-search-url">Search URL (%s = query)</label>
                    <input id="sd-edit-search-url" name="searchUrl" type="url" placeholder="https://www.google.com/search?q=%s" />
                </div>
                <div class="modal-field">
                    <label for="sd-edit-description">Description</label>
                    <textarea id="sd-edit-description" name="description" rows="2" placeholder="Optional description"></textarea>
                </div>
            </div>
            <div class="modal-actions" role="group" aria-label="Shortcut actions">
                ${mode === "edit" ? '<button type="button" data-action="delete" class="btn danger">Delete</button>' : '<span class="modal-actions-spacer" aria-hidden="true"></span>'}
                <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
                <button type="submit" class="btn save">Save</button>
            </div>
        </form>
    `;

    const form = modal.querySelector("form") as HTMLFormElement | null;
    /* WHY: Cap WebView kept stacking left/right wrappers despite CSS nowrap — pin row via grid + inline style. */
    const actions = form?.querySelector(".modal-actions") as HTMLElement | null;
    if (actions) {
        actions.style.setProperty("display", "grid", "important");
        actions.style.setProperty("grid-template-columns", "1fr auto auto", "important");
        actions.style.setProperty("align-items", "center", "important");
        actions.style.setProperty("gap", "0.45rem", "important");
        actions.style.setProperty("flex-wrap", "nowrap", "important");
    }
    const fields = form?.querySelector(".modal-fields") as HTMLElement | null;
    const labelInput = form?.querySelector('input[name="label"]') as HTMLInputElement | null;
    const iconInput = form?.querySelector('input[name="icon"]') as HTMLInputElement | null;
    const iconDisplaySelect = form?.querySelector('select[name="iconDisplay"]') as HTMLSelectElement | null;
    const iconUrlInput = form?.querySelector('input[name="iconUrl"]') as HTMLInputElement | null;
    const shapeSelect = form?.querySelector('select[name="shape"]') as HTMLSelectElement | null;
    const iconScaleSelect = form?.querySelector('select[name="iconScale"]') as HTMLSelectElement | null;
    const actionSelect = form?.querySelector('select[name="action"]') as HTMLSelectElement | null;
    const viewSelect = form?.querySelector('select[name="view"]') as HTMLSelectElement | null;
    const hrefInput = form?.querySelector('input[name="href"]') as HTMLInputElement | null;
    const openLinkTargetSelect = form?.querySelector('select[name="openLinkTarget"]') as HTMLSelectElement | null;
    const descriptionInput = form?.querySelector('textarea[name="description"]') as HTMLTextAreaElement | null;
    const viewField = form?.querySelector('[data-field="view"]') as HTMLElement | null;
    const hrefField = form?.querySelector('[data-field="href"]') as HTMLElement | null;
    const openLinkTargetField = form?.querySelector('[data-field="open-link-target"]') as HTMLElement | null;
    const iconGlyphField = form?.querySelector('[data-field="icon-glyph"]') as HTMLElement | null;
    const iconUrlField = form?.querySelector('[data-field="icon-url"]') as HTMLElement | null;
    const widgetKindField = form?.querySelector('[data-field="widget-kind"]') as HTMLElement | null;
    const spanField = form?.querySelector('[data-field="span"]') as HTMLElement | null;
    const clockFormatField = form?.querySelector('[data-field="clock-format"]') as HTMLElement | null;
    const searchUrlField = form?.querySelector('[data-field="search-url"]') as HTMLElement | null;
    const widgetKindSelect = form?.querySelector('select[name="widgetKind"]') as HTMLSelectElement | null;
    const spanColsInput = form?.querySelector('input[name="spanCols"]') as HTMLInputElement | null;
    const spanRowsInput = form?.querySelector('input[name="spanRows"]') as HTMLInputElement | null;
    const clockFormatSelect = form?.querySelector('select[name="clockFormat"]') as HTMLSelectElement | null;
    const searchUrlInput = form?.querySelector('input[name="searchUrl"]') as HTMLInputElement | null;

    const packageNameOf = (): string => String(initial.packageName || "").trim();
    const pageUrlOf = (): string => {
        const fromHref = String(hrefInput?.value || "").trim();
        if (/^https?:\/\//i.test(fromHref)) return fromHref;
        const fromInitial = String(initial.href || "").trim();
        return /^https?:\/\//i.test(fromInitial) ? fromInitial : "";
    };

    if (iconUrlField && iconUrlInput) {
        attachIconResourcePickButton(iconUrlField, iconUrlInput, {
            packageName: packageNameOf,
            pageUrl: pageUrlOf,
            theme
        });
    }

    const labelValue = asDraftText(initial.label, "New shortcut");
    const iconValue = asDraftText(initial.icon, "sparkle");
    const iconUrlValue = asDraftText(initial.iconUrl, "");
    const hrefValue = asDraftText(initial.href, "");
    const descriptionValue = asDraftText(initial.description, "");
    const actionValue = asDraftText(initial.action, "open-view");
    const viewValue = asDraftText(initial.view, "");
    const shapeVal = asDraftText(initial.shape, "squircle").toLowerCase();
    const iconDisplayVal = normalizeIconDisplay(initial.iconDisplay) || "glyph";
    const iconScaleVal = normalizeItemIconBitmapScale(initial.iconScale);
    const olt = asDraftText(initial.openLinkTarget, "inline").toLowerCase();
    const widgetKindVal = asDraftText(initial.widgetKind, "clock").toLowerCase();
    if (widgetKindSelect) {
        if (widgetKindVal !== "android") {
            widgetKindSelect.querySelector('option[value="android"]')?.remove();
        }
        widgetKindSelect.value = widgetKindVal === "search" || widgetKindVal === "android" ? widgetKindVal : "clock";
    }
    if (spanColsInput) spanColsInput.value = String(Math.max(1, Math.min(8, Number(initial.spanCols) || 1)));
    if (spanRowsInput) spanRowsInput.value = String(Math.max(1, Math.min(8, Number(initial.spanRows) || 1)));
    if (clockFormatSelect) clockFormatSelect.value = String(initial.clockFormat || "24h").toLowerCase() === "12h" ? "12h" : "24h";
    fillTextControl(searchUrlInput, asDraftText(initial.searchUrl, ""));

    fillTextControl(labelInput, labelValue);
    fillTextControl(iconInput, iconValue);
    fillTextControl(iconUrlInput, iconUrlValue);
    if (iconDisplaySelect) iconDisplaySelect.value = iconDisplayVal;
    if (shapeSelect) shapeSelect.value = ["circle", "square", "squircle", "wavy"].includes(shapeVal) ? shapeVal : "squircle";
    if (iconScaleSelect) iconScaleSelect.value = iconScaleVal;
    if (openLinkTargetSelect) {
        openLinkTargetSelect.value =
            olt === "native-window" || olt === "native" || olt === "window"
                ? "native-window"
                : olt === "new-tab" || olt === "tab" || olt === "browser" || olt === "browser-tab"
                  ? "new-tab"
                  : olt === "external-app" ||
                      olt === "app" ||
                      olt === "chooser" ||
                      olt === "open-with" ||
                      olt === "open-in-app"
                    ? "external-app"
                    : "inline";
    }
    if (hrefInput) {
        fillTextControl(hrefInput, hrefValue);
        const autoHref = synthesizeViewHref(viewValue, openLinkTargetSelect?.value || olt);
        if (autoHref) hrefInput.placeholder = `Auto: ${autoHref}`;
    }
    fillTextControl(descriptionInput, descriptionValue);

    setSelectOptions(actionSelect, actionOptions, actionValue);
    setSelectOptions(viewSelect, viewOptions, viewValue, { value: "", label: "Choose view" });

    const currentOpenTarget = () => String(openLinkTargetSelect?.value || olt || "inline");

    const syncFieldVisibility = () => {
        const action = String(actionSelect?.value || "");
        const widgetOn = isWidgetAction(action);
        const kind = String(widgetKindSelect?.value || widgetKindVal || "clock");
        if (viewField) viewField.hidden = !isViewAction(action) || widgetOn;
        if (hrefField) hrefField.hidden = !isHrefAction(action) || widgetOn;
        /* Show target mode for Open link (and when Open view also exposes Link). */
        if (openLinkTargetField) {
            openLinkTargetField.hidden = widgetOn || !(action === "open-link" || isHrefAction(action));
        }
        const toggleField = (node: HTMLElement | null, show: boolean): void => {
            if (!node) return;
            if (show) node.removeAttribute("hidden");
            else node.setAttribute("hidden", "");
        };
        toggleField(widgetKindField, widgetOn);
        toggleField(spanField, widgetOn);
        toggleField(clockFormatField, widgetOn && kind === "clock");
        toggleField(searchUrlField, widgetOn && kind === "search");
        const display = normalizeIconDisplay(iconDisplaySelect?.value) || "glyph";
        /* WHY: Capacitor WebView sometimes keeps [hidden] stuck with .hidden=false — use attributes. */
        if (iconGlyphField) {
            if (display === "glyph") iconGlyphField.removeAttribute("hidden");
            else iconGlyphField.setAttribute("hidden", "");
        }
        if (iconUrlField) {
            if (display === "glyph") iconUrlField.setAttribute("hidden", "");
            else iconUrlField.removeAttribute("hidden");
        }
        /* Prefill Open-link from view when switching to link action with empty href. */
        if (action === "open-link" && hrefInput && !String(hrefInput.value || "").trim()) {
            const fromView = synthesizeViewHref(String(viewSelect?.value || viewValue || ""), currentOpenTarget());
            if (fromView) hrefInput.value = fromView;
        }
        const autoHref = synthesizeViewHref(String(viewSelect?.value || viewValue || ""), currentOpenTarget());
        if (hrefInput && autoHref) {
            hrefInput.placeholder = `Auto: ${autoHref}`;
        }
    };

    viewSelect?.addEventListener("change", () => {
        const autoHref = synthesizeViewHref(String(viewSelect?.value || ""), currentOpenTarget());
        if (hrefInput && autoHref) hrefInput.placeholder = `Auto: ${autoHref}`;
    });
    openLinkTargetSelect?.addEventListener("change", syncFieldVisibility);

    let closed = false;
    let unregisterBackNav: (() => void) | null = null;

    const closeModal = () => {
        if (closed) return;
        closed = true;
        unregisterBackNav?.();
        unregisterBackNav = null;
        try {
            if (modal.open) modal.close();
        } catch {
            // already closed
        }
        modal.remove();
    };

    actionSelect?.addEventListener("change", syncFieldVisibility);
    widgetKindSelect?.addEventListener("change", syncFieldVisibility);
    iconDisplaySelect?.addEventListener("change", syncFieldVisibility);
    syncFieldVisibility();

    modal.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeModal();
    });

    modal.addEventListener("click", (event) => {
        /* Clicks on dialog padding (outside the form panel) dismiss. */
        if (event.target === modal) closeModal();
    });

    /* WHY: keep pointer path inside the panel; never let shell handlers steal focus. */
    form?.addEventListener(
        "pointerdown",
        (event) => {
            event.stopPropagation();
        },
        true
    );

    form?.addEventListener("click", (event) => {
        const target = event.target as HTMLElement | null;
        const action = target?.closest?.("[data-action]")?.getAttribute?.("data-action") || target?.dataset?.action || "";
        if (action === "cancel") {
            event.preventDefault();
            closeModal();
            return;
        }
        if (action === "delete" && mode === "edit") {
            event.preventDefault();
            onDelete?.();
            closeModal();
        }
    });

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        onSave({
            label: String(labelInput?.value || "").trim() || "Item",
            icon: String(iconInput?.value || "").trim() || "sparkle",
            action: String(actionSelect?.value || "open-view"),
            view: String(viewSelect?.value || "").trim(),
            href: String(hrefInput?.value || "").trim(),
            description: String(descriptionInput?.value || "").trim(),
            shape: String(shapeSelect?.value || "squircle").toLowerCase(),
            iconDisplay: normalizeIconDisplay(iconDisplaySelect?.value) || "glyph",
            iconUrl: String(iconUrlInput?.value || "").trim(),
            iconScale: normalizeItemIconBitmapScale(iconScaleSelect?.value),
            widgetKind: String(widgetKindSelect?.value || "clock"),
            spanCols: Math.max(1, Math.min(8, Number(spanColsInput?.value) || 1)),
            spanRows: Math.max(1, Math.min(8, Number(spanRowsInput?.value) || 1)),
            clockFormat: String(clockFormatSelect?.value || "24h"),
            searchUrl: String(searchUrlInput?.value || "").trim(),
            openLinkTarget: (() => {
                const v = String(openLinkTargetSelect?.value || "inline").toLowerCase();
                if (v === "native-window" || v === "native" || v === "window") return "native-window";
                if (v === "new-tab" || v === "tab" || v === "browser") return "new-tab";
                if (
                    v === "external-app" ||
                    v === "app" ||
                    v === "chooser" ||
                    v === "open-with" ||
                    v === "open-in-app"
                ) {
                    return "external-app";
                }
                return "inline";
            })()
        });
        closeModal();
    });

    if (registerForBackNavigation) {
        unregisterBackNav = registerModal(modal, undefined, closeModal);
    }

    modal.style.setProperty("color-scheme", theme === "light" ? "light only" : "dark only", "important");
    form?.style.setProperty("color-scheme", theme === "light" ? "light only" : "dark only", "important");
    form?.style.setProperty("pointer-events", "auto", "important");
    form?.style.setProperty("contain", "none", "important");
    form?.style.setProperty("content-visibility", "visible", "important");

    /* WHY: belt-and-suspenders against normalize / shell PE rules on controls. */
    form?.querySelectorAll("input, select, textarea, button").forEach((node) => {
        const el = node as HTMLElement;
        el.style.setProperty("pointer-events", "auto", "important");
        el.style.setProperty("position", "relative", "important");
        el.style.setProperty("z-index", "1", "important");
    });

    /* INVARIANT: body + top layer — do not mount under [data-env-shell-overlays] (pointer-events: none). */
    document.body.append(modal);
    try {
        modal.showModal();
    } catch {
        /* COMPAT: rare environments without dialog API — still show as fixed overlay. */
        modal.setAttribute("open", "");
        modal.style.setProperty("position", "fixed", "important");
        modal.style.setProperty("inset", "0", "important");
        modal.style.setProperty("z-index", "2147483646", "important");
    }

    requestAnimationFrame(() => {
        if (fields) fields.scrollTop = 0;
        /* Re-assert draft after mount (guards against UA resetting controls). */
        fillTextControl(labelInput, labelValue);
        fillTextControl(iconInput, iconValue);
        fillTextControl(descriptionInput, descriptionValue);
        if (actionSelect && actionValue) actionSelect.value = actionValue;
        if (viewSelect && viewValue) viewSelect.value = viewValue;
        labelInput?.focus({ preventScroll: true });
    });
};
