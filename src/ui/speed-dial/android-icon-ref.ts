/*
 * Filename: android-icon-ref.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/android-icon-ref.ts
 * Change date and time: 18.40.00_20.08.2026
 * Reason for changes: android-icon: refs — variants, ?pack=, ?drawable= (icon-pack browse).
 */

export type AndroidIconVariant = "default" | "monochrome" | "foreground";

export type ParsedAndroidIconRef = {
    packageName: string;
    variant: AndroidIconVariant;
    /** Icon-pack package (Lena Adaptive, …) when set. */
    pack?: string;
    /** Explicit drawable name inside the pack (browse pick). */
    drawable?: string;
};

const VARIANT_ALIASES: Record<string, AndroidIconVariant> = {
    default: "default",
    full: "default",
    colored: "default",
    monochrome: "monochrome",
    mono: "monochrome",
    material: "monochrome",
    "material-you": "monochrome",
    themed: "monochrome",
    foreground: "foreground",
    fg: "foreground",
    "adaptive-fg": "foreground"
};

export function normalizeAndroidIconVariant(raw: unknown): AndroidIconVariant {
    const key = String(raw || "default")
        .trim()
        .toLowerCase();
    return VARIANT_ALIASES[key] || "default";
}

/** Durable resource: `android-icon:com.pkg`, `?v=`, `?pack=`, `?drawable=`. */
export function isAndroidIconRef(raw: unknown): boolean {
    const u = String(raw || "").trim().toLowerCase();
    return u.startsWith("android-icon:");
}

export function formatAndroidIconRef(
    packageName: string,
    variant: AndroidIconVariant | string = "default",
    pack: string = "",
    drawable: string = ""
): string {
    const pkg = String(packageName || "").trim();
    if (!pkg) return "";
    const v = normalizeAndroidIconVariant(variant);
    const packPkg = String(pack || "").trim();
    const draw = String(drawable || "").trim();
    const params = new URLSearchParams();
    if (v !== "default") params.set("v", v);
    if (packPkg) params.set("pack", packPkg);
    if (draw) params.set("drawable", draw);
    const q = params.toString();
    return q ? `android-icon:${pkg}?${q}` : `android-icon:${pkg}`;
}

export function parseAndroidIconRef(raw: unknown): ParsedAndroidIconRef | null {
    const input = String(raw || "").trim();
    if (!isAndroidIconRef(input)) return null;
    const body = input.slice("android-icon:".length).replace(/^\/\//, "");
    if (!body) return null;

    const finish = (pkg: string, params: URLSearchParams): ParsedAndroidIconRef | null => {
        if (!pkg) return null;
        const parsed: ParsedAndroidIconRef = {
            packageName: pkg,
            variant: normalizeAndroidIconVariant(params.get("v") || "default")
        };
        const pack = String(params.get("pack") || "").trim();
        const drawable = String(params.get("drawable") || "").trim();
        if (pack) parsed.pack = pack;
        if (drawable) parsed.drawable = drawable;
        return parsed;
    };

    try {
        const url = new URL(body.includes("://") ? body : `android-icon://${body}`);
        const pkg = String(url.hostname || url.pathname.replace(/^\//, "") || "").trim();
        return finish(pkg, url.searchParams);
    } catch {
        const [pkgPart, query = ""] = body.split("?");
        return finish(String(pkgPart || "").trim(), new URLSearchParams(query));
    }
}

/** Cache key so default / mono / fg / pack / drawable / pixel size don't collide. */
export function androidIconCacheKey(
    packageName: string,
    variant: AndroidIconVariant | string = "default",
    pack: string = "",
    drawable: string = "",
    sizePx: number = 0
): string {
    const pkg = String(packageName || "").trim();
    if (!pkg) return "";
    const v = normalizeAndroidIconVariant(variant);
    const packPkg = String(pack || "").trim();
    const draw = String(drawable || "").trim();
    let key = v === "default" ? pkg : `${pkg}#${v}`;
    if (packPkg) key = `${key}#pack:${packPkg}`;
    if (draw) key = `${key}#d:${draw}`;
    const sz = Math.round(Number(sizePx) || 0);
    if (sz > 0) key = `${key}#s${sz}`;
    return key;
}
