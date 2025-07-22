import { H, M } from "fest/lure";
import "../src/scss/index.scss";

//
const tonesShift = [0, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2];

//
function makeDecorativeBlocks(className, theme, colorScheme) {
    return H`
        <div class="color-row">
            ${M(tonesShift, (tone) => H`<div class="color-block" classList=${[className]} style=${{
                "--contrast-tone-shift": `${tone}`,
                "--surface-tone-shift": `${tone}`
            }}>
            <span class="text-test">A</span>
            <span class="tone-label">${tone}</span>
            </div>
        `)?.element}</div>`;
}

//
const testTestTone = (name: string)=>H`
    <div class="color-section">
        <div style="background-color: transparent;" class="theme-section light">
            <div class="color-title">Light Version (${name})</div>
            ${makeDecorativeBlocks(name, 1, "only light")}
        </div>
        <div style="background-color: transparent;" class="theme-section dark">
            <div class="color-title">Dark Version (${name})</div>
            ${makeDecorativeBlocks(name, 0, "only dark")}
        </div>
    </div>
`;

//
document.body.append(testTestTone("c2-surface"));
document.body.append(testTestTone("c2-contrast"));
