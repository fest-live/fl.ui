import { defineElement, E, H, property } from "fest/lure";
import { preloadStyle, elementPointerMap } from "fest/dom";
import { UIElement } from "@helpers/base/UIElement";

// @ts-ignore
import styles from "@ui/grid/GridBox.scss?inline&compress";
const styled = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-gridbox")
export class UIGridBox extends UIElement {
    //
    static observedAttributes = ["orient", "zoom"];
    @property({source: "attr"}) orient = 0;
    @property({source: "attr"}) zoom = 1;
    public size : [number, number] = [0, 0];

    //
    constructor() { super(); }
    onInitialize() { //@ts-ignore
        super.onInitialize?.(); //@ts-ignore
        this.bindWith(); const self = this as any;
        E(self, {classList: new Set(["ui-gridlayout", "ui-orientbox"]), style: { "--orient": self.getProperty("orient"), "--zoom": self.getProperty("zoom") }});
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = () => H`<slot></slot>`;
    bindWith(content: any) {
        const self = this as any;

        //
        const size = self.size;
        size[0] = self.clientWidth;
        size[1] = self.clientHeight;

        //
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry?.contentBoxSize) {
                    const contentBoxSize = entry?.contentBoxSize?.[0];
                    size[0] = (contentBoxSize?.inlineSize || self.clientWidth || 0);
                    size[1] = (contentBoxSize?.blockSize || self.clientHeight || 0);
                }
            }
        });

        //
        resizeObserver.observe(self, {box: "content-box"});
        elementPointerMap.set(self, {
            pointerMap: new Map<number, any>(),
            pointerCache: new Map<number, any>()
        });
    }
}
