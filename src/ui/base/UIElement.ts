/*
 * Filename: UIElement.ts
 * FullPath: modules/projects/fl.ui/src/ui/base/UIElement.ts
 * FIND:glit-styles
 * TAG:glit-styles
 * WHY: FL-UI host — GLit lifecycle + style-lib host CSS + icon sheet.
 */
import { defineElement, GLitElement, H, property } from "@fest-lib/lure";
import { scheduleEnsureHostStyles } from "@fest-lib/style-lib";
import { ensureStyleSheet } from "@fest-lib/icon";

// @ts-ignore
@defineElement("ui-element")
export class UIElement extends GLitElement() {
    @property({ source: "attr" }) theme: string = "default";

    // WHY: prototype method so subclass `render()` is not shadowed by an instance field.
    render(_weak?: WeakRef<any>) {
        return H`<slot></slot>`;
    }

    constructor() { super(); }

    onRender(): this | void | undefined {
        return super.onRender();
    }

    connectedCallback(): this {
        const result = super.connectedCallback?.();
        const self: any = result ?? this;
        // WHY: icon sheet must re-attach on reconnect; Veela runtime stays out (freeze).
        self.loadStyleLibrary(ensureStyleSheet());
        scheduleEnsureHostStyles(self);
        return self;
    }

    onInitialize(): this {
        const result = super.onInitialize();
        const self: any = result ?? this;
        self.loadStyleLibrary(ensureStyleSheet());
        return self;
    }
}

export default UIElement;
