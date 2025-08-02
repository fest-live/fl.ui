import { dynamicNativeFrame, dynamicBgColors } from "./DynamicEngine.js";
import { getDominantColors } from "./KMean.js";
import { updateThemeBase } from "./StyleRules.js";
import { oklch, formatCss } from "culori";

//
export const colorScheme = async (blob: Blob) => {
    const cols = await getDominantColors(blob);
    const c = cols?.[0] || [0,0,0];

    //
    const baseColorI = oklch(`color(srgb ${c[0]} ${c[1]} ${c[2]})`);
    updateThemeBase(formatCss(baseColorI), !!(Math.sign(0.6 - baseColorI.l) * 0.5 + 0.5));

    //
    dynamicNativeFrame();
    dynamicBgColors();
};
