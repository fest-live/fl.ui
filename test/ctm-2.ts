import { H, M } from "fest/lure";
import "../src/scss/index.scss";

const tones = [0, 0.25, 0.5, 0.75, 1];

function makeDecorativeBlocks(className, theme, colorScheme) {
    return H`
        <div class="color-row">
            ${M(tones, (tone) => H`<div classList=${["color-block", className]} style=${{
                "--contrast-tone": `${tone}`,
                "--surface-tone": `${tone}`,
                "--detected-theme": `${theme}`,
                "colorScheme": colorScheme,
            }}>
            <span class="tone-label">${tone}</span>
            </div>
        `)?.element}</div>`;
}


//
const testTestTone = (name: string)=>H`
    <div class="color-section">
        <div class="color-title">Light Version (${name})</div>
        ${makeDecorativeBlocks(name, 1, "only light")}
    </div>
    <div class="color-section">
        <div class="color-title">Dark Version (${name})</div>
        ${makeDecorativeBlocks(name, 0, "only dark")}
    </div>
`;


document.body.append(testTestTone("c2-surface"));
document.body.append(testTestTone("c2-contrast"));
