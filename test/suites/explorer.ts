import "../../src/ui/explorer/FileManager";

export function mount(el: HTMLElement): void {
    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent = "Explorer — ui-file-manager (sandbox / OPFS capabilities vary by browser).";
    el.appendChild(cap);
    const fm = document.createElement("ui-file-manager");
    fm.setAttribute("path", "/");
    el.appendChild(fm);
}
