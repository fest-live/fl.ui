/*
 * Filename: icon-resource-picker.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/icon-resource-picker.ts
 * Change date and time: 17.25.00_20.08.2026
 * Reason for changes: Cap Material You picker + CRX bookmark / favicon resource picker.
 */

import {
    ensureLauncherIconObjectUrl,
    formatAndroidIconRef,
    getLauncherBridgeForSpeedDial,
    type LauncherBridgeSpeedDialApi
} from "./action-registry";
import {
    normalizeAndroidIconVariant,
    type AndroidIconVariant
} from "./android-icon-ref";
import {
    resolveBookmarksMenuApi,
    type BookmarkMenuEntry,
    type BookmarksMenuApi
} from "../navigation/app-menu/bookmarks-menu";

export type IconResourcePick = {
    /** Durable resource URL (`android-icon:…`, chrome `_favicon`, S2, https…). */
    iconUrl: string;
    packageName?: string;
    variant?: AndroidIconVariant;
    /** Icon-pack package when pick came from a themed pack. */
    pack?: string;
    drawable?: string;
    label?: string;
    source?: "android" | "bookmark" | "favicon" | "icon-pack";
};

type PickerOpts = {
    packageName?: string;
    /** Page / bookmark href — seeds CRX favicon variants. */
    pageUrl?: string;
    currentUrl?: string;
    theme?: "light" | "dark";
    onPick: (pick: IconResourcePick) => void;
};

const VARIANT_FALLBACK: Array<{ id: AndroidIconVariant; label: string }> = [
    { id: "default", label: "Default" },
    { id: "monochrome", label: "Material You" },
    { id: "foreground", label: "Adaptive FG" }
];

function resolveTheme(theme?: "light" | "dark"): "light" | "dark" {
    if (theme === "light" || theme === "dark") return theme;
    const pinned = String(document.documentElement.getAttribute("data-theme") || "").toLowerCase();
    return pinned === "light" ? "light" : "dark";
}

function httpPageUrl(raw: unknown): string {
    const u = String(raw || "").trim();
    return /^https?:\/\//i.test(u) ? u : "";
}

function googleS2Favicon(pageUrl: string, size = 128): string {
    try {
        const host = new URL(pageUrl).hostname;
        if (!host) return "";
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
    } catch {
        return "";
    }
}

function chromeExtensionFavicon(pageUrl: string, size = 128): string {
    try {
        const chromeRt = (globalThis as { chrome?: { runtime?: { getURL?: (p: string) => string } } })
            .chrome?.runtime;
        if (typeof chromeRt?.getURL !== "function") return "";
        const u = new URL(chromeRt.getURL("/_favicon/"));
        u.searchParams.set("pageUrl", pageUrl);
        u.searchParams.set("size", String(size));
        return u.toString();
    } catch {
        return "";
    }
}

function resolveFaviconCandidates(
    pageUrl: string,
    api: BookmarksMenuApi | null
): Array<{ label: string; url: string }> {
    const page = httpPageUrl(pageUrl);
    if (!page) return [];
    const out: Array<{ label: string; url: string }> = [];
    const seen = new Set<string>();
    const push = (label: string, url: string): void => {
        const u = String(url || "").trim();
        if (!u || seen.has(u)) return;
        seen.add(u);
        out.push({ label, url: u });
    };
    const fromApi = api?.resolveIconUrl?.(page, 128) || api?.resolveIconUrl?.(page, 64) || "";
    const s2 = googleS2Favicon(page, 128);
    if (s2) push("Google S2", s2);
    const s2sm = googleS2Favicon(page, 64);
    if (s2sm) push("Google S2 (64)", s2sm);
    const chromeFav = chromeExtensionFavicon(page, 128);
    if (chromeFav) push("Chrome favicon", chromeFav);
    if (fromApi) push("Bookmark favicon", fromApi);
    return out;
}

