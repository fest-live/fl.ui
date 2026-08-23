/**
 * Underlying app canvas layer.
 *
 * Hosts background/image surface under shell windows.
 */

import "@fest-lib/dom";

const WALLPAPER_STORAGE_KEY = "rs-wallpaper-image";
const DEFAULT_WALLPAPER_URL = "/assets/wallpaper.jpg";

export type CanvasLayerState = {
    root: HTMLElement;
    canvas: HTMLCanvasElement;
    glow: HTMLDivElement;
};

export const initializeAppCanvasLayer = (container: HTMLElement): CanvasLayerState => {
    const root = container;
    root.replaceChildren();
    root.style.position = "absolute";
    root.style.inset = "0";
    root.style.overflow = "hidden";
    root.style.background = "none";
    root.style.backgroundColor = "transparent";

    const glow = document.createElement("div");
    glow.className = "app-canvas__glow";
    glow.style.position = "absolute";
    glow.style.inset = "-20%";
    glow.style.pointerEvents = "none";
    glow.style.opacity = "0.7";
    root.style.background = "none";
    root.style.backgroundColor = "transparent";
    
    const canvas = document.createElement("canvas", { is: "ui-canvas" }) as HTMLCanvasElement;
    canvas.className = "app-canvas__image";
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.insetBlockEnd = "auto";
    canvas.style.pointerEvents = "none";
    canvas.style.inlineSize = "100%";
    canvas.style.blockSize = "100%";
    canvas.style.maxInlineSize = "100%";
    canvas.style.maxBlockSize = "100%";
    canvas.style.opacity = "1";
    canvas.style.mixBlendMode = "normal";
    canvas.setAttribute("is", "ui-canvas");

    root.append(glow, canvas);

    const wallpaper = loadWallpaperUrl();
    canvas.setAttribute("data-src", wallpaper);

    return { root, canvas, glow };
};

export const setAppWallpaper = (wallpaperUrl: string): void => {
    const value = String(wallpaperUrl || "").trim() || DEFAULT_WALLPAPER_URL;
    try {
        localStorage.setItem(WALLPAPER_STORAGE_KEY, value);
    } catch {
        // ignore storage errors
    }

    const canvases = document.querySelectorAll<HTMLCanvasElement>('[data-app-layer="canvas"] canvas[is="ui-canvas"]');
    canvases.forEach((canvas) => canvas.setAttribute("data-src", value));
};

const loadWallpaperUrl = (): string => {
    try {
        const value = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        return value && value.trim() ? value.trim() : DEFAULT_WALLPAPER_URL;
    } catch {
        return DEFAULT_WALLPAPER_URL;
    }
};
