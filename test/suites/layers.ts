/*
 * Filename: layers.ts
 * FullPath: modules/projects/fl.ui/test/suites/layers.ts
 * Change date and time: 05.32.00_29.07.2026
 * Reason for changes: Overlay scrollbars via positioning:contain + anchored ScrollBar (no CSS-anchor host).
 */

import { createBlurShadow, appendAsOverlay, ScrollBar } from "@fest-lib/lure";

export function mount(el: HTMLElement): void {
    el.style.cssText =
        "display:flex;flex-direction:column;gap:1.5rem;padding:1rem;position:relative;box-sizing:border-box;";

    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent =
        "Layers — underlying glow under glass (backdrop) + overlay scrollbars on scrollable main.";
    el.appendChild(cap);

    // --- Glass + underlying ---
    const glassWrap = document.createElement("div");
    glassWrap.style.cssText =
        "position:relative;isolation:isolate;padding:2rem;background:radial-gradient(circle at 30% 20%,#1e3a5f,#0b1220 70%);border-radius:12px;";
    const main = document.createElement("div");
    main.className = "layers-demo-glass";
    main.style.cssText = [
        "position:relative;z-index:2;padding:1.25rem 1.5rem;border-radius:16px;",
        "backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);",
        "background:color-mix(in oklch,white 18%,transparent);",
        "border:1px solid color-mix(in oklch,white 35%,transparent);color:#e8edf5;",
    ].join("");
    main.textContent = "Glass card — underlying glow sits under backdrop blur";
    glassWrap.appendChild(main);
    el.appendChild(glassWrap);
    createBlurShadow(main, {
        shadowColor: "rgba(110,231,183,0.55)",
        shadowBlur: 18,
        shadowOffsetY: 0,
        zIndexShift: -1,
        cloneGeometry: true,
    });

    // --- Scroll + overlay scrollbars ---
    // WHY: host is the containing block; overlay is a sibling after main with plain absolute inset
    // (positioning:"contain") so nested abspos tracks get a real CB — CSS-anchor fill hosts break that.
    const scrollHost = document.createElement("div");
    scrollHost.style.cssText =
        "position:relative;isolation:isolate;inline-size:min(100%,28rem);block-size:14rem;border:1px solid #2a3650;border-radius:10px;background:#151d2e;overflow:hidden;";

    const scroller = document.createElement("div");
    scroller.className = "layers-demo-scroll";
    scroller.style.cssText = [
        "position:relative;z-index:1;overflow:auto;inline-size:100%;block-size:100%;",
        "padding:0.75rem;padding-inline-end:1rem;padding-block-end:1rem;color:#e8edf5;",
        "scrollbar-width:none;",
    ].join("");
    (scroller.style as any).msOverflowStyle = "none";
    scroller.innerHTML = `<div style="inline-size:48rem;block-size:28rem;white-space:pre-wrap;">${"Scroll me XY — overlay bars are siblings after main.\n".repeat(40)}</div>`;
    scrollHost.appendChild(scroller);

    const overlay = document.createElement("div");
    overlay.className = "c-overlaying layers-demo-overlay-scroll";
    overlay.style.cssText = "pointer-events:none;";

    const barY = document.createElement("div");
    barY.setAttribute("data-axis", "y");
    barY.setAttribute("axis", "y");
    barY.className = "ui-scrollbar";
    barY.style.cssText = [
        "position:absolute;top:6px;right:3px;bottom:14px;width:10px;",
        "pointer-events:auto;background:rgba(255,255,255,.18);border-radius:999px;overflow:hidden;z-index:2;",
    ].join("");
    const thumbY = document.createElement("div");
    thumbY.className = "ui-thumb";
    thumbY.style.cssText =
        "display:block;width:100%;height:40px;background:#6ee7b7;border-radius:999px;will-change:transform;";
    barY.appendChild(thumbY);

    const barX = document.createElement("div");
    barX.setAttribute("data-axis", "x");
    barX.setAttribute("axis", "x");
    barX.className = "ui-scrollbar";
    barX.style.cssText = [
        "position:absolute;left:6px;right:14px;bottom:3px;height:10px;",
        "pointer-events:auto;background:rgba(255,255,255,.18);border-radius:999px;overflow:hidden;z-index:2;",
    ].join("");
    const thumbX = document.createElement("div");
    thumbX.className = "ui-thumb";
    thumbX.style.cssText =
        "display:block;height:100%;width:40px;background:#6ee7b7;border-radius:999px;will-change:transform;";
    barX.appendChild(thumbX);

    overlay.append(barY, barX);
    el.appendChild(scrollHost);

    scroller.style.zIndex = "1";
    appendAsOverlay(scroller, overlay, scrollHost, {
        positioning: "contain",
        stackMode: "shift",
        zIndexShift: 1,
    });

    try {
        new ScrollBar(
            { holder: scrollHost, scrollbar: barX, content: scroller, layout: "anchored", autoHide: false },
            0,
        );
        new ScrollBar(
            { holder: scrollHost, scrollbar: barY, content: scroller, layout: "anchored", autoHide: false },
            1,
        );
    } catch (e) {
        console.warn("[layers demo] ScrollBar wire failed", e);
    }
}