function makeCard(label: string, title?: string): {
    btn: HTMLButtonElement;
    img: HTMLImageElement;
} {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sd-icon-picker__card";
    btn.title = title || label;
    btn.style.setProperty("display", "flex", "important");
    btn.style.setProperty("flex-direction", "column", "important");
    btn.style.setProperty("flex-wrap", "nowrap", "important");
    btn.style.setProperty("align-items", "center", "important");
    btn.style.setProperty("justify-content", "center", "important");
    btn.style.setProperty("gap", "0.28rem", "important");
    btn.style.setProperty("min-inline-size", "0", "important");
    btn.style.setProperty("overflow", "hidden", "important");
    btn.style.setProperty("inline-size", "auto", "important");
    btn.style.setProperty("text-align", "center", "important");
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.referrerPolicy = "no-referrer";
    img.style.setProperty("display", "block", "important");
    img.style.setProperty("order", "0", "important");
    const caption = document.createElement("span");
    caption.className = "sd-icon-picker__card-label";
    caption.textContent = label;
    caption.style.setProperty("display", "block", "important");
    caption.style.setProperty("order", "1", "important");
    caption.style.setProperty("inline-size", "100%", "important");
    caption.style.setProperty("text-align", "center", "important");
    caption.style.setProperty("overflow", "hidden", "important");
    caption.style.setProperty("text-overflow", "ellipsis", "important");
    caption.style.setProperty("white-space", "nowrap", "important");
    btn.append(img, caption);
    return { btn, img };
}

async function loadVariantCards(
    bridge: LauncherBridgeSpeedDialApi,
    pkg: string,
    host: HTMLElement,
    onPick: (pick: IconResourcePick) => void,
    close: () => void
): Promise<void> {
    host.replaceChildren();
    let variants = VARIANT_FALLBACK.map((v) => ({ ...v, available: true }));
    try {
        const listed = await bridge.launcherIconVariants?.(pkg);
        if (Array.isArray(listed) && listed.length) {
            variants = listed.map((v) => ({
                id: normalizeAndroidIconVariant(v.id),
                label: String(v.label || v.id),
                available: v.available !== false
            }));
        }
    } catch {
        /* fallbacks */
    }

    for (const v of variants) {
        if (!v.available && v.id !== "default") continue;
        const { btn, img } = makeCard(v.label);
        host.append(btn);
        void ensureLauncherIconObjectUrl(pkg, 96, v.id).then((url) => {
            if (!url) {
                btn.disabled = true;
                btn.title = `${v.label} (unavailable)`;
                return;
            }
            img.src = url;
        });
        btn.addEventListener("click", () => {
            onPick({
                iconUrl: formatAndroidIconRef(pkg, v.id),
                packageName: pkg,
                variant: v.id,
                label: v.label,
                source: "android"
            });
            close();
        });
    }
}

async function loadIconPackCards(
    bridge: LauncherBridgeSpeedDialApi,
    targetPkg: string,
    host: HTMLElement,
    onPick: (pick: IconResourcePick) => void,
    close: () => void
): Promise<void> {
    host.replaceChildren();
    if (!bridge.launcherIconPacks) {
        host.textContent = "Icon packs unavailable.";
        return;
    }
    let packs: Array<{ packageName: string; label: string; iconCacheKey?: string }> = [];
    try {
        packs = await bridge.launcherIconPacks();
    } catch {
        host.textContent = "Failed to list icon packs.";
        return;
    }
    if (!packs.length) {
        host.textContent = "No icon packs installed.";
        return;
    }

    const frag = document.createDocumentFragment();
    for (const pack of packs.slice(0, 64)) {
        const packPkg = String(pack.packageName || "").trim();
        if (!packPkg) continue;
        const label = String(pack.label || packPkg);
        const wrap = document.createElement("div");
        wrap.className = "sd-icon-picker__pack-wrap";
        wrap.style.setProperty("display", "flex", "important");
        wrap.style.setProperty("flex-direction", "column", "important");
        wrap.style.setProperty("gap", "0.2rem", "important");
        wrap.style.setProperty("min-inline-size", "0", "important");

        const { btn, img } = makeCard(label, `${label} — themed for this app`);
        void ensureLauncherIconObjectUrl(targetPkg, 96, "default", packPkg).then((url) => {
            if (url) {
                img.src = url;
                return;
            }
            btn.disabled = true;
            btn.title = `${label} (no cover for this app)`;
            void ensureLauncherIconObjectUrl(packPkg, 72, "default").then((packIcon) => {
                if (packIcon) img.src = packIcon;
            });
        });
        btn.addEventListener("click", () => {
            if (btn.disabled) return;
            onPick({
                iconUrl: formatAndroidIconRef(targetPkg, "default", packPkg),
                packageName: targetPkg,
                variant: "default",
                pack: packPkg,
                label,
                source: "icon-pack"
            });
            close();
        });

        const browse = document.createElement("button");
        browse.type = "button";
        browse.className = "sd-icon-picker__pack-browse";
        browse.textContent = "Browse…";
        browse.title = `Browse icons in ${label}`;
        browse.style.cssText =
            "font:inherit;font-size:0.68rem;padding:0.15rem 0.35rem;border-radius:6px;border:1px solid color-mix(in oklab,currentColor 22%,transparent);background:transparent;color:inherit;cursor:pointer;";
        browse.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            void loadPackDrawableBrowse(bridge, targetPkg, packPkg, label, host, onPick, close, () => {
                void loadIconPackCards(bridge, targetPkg, host, onPick, close);
            });
        });

        wrap.append(btn, browse);
        frag.append(wrap);
    }
    host.append(frag);
}

