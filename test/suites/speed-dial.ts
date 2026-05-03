import { initializeOrientedDesktop } from "../../src/ui/speed-dial/OrientDesktop";

export function mount(el: HTMLElement): void {
    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent = "Speed dial — oriented desktop grid (persisted via fest/lure desktop storage).";
    cap.style.cssText = "position:relative;z-index:1;margin:0;padding:0.5rem 0.75rem;color:#e2e8f0;font-size:0.875rem;";
    el.appendChild(cap);

    el.style.position = "relative";
    el.style.minBlockSize = "360px";

    const host = document.createElement("div");
    host.style.cssText = "position:absolute;inset:0;min-block-size:320px;";
    el.appendChild(host);
    initializeOrientedDesktop(host);
}
