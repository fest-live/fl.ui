/**
 * Dev playground: suite picker in index.html + dynamic loaders for smoke tests.
 * Puppeteer / manual: `?suite=anchors|forms|modal|overlays|explorer|markdown|misc|speed-dial|window` (alias `demo=`).
 */
import "@fest-lib/icon";

const MOUNT_ID = "fl-ui-playground";

export const SUITE_IDS = ["anchors", "forms", "modal", "overlays", "explorer", "markdown", "misc", "speed-dial", "window", "layers"] as const;
export type SuiteId = (typeof SUITE_IDS)[number];

const loaders: Record<SuiteId, () => Promise<{ mount: (el: HTMLElement) => void | Promise<void> }>> = {
    anchors: () => import("./suites/anchors"),
    forms: () => import("./suites/forms"),
    modal: () => import("./suites/modal"),
    overlays: () => import("./suites/overlays"),
    explorer: () => import("./suites/explorer"),
    markdown: () => import("./suites/markdown"),
    misc: () => import("./suites/misc-canvas"),
    "speed-dial": () => import("./suites/speed-dial"),
    window: () => import("./suites/window"),
    layers: () => import("./suites/layers")
};

export async function loadSuite(id: SuiteId): Promise<void> {
    const root = document.getElementById(MOUNT_ID);
    if (!root) throw new Error(`#${MOUNT_ID} missing`);
    root.replaceChildren();
    const status = document.getElementById("fl-ui-suite-status");
    if (status) {
        status.textContent = `Loading “${id}”…`;
        status.dataset.state = "loading";
    }
    try {
        const mod = await loaders[id]();
        await Promise.resolve(mod.mount(root));
        if (status) {
            status.textContent = `Active: ${id}`;
            status.dataset.state = "ready";
        }
    } catch (e) {
        console.error(e);
        if (status) {
            status.textContent = `Error loading “${id}”`;
            status.dataset.state = "error";
        }
        const pre = document.createElement("pre");
        pre.style.cssText = "color:#f87171;padding:1rem;white-space:pre-wrap;";
        pre.textContent = String(e);
        root.appendChild(pre);
    }
}

function normalizeSuiteParam(raw: string | null): SuiteId | null {
    if (!raw) return null;
    const id = raw.trim().toLowerCase().replace(/_/g, "-");
    return (SUITE_IDS as readonly string[]).includes(id) ? (id as SuiteId) : null;
}

function suiteFromQuery(): SuiteId | null {
    const qs = new URLSearchParams(location.search);
    return normalizeSuiteParam(qs.get("suite") || qs.get("demo"));
}

function wireNav(): void {
    document.querySelectorAll<HTMLElement>("[data-fl-suite]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = normalizeSuiteParam(btn.getAttribute("data-fl-suite"));
            if (!id) return;
            const url = new URL(location.href);
            url.searchParams.set("suite", id);
            history.replaceState({}, "", url);
            syncActiveButton(id);
            void loadSuite(id);
        });
    });
}

function syncActiveButton(id: SuiteId | null): void {
    document.querySelectorAll<HTMLElement>("[data-fl-suite]").forEach((btn) => {
        const bid = normalizeSuiteParam(btn.getAttribute("data-fl-suite"));
        btn.dataset.flActive = bid === id ? "true" : "false";
    });
}

declare global {
    interface Window {
        __FL_UI_PLAYGROUND__?: {
            loadSuite: typeof loadSuite;
            SUITE_IDS: typeof SUITE_IDS;
        };
    }
}

window.__FL_UI_PLAYGROUND__ = { loadSuite, SUITE_IDS };

wireNav();
const initial = suiteFromQuery();
syncActiveButton(initial);
if (initial) void loadSuite(initial);
else {
    const status = document.getElementById("fl-ui-suite-status");
    if (status) {
        status.textContent = "Choose a suite above or add ?suite=… to the URL.";
        status.dataset.state = "idle";
    }
}