async function loadPackDrawableBrowse(
    bridge: LauncherBridgeSpeedDialApi,
    targetPkg: string,
    packPkg: string,
    packLabel: string,
    host: HTMLElement,
    onPick: (pick: IconResourcePick) => void,
    close: () => void,
    onBack: () => void
): Promise<void> {
    host.replaceChildren();
    const toolbar = document.createElement("div");
    toolbar.style.cssText =
        "display:flex;flex-wrap:wrap;gap:0.35rem;align-items:center;margin-block-end:0.35rem;grid-column:1/-1;";
    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "← Packs";
    back.style.cssText =
        "font:inherit;font-size:0.75rem;padding:0.2rem 0.45rem;border-radius:6px;border:1px solid color-mix(in oklab,currentColor 22%,transparent);background:transparent;color:inherit;cursor:pointer;";
    back.addEventListener("click", () => onBack());
    const title = document.createElement("span");
    title.textContent = packLabel;
    title.style.cssText = "font-size:0.78rem;opacity:0.85;flex:1;min-inline-size:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Filter drawables…";
    search.autocomplete = "off";
    search.className = "sd-icon-picker__search";
    search.style.setProperty("flex", "1 1 8rem", "important");
    toolbar.append(back, title, search);

    const grid = document.createElement("div");
    grid.className = "sd-icon-picker__grid";
    grid.style.setProperty("display", "grid", "important");
    grid.style.setProperty("grid-template-columns", "repeat(3, minmax(0, 1fr))", "important");
    grid.style.setProperty("gap", "0.4rem", "important");
    grid.style.setProperty("grid-column", "1 / -1", "important");

    host.style.setProperty("display", "flex", "important");
    host.style.setProperty("flex-direction", "column", "important");
    host.append(toolbar, grid);

    let timer = 0;
    const refresh = (): void => {
        void (async () => {
            grid.replaceChildren();
            if (!bridge.launcherIconPackIcons) {
                grid.textContent = "Pack browse unavailable.";
                return;
            }
            let icons: Array<{ drawable: string; label: string }> = [];
            try {
                icons = await bridge.launcherIconPackIcons(packPkg, String(search.value || ""), 96);
            } catch {
                grid.textContent = "Failed to list pack icons.";
                return;
            }
            if (!icons.length) {
                grid.textContent = "No matching icons.";
                return;
            }
            const frag = document.createDocumentFragment();
            const resolvePkg = targetPkg || packPkg;
            for (const icon of icons) {
                const drawable = String(icon.drawable || "").trim();
                if (!drawable) continue;
                const { btn, img } = makeCard(
                    String(icon.label || drawable),
                    `${packLabel}: ${drawable}`
                );
                frag.append(btn);
                void ensureLauncherIconObjectUrl(
                    resolvePkg,
                    72,
                    "default",
                    packPkg,
                    drawable
                ).then((url) => {
                    if (url) img.src = url;
                    else btn.disabled = true;
                });
                btn.addEventListener("click", () => {
                    if (btn.disabled) return;
                    onPick({
                        iconUrl: formatAndroidIconRef(resolvePkg, "default", packPkg, drawable),
                        packageName: resolvePkg,
                        variant: "default",
                        pack: packPkg,
                        drawable,
                        label: String(icon.label || drawable),
                        source: "icon-pack"
                    });
                    close();
                });
            }
            grid.append(frag);
        })();
    };
    search.addEventListener("input", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(refresh, 160);
    });
    refresh();
}

