/*
 * Filename: anchors.ts
 * FullPath: modules/projects/fl.ui/test/suites/anchors.ts
 * Reason for changes: Exercise progressive CSS Anchor and JS placement cleanup.
 */

import { placeOverlay, type OverlayPlacementStrategy, type PlacementHandle } from "@fest-lib/lure";

const panelStyle =
    "position:fixed;z-index:20;min-inline-size:10rem;padding:.65rem .8rem;border:1px solid #3f5278;border-radius:10px;background:#18243b;color:#e8edf5;box-shadow:0 10px 28px rgba(0,0,0,.35);";

export function mount(el: HTMLElement): void {
    el.style.cssText =
        "display:flex;flex-direction:column;gap:1rem;padding:1rem;position:relative;box-sizing:border-box;";

    const caption = document.createElement("p");
    caption.className = "fl-ui-dev-suite-caption";
    caption.textContent =
        "Anchors — element placement uses CSS Anchor Positioning when supported; point placement always uses the shared JS solver.";

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;";
    const autoButton = document.createElement("button");
    autoButton.type = "button";
    autoButton.textContent = "Open element overlay (auto)";
    const jsButton = document.createElement("button");
    jsButton.type = "button";
    jsButton.textContent = "Open element overlay (JS)";
    const pointButton = document.createElement("button");
    pointButton.type = "button";
    pointButton.textContent = "Open point menu at edge";
    const status = document.createElement("output");
    status.style.cssText = "font:0.8rem ui-monospace,monospace;color:#9bb6df;";
    controls.append(autoButton, jsButton, pointButton, status);

    const stage = document.createElement("div");
    stage.style.cssText =
        "position:relative;isolation:isolate;min-block-size:14rem;border:1px dashed #3f5278;border-radius:12px;background:linear-gradient(135deg,#111b2d,#0c1220);";
    const anchor = document.createElement("button");
    anchor.type = "button";
    anchor.textContent = "Element anchor";
    anchor.style.cssText =
        "position:absolute;inset:auto .75rem .75rem auto;padding:.45rem .7rem;border:0;border-radius:8px;background:#6ee7b7;color:#10231c;font-weight:700;";
    stage.appendChild(anchor);

    let current: PlacementHandle | null = null;
    let currentPanel: HTMLElement | null = null;
    const close = () => {
        current?.dispose();
        current = null;
        currentPanel?.remove();
        currentPanel = null;
    };
    const openElement = (strategy: OverlayPlacementStrategy) => {
        close();
        const panel = document.createElement("div");
        panel.style.cssText = panelStyle;
        panel.textContent = "Element-origin overlay: reopen to verify cleanup.";
        document.body.appendChild(panel);
        currentPanel = panel;
        current = placeOverlay(panel, {
            origin: { type: "element", element: anchor },
            placement: "right-start",
            fallbacks: ["left-start", "right-end", "left-end"],
            strategy,
        });
        status.value = `strategy: ${current.strategy}`;
    };
    const openPoint = () => {
        close();
        const rect = stage.getBoundingClientRect();
        const panel = document.createElement("div");
        panel.style.cssText = panelStyle;
        panel.textContent = "Point-origin menu: the solver flips/clamps at viewport edges.";
        document.body.appendChild(panel);
        currentPanel = panel;
        current = placeOverlay(panel, {
            origin: { type: "point", x: rect.right - 4, y: rect.bottom - 4 },
            placement: "bottom-start",
            strategy: "js",
        });
        status.value = `strategy: ${current.strategy}`;
    };

    autoButton.addEventListener("click", () => openElement("auto"));
    jsButton.addEventListener("click", () => openElement("js"));
    pointButton.addEventListener("click", openPoint);
    anchor.addEventListener("click", () => openElement("auto"));
    el.append(caption, controls, stage);
}
