/**
 * Vite Plugin: Font Encoder
 *
 * Encodes fonts as base64 (compressed) and embeds them in JS code
 *
 * Usage:
 * - Compresses fonts (if not already compressed)
 * - Encodes compressed fonts to base64
 * - Generates JS module with font data
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

//
const __dirname = import.meta?.dirname ?? fileURLToPath(new URL('.', import.meta.url));

//
interface FontEncoderOptions {
    /** Font directory to scan */
    fontDir: string;
    /** Output file path for generated font registry */
    outputFile?: string;
    /** Whether to compress fonts (if not already compressed) */
    compress?: boolean;
    /** Font metadata configuration */
    fontConfig?: Record<string, {
        family: string;
        style?: string;
        weight?: string | number;
    }>;
}

/**
 * Read file and encode to base64
 */
async function encodeToBase64(filePath: string): Promise<string> {
    const data = await readFile(filePath);
    return data.toString('base64');
}

/**
 * Compress file using gzip
 */
async function compressFile(inputPath: string, outputPath: string): Promise<void> {
    await mkdir(dirname(outputPath), { recursive: true });

    const readStream = createReadStream(inputPath);
    const writeStream = createWriteStream(outputPath);
    const gzipStream = createGzip({ level: 9 });

    await pipeline(readStream, gzipStream, writeStream);
}

/**
 * Generate font metadata from filename
 */
function parseFontMetadata(filename: string): {
    family: string;
    style: string;
    weight: string | number;
} {
    const baseName = basename(filename, extname(filename));

    // Parse Inter font filenames
    // Examples: InterVariable, InterVariable-Italic, Inter-Regular, InterDisplay-Bold
    let family = 'Inter';
    let style = 'normal';
    let weight: string | number = 'normal';

    if (baseName.includes('InterVariable')) {
        family = 'InterVariable';
        weight = '100 900'; // Variable font weight range
        if (baseName.includes('Italic')) {
            style = 'italic';
        }
    } else if (baseName.includes('InterDisplay')) {
        family = 'InterDisplay';
        // Extract weight from filename
        const weightMatch = baseName.match(/(Thin|ExtraLight|Light|Regular|Medium|SemiBold|Bold|ExtraBold|Black)/);
        if (weightMatch) {
            const weightMap: Record<string, number> = {
                'Thin': 100,
                'ExtraLight': 200,
                'Light': 300,
                'Regular': 400,
                'Medium': 500,
                'SemiBold': 600,
                'Bold': 700,
                'ExtraBold': 800,
                'Black': 900
            };
            weight = weightMap[weightMatch[1]] || 400;
        }
        if (baseName.includes('Italic')) {
            style = 'italic';
        }
    } else if (baseName.startsWith('Inter-')) {
        family = 'Inter';
        const weightMatch = baseName.match(/(Thin|ExtraLight|Light|Regular|Medium|SemiBold|Bold|ExtraBold|Black)/);
        if (weightMatch) {
            const weightMap: Record<string, number> = {
                'Thin': 100,
                'ExtraLight': 200,
                'Light': 300,
                'Regular': 400,
                'Medium': 500,
                'SemiBold': 600,
                'Bold': 700,
                'ExtraBold': 800,
                'Black': 900
            };
            weight = weightMap[weightMatch[1]] || 400;
        }
        if (baseName.includes('Italic')) {
            style = 'italic';
        }
    }

    return { family, style, weight };
}

/**
 * Vite plugin to encode fonts
 */