async function loadAppBrowse(
    bridge: LauncherBridgeSpeedDialApi,
    query: string,
    host: HTMLElement,
    onPick: (pick: IconResourcePick) => void,
    close: () => void
): Promise<void> {
    host.replaceChildren();
    if (!bridge.launcherList) {
        host.textContent = "App list unavailable.";
        return;
    }
    let apps: Array<{ packageName: string; label: string; iconCacheKey?: string }> = [];
    try {
        apps = await bridge.launcherList(query);
    } catch {
        host.textContent = "Failed to list apps.";
        return;
    }
    if (!apps.length) {
        host.textContent = query.trim() ? "No matches." : "No apps.";
        return;
    }

    const frag = document.createDocumentFragment();
    for (const app of apps.slice(0, 48)) {
        const pkg = String(app.packageName || "").trim();
        if (!pkg) continue;
        const { btn, img } = makeCard(String(app.label || pkg), `${app.label} (${pkg})`);
        frag.append(btn);
        const cacheKey = String(app.iconCacheKey || pkg).trim() || pkg;
        void ensureLauncherIconObjectUrl(cacheKey, 72, "default").then((url) => {
            if (url) img.src = url;
        });
        btn.addEventListener("click", () => {
            onPick({
                iconUrl: formatAndroidIconRef(pkg, "default"),
                packageName: pkg,
                variant: "default",
                label: String(app.label || pkg),
                source: "android"
            });
            close();
        });
    }
    host.append(frag);
}

function loadFaviconVariantCards(
    pageUrl: string,
    api: BookmarksMenuApi | null,
    host: HTMLElement,
    onPick: (pick: IconResourcePick) => void,
    close: () => void
): void {
    host.replaceChildren();
    const candidates = resolveFaviconCandidates(pageUrl, api);
    if (!candidates.length) {
        host.textContent = "No favicon sources for this URL.";
        return;
    }
    for (const c of candidates) {
        const { btn, img } = makeCard(c.label, c.url);
        img.src = c.url;
        img.addEventListener("error", () => {
            btn.disabled = true;
            btn.title = `${c.label} (failed to load)`;
        });
        btn.addEventListener("click", () => {
            onPick({
                iconUrl: c.url,
                label: c.label,
                source: "favicon"
            });
            close();
        });
        host.append(btn);
    }
}

async function loadBookmarkBrowse(
    api: BookmarksMenuApi,
    query: string,
    host: HTMLElement,
    onPick: (pick: IconResourcePick) => void,
    close: () => void
): Promise<void> {
    host.replaceChildren();
    let entries: BookmarkMenuEntry[] = [];
    try {
        const q = String(query || "").trim();
        entries = q ? await api.search(q) : await api.listChildren();
    } catch {
        host.textContent = "Failed to list bookmarks.";
        return;
    }
    const links = entries.filter((e) => !e.folder && httpPageUrl(e.url));
    if (!links.length) {
        host.textContent = query.trim() ? "No matching bookmarks." : "No bookmarks.";
        return;
    }
    const frag = document.createDocumentFragment();
    for (const entry of links.slice(0, 48)) {
        const page = httpPageUrl(entry.url);
        if (!page) continue;
        const icon =
            api.resolveIconUrl?.(page, 64) ||
            chromeExtensionFavicon(page, 64) ||
            googleS2Favicon(page, 64);
        const { btn, img } = makeCard(String(entry.title || page), page);
        if (icon) img.src = icon;
        frag.append(btn);
        btn.addEventListener("click", () => {
            const preferred =
                api.resolveIconUrl?.(page, 128) ||
                chromeExtensionFavicon(page, 128) ||
                googleS2Favicon(page, 128) ||
                icon;
            if (!preferred) return;
            onPick({
                iconUrl: preferred,
                label: String(entry.title || page),
                source: "bookmark"
            });
            close();
        });
    }
    host.append(frag);
}

/**
 * Modal picker:
 * - Capacitor: Material You / adaptive + icon packs + installed apps (`android-icon:`)
 * - CRX: favicon variants for a page URL + browse Chrome bookmarks
 */
