/**
 * FL.UI Style Facade
 *
 * Loads canonical Veela styles while retaining FL.UI's public runtime API.
 */

import { loadAllFonts } from './font-loader';
import { loadAsAdopted } from '@fest-lib/style-lib'; //@ts-ignore
// @ts-ignore Vite inline SCSS
import styles from 'veela-lib/ui/index.scss?inline';
// @ts-ignore Vite inline SCSS
import globalNativeControlStyles from 'veela-lib/ui/native-controls.scss?inline';

//
export * from './font-loader';
export type { FontMetadata } from './font-loader';
export const loader = async (options?: { includeGlobalNativeControls?: boolean }) => {
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
