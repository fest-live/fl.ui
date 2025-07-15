import { defineElement, E, GLitElement, property } from "fest/lure";
import { preloadStyle, elementPointerMap } from "fest/dom";

// @ts-ignore
import styles from "./GridBox.scss?inline&compress";
const styled = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-gridbox")
export class UIGridBox extends GLitElement() {
    @property({source: "attr"}) orient = 0;
    @property({source: "attr"}) zoom = 1;

    //
    static observedAttributes = ["orient", "zoom"];
    public size : [number, number] = [0, 0];

    //
    constructor() { super(); }
    onInitialize() { //@ts-ignore
        super.onInitialize?.(); //@ts-ignore
        this.bindWith();
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = () => `<template><slot></slot></template>`;
    bindWith(content: any) {
        const self = this as any;

        //
        E(self, {style: { "--orient": self.getProperty("orient"), "--zoom": self.getProperty("zoom") }});

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
