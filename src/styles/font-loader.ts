/**
 * Font Loader Module
 *
 * Loads fonts from base64-encoded, compressed data using:
 * - Compression Streams API for decompression
 * - Blob URL for caching
 * - FontFace API (CSS Font Loading API) for font loading
 */

/**
 * Font metadata for loading
 */
export interface FontMetadata {
    /** Base64-encoded, compressed font data */
    base64: string;
    /** Font family name */
    family: string;
    /** Font style (normal, italic, etc.) */
    style?: string;
    /** Font weight (100-900 or "100 900" for variable fonts) */
    weight?: string | number;
    /** Whether the font is compressed (requires decompression) */
    compressed?: boolean;
}

/**
 * Cache for Blob URLs to avoid re-creating them
 */
const blobUrlCache = new Map<string, string>();

/**
 * Cache for FontFace instances
 */
const fontFaceCache = new Map<string, FontFace>();

/**
 * Decode base64 string to Uint8Array
 * Uses Uint8Array.fromBase64 if available, otherwise falls back to atob
 */
function decodeBase64(base64: string): Uint8Array {
    // Check if Uint8Array.fromBase64 is available (ES2024+)
    if (typeof Uint8Array.fromBase64 === 'function') {
        return Uint8Array.fromBase64(base64);
    }

    // Fallback: use atob for older browsers
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decompress data using Compression Streams API
 * Only used for fonts that were compressed (e.g., gzip)
 * woff2 files are already compressed and don't need decompression
 */
async function decompress(data: Uint8Array, algorithm: CompressionFormat = 'gzip'): Promise<Uint8Array> {
    // Check if CompressionStream is available
    if (typeof CompressionStream === 'undefined') {
        throw new Error('Compression Streams API is not supported in this browser');
    }

    // Use DecompressionStream for decompression
    const stream = new DecompressionStream(algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write compressed data
    writer.write(data);
    writer.close();

    // Read decompressed chunks
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
            chunks.push(value);
        }
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}

/**
 * Get or create a Blob URL from font data
 * Caches the URL to avoid re-creating Blobs
 */
async function getBlobUrl(fontData: Uint8Array, cacheKey: string, mimeType: string = 'font/woff2'): Promise<string> {
    // Check cache first
    if (blobUrlCache.has(cacheKey)) {
        return blobUrlCache.get(cacheKey)!;
    }

    // Create Blob and URL
    const blob = new Blob([fontData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Cache the URL
    blobUrlCache.set(cacheKey, url);

    return url;
}

/**
 * Load a font from base64-encoded, compressed data
 */
export async function loadFont(metadata: FontMetadata): Promise<FontFace> {
    const { base64, family, style = 'normal', weight = 'normal', compressed = false } = metadata;

    // Create cache key
    const cacheKey = `${family}-${style}-${weight}`;

    // Check if FontFace is already cached
    if (fontFaceCache.has(cacheKey)) {
        return fontFaceCache.get(cacheKey)!;
    }

    // Decode base64 to Uint8Array
    const encodedData = decodeBase64(base64);

    // Decompress if needed (woff2 files are already compressed, don't decompress)
    // Only decompress if explicitly marked as compressed (e.g., gzip)
    const fontData = compressed ? await decompress(encodedData) : encodedData;

    // Determine MIME type based on compression
    // woff2 files are already compressed, so if not compressed, assume woff2
    const mimeType = compressed ? 'application/octet-stream' : 'font/woff2';

    // Get or create Blob URL
    const blobUrl = await getBlobUrl(fontData, cacheKey, mimeType);

    // Create FontFace instance
    const fontFace = new FontFace(
        family,
        `url(${blobUrl}) format('woff2')`,
        {
            style,
            weight: typeof weight === 'string' ? weight : `${weight}`,
            display: 'swap'
        }
    );

    // Load the font
    await fontFace.load();

    // Add to document.fonts
    document.fonts.add(fontFace);

    // Cache the FontFace instance
    fontFaceCache.set(cacheKey, fontFace);

    return fontFace;
}

/**
 * Load multiple fonts
 */
export async function loadFonts(metadataArray: FontMetadata[]): Promise<FontFace[]> {
    const promises = metadataArray.map(metadata => loadFont(metadata));
    return Promise.all(promises);
}

let loadingFontRegistry: any = null;
export async function loadFontRegistry(): Promise<any> {
    if (loadingFontRegistry) {
        return loadingFontRegistry;
    }
    loadingFontRegistry = import("./font-registry")?.catch?.((error: any) => { console.error("Failed to load font registry:", error); });;
    return loadingFontRegistry;
}

/**
 * Load all fonts from the registry
 */
export async function loadAllFonts(): Promise<FontFace[]> {
    const fontRegistry = await loadFontRegistry();
    const metadataArray = Object.values(fontRegistry.fontRegistry as Record<string, FontMetadata>);
    return loadFonts(metadataArray);
}

/**
 * Load fonts by family name
 */
export async function loadFontsByFamily(family: string): Promise<FontFace[]> {
    const fontRegistry = await loadFontRegistry();
    const metadataArray = Object.values(fontRegistry.fontRegistry as Record<string, FontMetadata>).filter(
        metadata => metadata.family === family
    );
    return loadFonts(metadataArray);
}

/**
 * Clear font caches (useful for testing or memory management)
 */
export function clearFontCache(): void {
    // Revoke all Blob URLs
    for (const url of blobUrlCache.values()) {
        URL.revokeObjectURL(url);
    }

    blobUrlCache.clear();
    fontFaceCache.clear();
}

/**
 * Font data registry (populated by Vite plugin)
 * Import from generated font-registry module
 */
//export { fontRegistry } from './font-registry';