export async function openIconResourcePicker(opts: PickerOpts): Promise<void> {
    const bridge = await getLauncherBridgeForSpeedDial();
    const bookmarksApi = resolveBookmarksMenuApi();
    const hasAndroid = Boolean(bridge?.launcherIcon);
    const pageSeed =
        httpPageUrl(opts.pageUrl) ||
        httpPageUrl(opts.currentUrl) ||
        "";
    const hasBookmarks = Boolean(bookmarksApi) || Boolean(pageSeed);
    if (!hasAndroid && !hasBookmarks) {
        console.warn("[icon-resource-picker] no launcher bridge or bookmarks/favicon source");
        return;
    }

    const theme = resolveTheme(opts.theme);
    const pkgSeed = String(opts.packageName || "").trim();
    const showAndroidVariants = hasAndroid && Boolean(pkgSeed);
    const showIconPacks = hasAndroid && Boolean(pkgSeed) && Boolean(bridge?.launcherIconPacks);
    const showAndroidBrowse = hasAndroid && Boolean(bridge?.launcherList);
    const showFaviconVariants = Boolean(pageSeed);
    const showBookmarkBrowse = Boolean(bookmarksApi);

    const dialog = document.createElement("dialog");
    dialog.className = "speed-dial-editor sd-icon-picker";
    dialog.dataset.theme = theme;
    const description = hasAndroid
        ? "Material You / adaptive, icon packs, installed apps, or a favicon."
        : "Favicon for this link, or pick from Chrome bookmarks.";
    dialog.innerHTML = `
        <form class="speed-dial-editor__form sd-icon-picker__form" data-theme="${theme}" method="dialog">
            <header class="modal-header">
                <h2 class="modal-title">Pick icon</h2>
                <p class="modal-description">${description}</p>
            </header>
            <div class="modal-fields sd-icon-picker__body">
                <section class="sd-icon-picker__section" data-section="variants" ${showAndroidVariants ? "" : "hidden"}>
                    <div class="sd-icon-picker__section-title">For this package</div>
                    <div class="sd-icon-picker__grid" data-variants></div>
                </section>
                <section class="sd-icon-picker__section" data-section="packs" ${showIconPacks ? "" : "hidden"}>
                    <div class="sd-icon-picker__section-title">Icon packs</div>
                    <div class="sd-icon-picker__grid" data-packs></div>
                </section>
                <section class="sd-icon-picker__section" data-section="favicon" ${showFaviconVariants ? "" : "hidden"}>
                    <div class="sd-icon-picker__section-title">For this link</div>
                    <div class="sd-icon-picker__grid" data-favicon></div>
                </section>
                <section class="sd-icon-picker__section" data-section="browse" ${showAndroidBrowse ? "" : "hidden"}>
                    <div class="sd-icon-picker__section-title">Installed apps</div>
                    <input class="sd-icon-picker__search" data-search="apps" type="search" placeholder="Search apps…" autocomplete="off" />
                    <div class="sd-icon-picker__grid" data-browse></div>
                </section>
                <section class="sd-icon-picker__section" data-section="bookmarks" ${showBookmarkBrowse ? "" : "hidden"}>
                    <div class="sd-icon-picker__section-title">Bookmarks</div>
                    <input class="sd-icon-picker__search" data-search="bookmarks" type="search" placeholder="Search bookmarks…" autocomplete="off" />
                    <div class="sd-icon-picker__grid" data-bookmarks></div>
                </section>
            </div>
            <div class="modal-actions" role="group">
                <span class="modal-actions-spacer" aria-hidden="true"></span>
                <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
            </div>
        </form>
    `;

    const form = dialog.querySelector("form") as HTMLFormElement;
    const variantsHost = dialog.querySelector<HTMLElement>("[data-variants]");
    const packsHost = dialog.querySelector<HTMLElement>("[data-packs]");
    const faviconHost = dialog.querySelector<HTMLElement>("[data-favicon]");
    const browseHost = dialog.querySelector<HTMLElement>("[data-browse]");
    const bookmarksHost = dialog.querySelector<HTMLElement>("[data-bookmarks]");
    const appSearch = dialog.querySelector<HTMLInputElement>('[data-search="apps"]');
    const bmSearch = dialog.querySelector<HTMLInputElement>('[data-search="bookmarks"]');

    let closed = false;
    const close = (): void => {
        if (closed) return;
        closed = true;
        try {
            if (dialog.open) dialog.close();
        } catch {
            /* ignore */
        }
        dialog.remove();
    };

    const onPick = (pick: IconResourcePick): void => {
        opts.onPick(pick);
    };

    form.addEventListener("click", (ev) => {
        const action = (ev.target as HTMLElement | null)
            ?.closest?.("[data-action]")
            ?.getAttribute("data-action");
        if (action === "cancel") {
            ev.preventDefault();
            close();
        }
    });
    dialog.addEventListener("cancel", (ev) => {
        ev.preventDefault();
        close();
    });
    dialog.addEventListener("click", (ev) => {
        if (ev.target === dialog) close();
    });

    if (showAndroidVariants && bridge && variantsHost) {
        void loadVariantCards(bridge, pkgSeed, variantsHost, onPick, close);
    }
    if (showIconPacks && bridge && packsHost && pkgSeed) {
        void loadIconPackCards(bridge, pkgSeed, packsHost, onPick, close);
    }
    if (showFaviconVariants && faviconHost) {
        loadFaviconVariantCards(pageSeed, bookmarksApi, faviconHost, onPick, close);
    }

    let appTimer = 0;
    const refreshApps = (): void => {
        if (!browseHost || !bridge) return;
        void loadAppBrowse(bridge, String(appSearch?.value || ""), browseHost, onPick, close);
    };
    if (showAndroidBrowse) {
        appSearch?.addEventListener("input", () => {
            window.clearTimeout(appTimer);
            appTimer = window.setTimeout(refreshApps, 180);
        });
        refreshApps();
    }

    let bmTimer = 0;
    const refreshBookmarks = (): void => {
        if (!bookmarksHost || !bookmarksApi) return;
        void loadBookmarkBrowse(bookmarksApi, String(bmSearch?.value || ""), bookmarksHost, onPick, close);
    };
    if (showBookmarkBrowse && bookmarksApi) {
        bmSearch?.addEventListener("input", () => {
            window.clearTimeout(bmTimer);
            bmTimer = window.setTimeout(refreshBookmarks, 180);
        });
        refreshBookmarks();
    }

    document.body.append(dialog);
    /* WHY: Cap WebView flaky with layered picker CSS — pin stable grid on mount. */
    dialog.querySelectorAll<HTMLElement>(".sd-icon-picker__grid").forEach((grid) => {
        grid.style.setProperty("display", "grid", "important");
        grid.style.setProperty("grid-template-columns", "repeat(3, minmax(0, 1fr))", "important");
        grid.style.setProperty("gap", "0.4rem", "important");
        grid.style.setProperty("align-content", "start", "important");
        grid.style.setProperty("min-inline-size", "0", "important");
    });
    try {
        dialog.showModal();
    } catch {
        dialog.setAttribute("open", "");
    }
}

