/*
 * Filename: android-icon-ref.ts
 * FullPath: modules/projects/fl.ui/src/ui/speed-dial/android-icon-ref.ts
 * Change date and time: 17.15.00_20.08.2026
 * Reason for changes: Durable android-icon: refs for Material You / adaptive variants.
 */

export type AndroidIconVariant = "default" | "monochrome" | "foreground";

export type ParsedAndroidIconRef = {
    packageName: string;
    variant: AndroidIconVariant;
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

/** Durable resource: `android-icon:com.pkg` or `android-icon:com.pkg?v=monochrome`. */
export function isAndroidIconRef(raw: unknown): boolean {
    const u = String(raw || "").trim().toLowerCase();
    return u.startsWith("android-icon:");
}

export function formatAndroidIconRef(
    packageName: string,
    variant: AndroidIconVariant | string = "default"
): string {
    const pkg = String(packageName || "").trim();
    if (!pkg) return "";
    const v = normalizeAndroidIconVariant(variant);
    return v === "default" ? `android-icon:${pkg}` : `android-icon:${pkg}?v=${v}`;
}

export function parseAndroidIconRef(raw: unknown): ParsedAndroidIconRef | null {
    const input = String(raw || "").trim();
    if (!isAndroidIconRef(input)) return null;
    const body = input.slice("android-icon:".length).replace(/^\/\//, "");
    if (!body) return null;
    try {
        const url = new URL(body.includes("://") ? body : `android-icon://${body}`);
        const pkg = String(url.hostname || url.pathname.replace(/^\//, "") || "").trim();
        if (!pkg) return null;
        const v = normalizeAndroidIconVariant(url.searchParams.get("v") || "default");
        return { packageName: pkg, variant: v };
    } catch {
        const [pkgPart, query = ""] = body.split("?");
        const pkg = String(pkgPart || "").trim();
        if (!pkg) return null;
        const params = new URLSearchParams(query);
        return {
            packageName: pkg,
            variant: normalizeAndroidIconVariant(params.get("v") || "default")
        };
    }
}

/** Cache key so default / mono / fg don't collide in the object-URL map. */
export function androidIconCacheKey(packageName: string, variant: AndroidIconVariant | string = "default"): string {
    const pkg = String(packageName || "").trim();
    if (!pkg) return "";
    const v = normalizeAndroidIconVariant(variant);
    return v === "default" ? pkg : `${pkg}#${v}`;
}
