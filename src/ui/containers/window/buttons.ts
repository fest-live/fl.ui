/**
 * Material-style window chrome controls (icon buttons, ~40dp touch targets).
 * WHY: Isolated from shell so frames can swap icon sets or density later.
 */

export type ChromeButtonHandlers = {
    onMinimize: () => void;
    /** Toggle restore / maximize (desktop). */
    onMaximize: () => void;
    onClose: () => void;
};

function svgIcon(inner: string, viewBox = "0 0 24 24"): SVGSVGElement {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = inner;
    return svg;
}

/** Minimize — horizontal bar (Material minimize). */
export function chromeIconMinimize(): SVGSVGElement {
    return svgIcon('<path fill="currentColor" d="M6 17h12v2H6v-2Z"/>');
}

/** Maximize — outline square. */
export function chromeIconMaximize(): SVGSVGElement {
    return svgIcon('<path fill="currentColor" d="M7 7h10v10H7V7Zm2 2v6h6V9H9Z"/>');
}

/** Restore — overlapping tiles hint. */
export function chromeIconRestore(): SVGSVGElement {
    return svgIcon(
        '<path fill="currentColor" d="M4 8h9v9H4V8Zm2 2v5h5v-5H6Zm9-6v9H8v-2h7V6h2Zm-4 4h7v11H11V14Zm2 2v7h5v-7h-5Z"/>'
    );
}

/** Close — Material close. */
export function chromeIconClose(): SVGSVGElement {
    return svgIcon(
        '<path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'
    );
}

function wireChromeButton(b: HTMLButtonElement, handler: () => void): void {
    b.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            handler();
        },
        { capture: true }
    );
    b.addEventListener("pointerdown", (e) => e.stopPropagation(), { capture: true });
}

function styledBtn(label: string, icon: () => SVGSVGElement, extraClass?: string): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `wf-chrome-btn${extraClass ? ` ${extraClass}` : ""}`;
    b.setAttribute("aria-label", label);
    b.setAttribute("title", label);
    b.append(icon());
    return b;
}

export type ChromeButtonsApi = {
    setMaximizedGlyph: (v: boolean) => void;
};

/**
 * Mount minimize / maximize / close into `.wf-titlebar-actions`.
 */
export function mountChromeButtons(host: HTMLElement, handlers: ChromeButtonHandlers): ChromeButtonsApi {
    let maximized = false;
    const minBtn = styledBtn("Minimize", chromeIconMinimize);
    wireChromeButton(minBtn, handlers.onMinimize);

    const maxBtn = styledBtn("Maximize", chromeIconMaximize);
    const syncMaxGlyph = () => {
        maxBtn.replaceChildren(maximized ? chromeIconRestore() : chromeIconMaximize());
        maxBtn.setAttribute("aria-label", maximized ? "Restore down" : "Maximize");
        maxBtn.setAttribute("title", maximized ? "Restore down" : "Maximize");
    };
    wireChromeButton(maxBtn, handlers.onMaximize);
    syncMaxGlyph();

    const closeBtn = styledBtn("Close", chromeIconClose, "wf-chrome-btn_close");
    wireChromeButton(closeBtn, handlers.onClose);

    host.replaceChildren(minBtn, maxBtn, closeBtn);

    return {
        setMaximizedGlyph(v: boolean) {
            maximized = v;
            syncMaxGlyph();
        }
    };
}
