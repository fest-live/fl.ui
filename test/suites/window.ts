/*
 * Filename: window.ts
 * FullPath: modules/projects/fl.ui/test/suites/window.ts
 * Change date and time: 18.05.00_28.07.2026
 * Reason for changes: Dev playground suite for <ui-window> light/dark chrome + controls.
 */
import "../../src/ui/containers/window/Windows2";
import "@fest-lib/icon";

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: Record<string, string> = {},
    text?: string
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) node.setAttribute(k, v);
    if (text != null) node.textContent = text;
    return node;
}

function makeWindow(opts: {
    title: string;
    theme?: "light" | "dark";
    body: string;
    footer?: string;
    left?: string;
    top?: string;
}): HTMLElement {
    const win = document.createElement("ui-window") as HTMLElement;
    if (opts.theme) win.setAttribute("data-theme", opts.theme);
    win.style.position = "absolute";
    win.style.left = opts.left ?? "1.25rem";
    win.style.top = opts.top ?? "1.25rem";
    win.style.setProperty("--ui-win-width", "22rem");
    win.style.setProperty("--ui-win-height", "14rem");

    const title = el("span", { slot: "title" }, opts.title);
    const content = el("div", { slot: "content" });
    content.innerHTML = `<p style="margin:0 0 0.75rem">${opts.body}</p>
        <p style="margin:0;opacity:0.75;font-size:0.8rem">Drag the titlebar · try minimize / maximize / close.</p>`;

    win.append(title, content);

    if (opts.footer) {
        const footer = el("div", { slot: "footer" }, opts.footer);
        win.append(footer);
    }

    return win;
}

export function mount(elRoot: HTMLElement): void {
    const cap = document.createElement("p");
    cap.className = "fl-ui-dev-suite-caption";
    cap.textContent =
        "Window — <ui-window> with light/dark tokens, phosphor controls (minus / corners-out / x).";
    elRoot.appendChild(cap);

    const toolbar = document.createElement("div");
    toolbar.style.cssText =
        "display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.65rem 1rem;border-bottom:1px solid var(--fl-dev-border,#2a3650);";

    const themeBtn = el("button", { type: "button" }, "Toggle playground theme");
    themeBtn.style.cssText =
        "cursor:pointer;border:1px solid var(--fl-dev-border,#2a3650);background:var(--fl-dev-surface,#151d2e);color:inherit;padding:0.4rem 0.75rem;border-radius:8px;font-size:0.85rem;";

    const stage = document.createElement("div");
    stage.style.cssText =
        "position:relative;min-block-size:28rem;padding:1rem;overflow:hidden;background:var(--fl-dev-bg,#0b1220);";
    stage.dataset.theme = "dark";

    themeBtn.addEventListener("click", () => {
        const next = stage.dataset.theme === "dark" ? "light" : "dark";
        stage.dataset.theme = next;
        document.documentElement.dataset.theme = next;
        document.documentElement.style.colorScheme = next;
        if (next === "light") {
            stage.style.background = "#e8ecf4";
            stage.style.color = "#152033";
        } else {
            stage.style.background = "var(--fl-dev-bg,#0b1220)";
            stage.style.color = "";
        }
    });

    toolbar.append(themeBtn);
    elRoot.append(toolbar, stage);

    stage.append(
        makeWindow({
            title: "Dark window",
            theme: "dark",
            body: "Forced <code>data-theme=\"dark\"</code> surface, titlebar, and footer.",
            footer: "Ready",
            left: "1.25rem",
            top: "1.5rem"
        }),
        makeWindow({
            title: "Light window",
            theme: "light",
            body: "Forced <code>data-theme=\"light\"</code> — compare contrast and control colors.",
            footer: "OK",
            left: "26rem",
            top: "1.5rem"
        }),
        makeWindow({
            title: "Inherit scheme",
            body: "No data-theme — follows document <code>color-scheme</code> / playground toggle.",
            left: "12rem",
            top: "14rem"
        })
    );
}
