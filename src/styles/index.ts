/**
 * Veela.CSS TypeScript Module
 *
 * Exports font loading utilities and type definitions.
 * Runtime styles and initialization are in ../scss/runtime/index.ts
 */

import { loadAllFonts, loadFontRegistry } from './font-loader';
import { loadAsAdopted } from 'fest/dom'; //@ts-ignore
import styles from './index.scss?inline';

//
const fontStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
`;

//
export * from './font-loader';
export type { FontMetadata } from './font-loader';
export const loader = async ()=>{
    await Promise.allSettled([
        loadFontRegistry().catch(() => undefined),
        loadAllFonts().catch(() => undefined)
    ]);
    await loadAsAdopted(fontStyles)?.catch(() => undefined);
    await loadAsAdopted(styles)?.catch(() => undefined);
};
