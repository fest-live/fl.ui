import { DOMMixin } from "@fest-lib/dom";

//
export class ThinSlider extends DOMMixin {
    constructor(name?: string) { super(name); }

    connect(_self: unknown) {
        // TODO: implement thin slider connection logic
    }
}

//
new ThinSlider("slider-thin");