/** Icon-only button that opens {@link openIconResourcePicker} and fills an input. */
export function attachIconResourcePickButton(
    field: HTMLElement,
    input: HTMLInputElement,
    opts: {
        packageName?: string | (() => string);
        pageUrl?: string | (() => string);
        theme?: "light" | "dark";
    }
): HTMLButtonElement {
    let row = field.querySelector<HTMLElement>(".sd-icon-resource-row");
    if (!row) {
        row = document.createElement("div");
        row.className = "sd-icon-resource-row";
        input.replaceWith(row);
        row.append(input);
    }
    /* WHY: Cap ignored layered SCSS — pin input|button on one row via inline style. */
    row.style.setProperty("display", "grid", "important");
    row.style.setProperty("grid-template-columns", "minmax(0,1fr) 2.5rem", "important");
    row.style.setProperty("align-items", "stretch", "important");
    row.style.setProperty("gap", "0.45rem", "important");
    row.style.setProperty("min-inline-size", "0", "important");
    row.style.setProperty("inline-size", "100%", "important");

    let btn = row.querySelector<HTMLButtonElement>("[data-action='pick-icon']");
    if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn secondary sd-icon-resource-pick";
        btn.setAttribute("data-action", "pick-icon");
        btn.title = "Pick alternative icon";
        btn.setAttribute("aria-label", "Pick alternative icon");
        btn.innerHTML =
            '<ui-icon icon="squares-four" icon-style="duotone" aria-hidden="true"></ui-icon>';
        row.append(btn);
    }
    if (input.parentElement !== row) {
        row.insertBefore(input, btn);
    }
    btn.style.setProperty("display", "inline-flex", "important");
    btn.style.setProperty("align-items", "center", "important");
    btn.style.setProperty("justify-content", "center", "important");
    btn.style.setProperty("inline-size", "2.5rem", "important");
    btn.style.setProperty("min-inline-size", "2.5rem", "important");
    btn.style.setProperty("max-inline-size", "2.5rem", "important");
    btn.style.setProperty("min-block-size", "2.5rem", "important");
    btn.style.setProperty("padding", "0", "important");
    btn.style.setProperty("margin", "0", "important");

    btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const pkg =
            typeof opts.packageName === "function"
                ? opts.packageName()
                : String(opts.packageName || "").trim();
        const pageUrl =
            typeof opts.pageUrl === "function"
                ? opts.pageUrl()
                : String(opts.pageUrl || "").trim();
        void openIconResourcePicker({
            packageName: pkg,
            pageUrl,
            currentUrl: input.value,
            theme: opts.theme,
            onPick: (pick) => {
                input.value = pick.iconUrl;
                input.setAttribute("value", pick.iconUrl);
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });
    });
    return btn;
}
