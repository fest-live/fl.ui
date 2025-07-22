import { H, M } from "fest/lure";
import "../src/scss/index.scss";

//
const tones = [0, 0.25, 0.5, 0.75, 1];

//
const gens1 = M(tones, (tone) => H`<div class="c2-themed" style=${{
    "inlineSize": "100px",
    "blockSize": "100px",
    "--surface-tone": `${tone}`,
    "--detected-theme": "1",
    "colorScheme": "only light",
}}></div>`)?.element;

const gens2 = M(tones, (tone) => H`<div class="c2-themed" style=${{
    "inlineSize": "100px",
    "blockSize": "100px",
    "--surface-tone": `${tone}`,
    "--detected-theme": "0",
    "colorScheme": "only dark",
}}></div>`)?.element;

//
const colorTestL = H`<div style="display: inline-block;">${gens1}</div>`;
const colorTestD = H`<div style="display: inline-block;">${gens2}</div>`;

//
document.body.append(colorTestL);
document.body.append(colorTestD);
