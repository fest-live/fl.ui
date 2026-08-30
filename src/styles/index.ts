/**
 * Veela.CSS TypeScript Module
 *
 * Exports font loading utilities and type definitions.
 * Runtime styles and initialization are in ../scss/runtime/index.ts
 */

import { loadAllFonts, loadFontRegistry } from './font-loader';
import { loadAsAdopted } from '@fest-lib/style-lib'; //@ts-ignore
import styles from './index.scss?inline';
import globalNativeControlStyles from './patch-global-native-controls.scss?inline';

//
const fontStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
`;

//
export * from './font-loader';
export type { FontMetadata } from './font-loader';
export const loader = async (options?: { includeGlobalNativeControls?: boolean }) => {
    await loadAsAdopted(fontStyles)?.catch(() => undefined);
    await loadAllFonts().catch(() => undefined);
    await loadAsAdopted(styles)?.catch(() => undefined);
    if (options?.includeGlobalNativeControls) {
        await loadAsAdopted(globalNativeControlStyles)?.catch(() => undefined);
    }
};

/** Host-wide native control chrome (legacy). Prefer scoping with `.btn` / field mixins. */
export async function loadFlUIGlobalNativeControlStyles(): Promise<void> {
    await loadAsAdopted(globalNativeControlStyles)?.catch(() => undefined);
}
