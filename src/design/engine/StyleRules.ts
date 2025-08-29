import { E, Q, localStorageRef } from "fest/lure";

//
export type StyleTuple = [selector: string, sheet: object];
export const updateThemeBase = async (originColor: string|null = null, $cssIsDark: boolean|null = null)=>{
    const primaryRef = localStorageRef("--primary", originColor);
    const wpThemeRef = localStorageRef("--wp-theme", $cssIsDark);

    //
    if (originColor != null && primaryRef.value != originColor) primaryRef.value = originColor;
    if ($cssIsDark != null && (!!wpThemeRef.value != $cssIsDark)) wpThemeRef.value = $cssIsDark as unknown as string;

    //
    E(document.documentElement, {
        style: {
            "--primary": primaryRef,
            "--wp-theme": wpThemeRef
        }
    })

    //
    return [primaryRef, wpThemeRef];
}
