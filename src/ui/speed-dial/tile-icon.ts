/*
 * Filename: tile-icon.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/tile-icon.ts
 * Change date and time: 11.20.00_20.08.2026
 * Reason for changes: Per-tile icon display modes — glyph / masked / masked-inverse / colored.
 */

/** How a Speed Dial / App Menu tile paints its icon. */
export type IconDisplayMode = "glyph" | "masked" | "masked-inverse" | "colored";

export const ICON_DISPLAY_OPTIONS: Array<{ value: IconDisplayMode; label: string }> = [
    { value: "glyph", label: "Glyph (Phosphor)" },
    { value: "masked", label: "Masked" },
    { value: "masked-inverse", label: "Masked inverse" },
    { value: "colored", label: "Colored" }
];

export const TILE_SHAPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "circle", label: "Circle" },
    { value: "squircle", label: "Squircle" },
    { value: "square", label: "Rounded square" },
    { value: "wavy", label: "Wavy" }
];

export function normalizeIconDisplay(raw: unknown): IconDisplayMode | "" {
    const v = String(raw || "")
        .trim()
        .toLowerCase();
    if (v === "glyph" || v === "phosphor" || v === "name") return "glyph";
    if (v === "masked" || v === "mask") return "masked";
    if (v === "masked-inverse" || v === "mask-invert" || v === "invert") return "masked-inverse";
    if (v === "colored" || v === "color" || v === "bitmap" || v === "resource") return "colored";
    return "";
}

export function normalizeTileShape(raw: unknown, fallback = "squircle"): string {
    const v = String(raw || "")
        .trim()
        .toLowerCase();
    if (v === "circle" || v === "squircle" || v === "square" || v === "wavy") return v;
    return fallback;
}

/** Bitmap CSS mode for `ui-icon` (glyph has no bitmap mode). */
export function iconDisplayToBitmapMode(
    display: IconDisplayMode
): "colored" | "masked" | "masked-inverse" | null {
    if (display === "glyph") return null;
    return display;
}

export type TileIconPaintOptions = {
    display: IconDisplayMode;
    /** Phosphor name when display === glyph (also fallback). */
    glyph?: string;
    /** Resource URL / data: / blob: for masked | masked-inverse | colored. */
    resourceUrl?: string;
    launcher?: boolean;
    className?: string;
};

/** Build a `ui-icon` host for a tile; applies resource + locked bitmap mode when needed. */
export function createTileUiIconElement(opts: TileIconPaintOptions): HTMLElement {
    const host = document.createElement("ui-icon");
    const glyph = String(opts.glyph || "sparkle").trim() || "sparkle";
    const resource = String(opts.resourceUrl || "").trim();
    const display = normalizeIconDisplay(opts.display) || (resource ? "colored" : "glyph");
    const className = String(opts.className || "ui-ws-item-icon-native").trim();

    if (className) host.className = className;
    host.setAttribute("aria-hidden", "true");
    host.setAttribute("icon-style", "duotone");

    if (opts.launcher || display !== "glyph") {
        host.toggleAttribute("data-launcher-icon", true);
        host.setAttribute("icon-padding", "0");
        host.style.setProperty("--icon-padding", "0px");
        host.style.setProperty("--icon-size", "100%");
    }

    if (display === "glyph" || !resource) {
        host.setAttribute("icon", glyph);
        host.setAttribute("icon-source", "phosphor");
        host.removeAttribute("data-icon-bitmap");
        host.removeAttribute("data-icon-bitmap-mode");
        host.removeAttribute("data-icon-bitmap-locked");
        return host;
    }

    host.removeAttribute("icon");
    host.setAttribute("icon-source", "resource");
    const bitmapMode = iconDisplayToBitmapMode(display) || "colored";
    host.setAttribute("data-icon-bitmap-mode", bitmapMode);
    host.toggleAttribute("data-icon-bitmap-locked", true);

    const apply = (): void => {
        const icon = host as HTMLElement & {
            setResourceIcon?: (u: string, mode?: string) => unknown;
            setBitmapPresentationMode?: (m: string, locked?: boolean) => unknown;
        };
        if (typeof icon.setResourceIcon === "function") {
            icon.setResourceIcon(resource, bitmapMode);
            icon.setBitmapPresentationMode?.(bitmapMode, true);
        }
    };
    apply();
    void customElements.whenDefined("ui-icon").then(() => {
        if (!host.isConnected) {
            // Apply once connected so http(s) resources are not dropped pre-mount.
            queueMicrotask(() => {
                if (host.isConnected) apply();
            });
            return;
        }
        apply();
    });
    return host;
}

/** Infer default display when meta.iconDisplay is unset. */
export function inferIconDisplay(input: {
    iconDisplay?: unknown;
    iconUrl?: unknown;
    isLauncherApp?: boolean;
    isBookmarkFavicon?: boolean;
}): IconDisplayMode {
    const explicit = normalizeIconDisplay(input.iconDisplay);
    if (explicit) return explicit;
    if (input.isLauncherApp) return "colored";
    if (input.isBookmarkFavicon || String(input.iconUrl || "").trim()) return "colored";
    return "glyph";
}
