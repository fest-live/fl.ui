/*
 * Filename: speed-dial.ts
 * FullPath: modules/projects/fl.ui/test/suites/speed-dial.ts
 * Change date and time: 18.48.00_28.07.2026
 * Reason for changes: Exercise the canonical renderer, mutable orient attribute, and drag lifecycle.
 */
import { initializeOrientedDesktop } from "../../src/ui/speed-dial/OrientDesktop";

export function mount(el: HTMLElement): void {
    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent = "Speed dial — orient mutation and pointer drag smoke test.";
    cap.style.cssText = "position:relative;z-index:1;margin:0;padding:0.5rem 0.75rem;color:#e2e8f0;font-size:0.875rem;";
    el.appendChild(cap);

    el.style.position = "relative";
    el.style.minBlockSize = "700px";

    const controls = document.createElement("div");
    controls.style.cssText = "position:relative;z-index:2;display:flex;align-items:center;gap:0.35rem;padding:0 0.75rem;color:#cbd5e1;font-size:0.75rem;";
    const status = document.createElement("span");
    status.textContent = "orient: 0 · ready";
    controls.append("orient:");
    for (const orient of [0, 1, 2, 3]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(orient);
        button.dataset.orient = String(orient);
        button.style.cssText = "min-inline-size:1.6rem;padding:0.15rem 0.35rem;";
        controls.appendChild(button);
    }
    controls.appendChild(status);
    el.appendChild(controls);

    const host = document.createElement("div");
    host.style.cssText = "position:absolute;inset:3rem 0 0;min-block-size:640px;";
    el.appendChild(host);
    initializeOrientedDesktop(host);

    const root = host.querySelector<HTMLElement>(".speed-dial-root");
    if (!root) return;
    root.setAttribute("orient", "0");
    status.textContent = "orient: 0 · ready";
    controls.querySelectorAll<HTMLButtonElement>("button[data-orient]").forEach((button) => {
        button.addEventListener("click", () => {
            root.setAttribute("orient", button.dataset.orient || "0");
            status.textContent = `orient: ${root.getAttribute("orient")} · ready`;
        });
    });
    root.addEventListener("m-dragstart", () => {
        status.textContent = `orient: ${root.getAttribute("orient")} · dragging`;
    });
    root.addEventListener("m-dragsettled", () => {
        status.textContent = `orient: ${root.getAttribute("orient")} · placed`;
    });
}