export function fontEncoder(options: FontEncoderOptions): Plugin {
    const {
        fontDir,
        outputFile = resolve(fontDir, './src/ts/font-registry.ts'),
        compress = false,
        fontConfig = {}
    } = options;

    let generatedFonts: Array<{
        key: string;
        metadata: {
            base64: string;
            family: string;
            style: string;
            weight: string | number;
            compressed: boolean;
        };
    }> = [];

    return {
        name: 'vite-plugin-font-encoder',
        enforce: 'pre',

        async buildStart() {
            // This will be called during build
            // We'll generate the font registry here
            console.log('[font-encoder] Generating font registry...');

            // Scan font directories
            const fontFiles: string[] = [];

            // Helper to scan directory
            const scanDir = async (dir: string, basePath: string = '') => {
                const { readdir } = await import('node:fs/promises');
                const entries = await readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = resolve(dir, entry.name);
                    if (entry.isDirectory()) {
                        await scanDir(fullPath, `${basePath}/${entry.name}`);
                    } else if (entry.isFile() && (entry.name.endsWith('.woff2') || entry.name.endsWith('.woff'))) {
                        fontFiles.push(fullPath);
                    }
                }
            };

            await scanDir(fontDir);

            // Process each font file
            for (const fontPath of fontFiles) {
                const relativePath = fontPath.replace(fontDir + '/', '');
                const metadata = parseFontMetadata(fontPath);

                // Check if custom config exists
                const customConfig = fontConfig[relativePath];
                if (customConfig) {
                    metadata.family = customConfig.family || metadata.family;
                    metadata.style = customConfig.style || metadata.style;
                    metadata.weight = customConfig.weight || metadata.weight;
                }

                // Encode to base64
                let base64: string;
                let isCompressed = false;

                // woff2 files are already compressed, just encode to base64
                // For other formats, we can optionally compress them
                if (fontPath.endsWith('.woff2')) {
                    base64 = await encodeToBase64(fontPath);
                    // woff2 is already compressed, but we'll mark it as needing decompression
                    // using Compression Streams API (though it's actually already decompressed)
                    // Actually, woff2 is already compressed, so we don't need to decompress it
                    isCompressed = false;
                } else if (compress && !fontPath.endsWith('.woff2')) {
                    // Compress non-woff2 files and encode
                    const tempPath = fontPath + '.gz';
                    await compressFile(fontPath, tempPath);
                    base64 = await encodeToBase64(tempPath);
                    isCompressed = true;
                    // Clean up temp file
                    await import('node:fs/promises').then(fs => fs.unlink(tempPath));
                } else {
                    // Just encode without compression
                    base64 = await encodeToBase64(fontPath);
                    isCompressed = false;
                }

                // Create cache key
                const key = relativePath.replace(/[\/\\]/g, '_').replace(/\.(woff2?|gz)$/i, '');

                generatedFonts.push({
                    key,
                    metadata: {
                        base64,
                        family: metadata.family,
                        style: metadata.style,
                        weight: metadata.weight,
                        compressed: isCompressed
                    }
                });
            }

            // Generate font registry TypeScript file
            const registryContent = `/**
 * Font Registry
 *
 * Auto-generated by vite-plugin-font-encoder
 * DO NOT EDIT MANUALLY
 */

export const fontRegistry: Record<string, any> = {
${generatedFonts.map(({ key, metadata }) => `    '${key}': {
        base64: '${metadata.base64}',
        family: '${metadata.family}',
        style: '${metadata.style}',
        weight: ${typeof metadata.weight === 'string' ? `'${metadata.weight}'` : metadata.weight},
        compressed: ${metadata.compressed}
    }`).join(',\n')}
};
`;

            // Write registry file
            await mkdir(dirname(outputFile), { recursive: true });
            await writeFile(outputFile, registryContent, 'utf-8');

            console.log(`[font-encoder] Generated font registry with ${generatedFonts.length} fonts`);
        },

        generateBundle() {
            // Ensure font registry is included in bundle
            // This is handled by the import system
        }
    };
}


//
const encoder: any = fontEncoder({
    fontDir: resolve(__dirname, "./assets/fonts"),
    outputFile: resolve(__dirname, "./src/ts/font-registry.ts"),
    compress: true // woff2 files are already compressed
});

//
encoder.buildStart?.();
