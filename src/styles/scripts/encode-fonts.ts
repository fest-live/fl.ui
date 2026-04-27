#!/usr/bin/env node
/**
 * Font Encoding Utility
 *
 * Standalone script to compress fonts and encode them to base64
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

interface FontMetadata {
    base64: string;
    family: string;
    style: string;
    weight: string | number;
    compressed: boolean;
}

async function encodeToBase64(filePath: string): Promise<string> {
    const data = await readFile(filePath);
    return data.toString('base64');
}

async function compressFile(inputPath: string, outputPath: string): Promise<void> {
    await mkdir(dirname(outputPath), { recursive: true });
    const readStream = createReadStream(inputPath);
    const writeStream = createWriteStream(outputPath);
    const gzipStream = createGzip({ level: 9 });
    await pipeline(readStream, gzipStream, writeStream);
}

function parseFontMetadata(filename: string): {
    family: string;
    style: string;
    weight: string | number;
} {
    const baseName = basename(filename, extname(filename));
    let family = 'Inter';
    let style = 'normal';
    let weight: string | number = 'normal';

    if (baseName.includes('InterVariable')) {
        family = 'InterVariable';
        weight = '100 900';
        if (baseName.includes('Italic')) style = 'italic';
    } else if (baseName.includes('InterDisplay')) {
        family = 'InterDisplay';
        const weightMatch = baseName.match(/(Thin|ExtraLight|Light|Regular|Medium|SemiBold|Bold|ExtraBold|Black)/);
        if (weightMatch) {
            const weightMap: Record<string, number> = {
                'Thin': 100, 'ExtraLight': 200, 'Light': 300, 'Regular': 400,
                'Medium': 500, 'SemiBold': 600, 'Bold': 700, 'ExtraBold': 800, 'Black': 900
            };
            weight = weightMap[weightMatch[1]] || 400;
        }
        if (baseName.includes('Italic')) style = 'italic';
    } else if (baseName.startsWith('Inter-')) {
        family = 'Inter';
        const weightMatch = baseName.match(/(Thin|ExtraLight|Light|Regular|Medium|SemiBold|Bold|ExtraBold|Black)/);
        if (weightMatch) {
            const weightMap: Record<string, number> = {
                'Thin': 100, 'ExtraLight': 200, 'Light': 300, 'Regular': 400,
                'Medium': 500, 'SemiBold': 600, 'Bold': 700, 'ExtraBold': 800, 'Black': 900
            };
            weight = weightMap[weightMatch[1]] || 400;
        }
        if (baseName.includes('Italic')) style = 'italic';
    }
    return { family, style, weight };
}

async function scanFontDirectory(dir: string): Promise<string[]> {
    const fontFiles: string[] = [];
    const scanDir = async (currentDir: string) => {
        const entries = await readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = resolve(currentDir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.woff2') || entry.name.endsWith('.woff'))) {
                fontFiles.push(fullPath);
            }
        }
    };
    await scanDir(dir);
    return fontFiles;
}

async function encodeFonts(fontDir: string, outputFile: string, compress: boolean = false): Promise<void> {
    console.log(`[font-encoder] Scanning font directory: ${fontDir}`);
    const fontFiles = await scanFontDirectory(fontDir);
    console.log(`[font-encoder] Found ${fontFiles.length} font files`);

    if (fontFiles.length === 0) {
        console.warn('[font-encoder] No font files found!');
        return;
    }

    const generatedFonts: Array<{ key: string; metadata: FontMetadata }> = [];

    for (const fontPath of fontFiles) {
        const relativePath = fontPath.replace(resolve(fontDir) + '/', '');
        const metadata = parseFontMetadata(fontPath);
        console.log(`[font-encoder] Processing: ${relativePath}`);

        let base64: string;
        let isCompressed = false;

        if (fontPath.endsWith('.woff2')) {
            base64 = await encodeToBase64(fontPath);
            isCompressed = false;
        } else if (compress && !fontPath.endsWith('.woff2')) {
            const tempPath = fontPath + '.gz';
            await compressFile(fontPath, tempPath);
            base64 = await encodeToBase64(tempPath);
            isCompressed = true;
            const { unlink } = await import('node:fs/promises');
            await unlink(tempPath);
        } else {
            base64 = await encodeToBase64(fontPath);
            isCompressed = false;
        }

        const key = relativePath.replace(/[\/\\]/g, '_').replace(/\.(woff2?|gz)$/i, '');
        generatedFonts.push({
            key,
            metadata: { base64, family: metadata.family, style: metadata.style, weight: metadata.weight, compressed: isCompressed }
        });
    }

    const registryContent = `/**
 * Font Registry
 * Auto-generated by font encoding utility
 * DO NOT EDIT MANUALLY
 * Generated: ${new Date().toISOString()}
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

    await mkdir(dirname(outputFile), { recursive: true });
    await writeFile(outputFile, registryContent, 'utf-8');

    console.log(`[font-encoder] Generated font registry with ${generatedFonts.length} fonts`);
    console.log(`[font-encoder] Output file: ${outputFile}`);
}

const __dirname = resolve(import.meta.dirname, '../');
const fontDir = resolve(__dirname, './assets/fonts');
const outputFile = resolve(__dirname, './src/ts/font-registry.ts');
const compress = process.argv.includes('--compress');

encodeFonts(fontDir, outputFile, compress)
    .then(() => {
        console.log('[font-encoder] Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('[font-encoder] Error:', error);
        process.exit(1);
    });
