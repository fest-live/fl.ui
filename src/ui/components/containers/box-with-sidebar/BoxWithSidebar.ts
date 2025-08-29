import { defineElement, Q, H, makeClickOutsideTrigger } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { booleanRef, conditional } from "fest/object"
import { UIElement } from "@design/base/UIElement"

/*
 * Used for mobile applications
 * In desktop or widescreen sidebar can be statically visible
 * In mobile applications sidebar is hidden by default and can be opened by clicking on the button
 *
 * <ui-box-with-sidebar>
 *   <div slot="bar">
 *     <button class="open-sidebar" on:click=${()=>{this.sidebarOpened.value = true;}}></button>
 *     <slot name="bar"></slot>
 *   </div>
 *   <div class="sidebar" visibility="${this.sidebarOpened}"><slot name="sidebar"></slot></div>
 *   <div class="content"><slot></slot></div>
 * </ui-box-with-sidebar>
 */

// @ts-ignore
import styles from "./BoxWithSidebar.scss?inline"
import { subscribe } from "fest/object";
const styled = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-box-with-sidebar")
export class BoxWithSidebar extends UIElement {
    sidebarOpened = booleanRef(false); //@ts-ignore

    //
    constructor() { super(); }
    onInitialize() { super.onInitialize?.(); }
    onRender() {
        const self: any = this;
        makeClickOutsideTrigger(self.sidebarOpened, Q("button", self?.shadowRoot), Q(".sidebar", self?.shadowRoot));
        self.sidebarOpened.value = false;

        // debug triggering
        subscribe(self.sidebarOpened, (opened) => {
            if (opened) {
                console.log("sidebar opened");
            } else {
                console.log("sidebar closed");
            }
        });
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function() { return H`<div class="bar c2-surface"><button class="open-sidebar c2-surface" on:click=${()=>{this.sidebarOpened.value = !this.sidebarOpened.value;}}><ui-icon icon="${conditional(this.sidebarOpened, 'text-outdent', 'list')}"></ui-icon></button><slot name="bar"></slot></div>
    <div class="content-box"><div class="sidebar c2-surface" data-visible=${this.sidebarOpened}><slot name="sidebar"></slot></div><div class="content c2-surface"><slot></slot></div></div>
    `;
    }
}
