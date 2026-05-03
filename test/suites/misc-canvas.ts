import { initializeAppCanvasLayer } from "../../src/ui/misc/Canvas-2";

export function mount(el: HTMLElement): void {
    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent = "Misc — app canvas layer (wallpaper + glow + ui-canvas).";
    cap.style.cssText = "position:relative;z-index:1;margin:0;padding:0.75rem 1rem;color:#e2e8f0;";
    el.appendChild(cap);

    el.style.position = "relative";
    el.style.minBlockSize = "280px";

    const layer = document.createElement("div");
    layer.setAttribute("data-app-layer", "canvas");
    layer.style.cssText = "position:absolute;inset:0";
    el.appendChild(layer);
    initializeAppCanvasLayer(layer);
}
