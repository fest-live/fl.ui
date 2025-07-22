import { H, M } from "fest/lure";
import "../src/scss/index.scss";

const tones = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

//
function makeDecorativeBlocks(className, theme, colorScheme) {
    return H`
        <div class="color-row">
            ${M(tones, (tone) => H`<div class="color-block" classList=${[className]} style=${{
                "--contrast-tone": `${tone}`,
                "--surface-tone": `${tone}`
            }}>
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
