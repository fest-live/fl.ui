/*
 * Filename: ShortcutEditor.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/ShortcutEditor.ts
 * Change date and time: 12.45.00_03.08.2026
 * Reason for changes: Default Open link in → inline; dialog top-layer + div fields (not wrapper label).
 */
import { registerModal } from "fest/lure";

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
    /** Tile shape: square, circle, or squircle */
    shape: string;
    /** Open link: native immersive vs inline env window (same tab). */
    openLinkTarget: string;
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
                    <label for="sd-edit-icon">Icon</label>
                    <input id="sd-edit-icon" name="icon" type="text" placeholder="phosphor icon name" />
                </div>
                <div class="modal-field">
                    <label for="sd-edit-shape">Shape</label>
                    <select id="sd-edit-shape" name="shape">
                        <option value="squircle">Squircle</option>
                        <option value="circle">Circle</option>
                        <option value="square">Rounded square</option>
                        <option value="wavy">Wavy</option>
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
                        <option value="inline">Open Inline (env window, same tab)</option>
                        <option value="native-window">Native window (new browser window)</option>
                        <option value="new-tab">Open in new tab</option>
                    </select>
                </div>
                <div class="modal-field">
                    <label for="sd-edit-description">Description</label>
                    <textarea id="sd-edit-description" name="description" rows="2" placeholder="Optional description"></textarea>
                </div>
            </div>
            <footer class="modal-actions">
                <div class="modal-actions-left">
                    ${mode === "edit" ? '<button type="button" data-action="delete" class="btn danger">Delete</button>' : ""}
                </div>
                <div class="modal-actions-right">
                    <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
                    <button type="submit" class="btn save">Save</button>
                </div>
            </footer>
        </form>
    `;

    const form = modal.querySelector("form") as HTMLFormElement | null;
    const fields = form?.querySelector(".modal-fields") as HTMLElement | null;
    const labelInput = form?.querySelector('input[name="label"]') as HTMLInputElement | null;
    const iconInput = form?.querySelector('input[name="icon"]') as HTMLInputElement | null;
    const shapeSelect = form?.querySelector('select[name="shape"]') as HTMLSelectElement | null;
    const actionSelect = form?.querySelector('select[name="action"]') as HTMLSelectElement | null;
    const viewSelect = form?.querySelector('select[name="view"]') as HTMLSelectElement | null;
    const hrefInput = form?.querySelector('input[name="href"]') as HTMLInputElement | null;
    const openLinkTargetSelect = form?.querySelector('select[name="openLinkTarget"]') as HTMLSelectElement | null;
    const descriptionInput = form?.querySelector('textarea[name="description"]') as HTMLTextAreaElement | null;
    const viewField = form?.querySelector('[data-field="view"]') as HTMLElement | null;
    const hrefField = form?.querySelector('[data-field="href"]') as HTMLElement | null;
    const openLinkTargetField = form?.querySelector('[data-field="open-link-target"]') as HTMLElement | null;

    const labelValue = asDraftText(initial.label, "New shortcut");
    const iconValue = asDraftText(initial.icon, "sparkle");
    const hrefValue = asDraftText(initial.href, "");
    const descriptionValue = asDraftText(initial.description, "");
    const actionValue = asDraftText(initial.action, "open-view");
    const viewValue = asDraftText(initial.view, "");
    const shapeVal = asDraftText(initial.shape, "squircle").toLowerCase();
    const olt = asDraftText(initial.openLinkTarget, "inline").toLowerCase();

    fillTextControl(labelInput, labelValue);
    fillTextControl(iconInput, iconValue);
    if (shapeSelect) shapeSelect.value = ["circle", "square", "squircle"].includes(shapeVal) ? shapeVal : "squircle";
    if (openLinkTargetSelect) {
        openLinkTargetSelect.value =
            olt === "native-window" || olt === "native" || olt === "window"
                ? "native-window"
                : olt === "new-tab" || olt === "tab" || olt === "browser" || olt === "browser-tab"
                  ? "new-tab"
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
        if (viewField) viewField.hidden = !isViewAction(action);
        if (hrefField) hrefField.hidden = !isHrefAction(action);
        /* Show target mode for Open link (and when Open view also exposes Link). */
        if (openLinkTargetField) {
            openLinkTargetField.hidden = !(action === "open-link" || isHrefAction(action));
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
            openLinkTarget: (() => {
                const v = String(openLinkTargetSelect?.value || "inline").toLowerCase();
                if (v === "native-window" || v === "native" || v === "window") return "native-window";
                if (v === "new-tab" || v === "tab" || v === "browser") return "new-tab";
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
