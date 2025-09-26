import { defineElement, H, E, M, I } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { observableByMap, ref, subscribe } from "fest/object";

//
import { UIElement } from "@fl-design/base/UIElement"

// @ts-ignore
import styles from "./TabbedBox.scss?inline"
const styled = preloadStyle(styles);

//
const addPartProperty = (element: HTMLElement | string, part: string = "", value: string = "") => {
    if (typeof element == "string") { return element; }
    if (element instanceof HTMLElement) { element?.setAttribute?.(`data-part-${part}`, value); }
    return element;
}

//
const _LOG_ = (data: any)=>{
    console.log(data);
    return data;
}

// @ts-ignore
@defineElement("ui-tabbed-box")
export class TabbedBox extends UIElement {
    //
    constructor() { super(); const self: any = this; self.currentTab ??= ref("") ?? self.currentTab; }
    onInitialize() {
        const self: any = this;
        super.onInitialize?.();
    }

    //
    setTabs(tabs: Map<string, HTMLElement | string | any>) {
        const self: any = this;
        self.tabs ??= tabs ?? self.tabs;
    }

    //
    onRender() {
        const self: any = this;
        if (!self.tabs || !self.currentTab) return;
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        const tabButton = H`<label class="ui-tabbed-box-tab">${addPartProperty(self.renderTabName?.(tabName) ?? tabName, "tab", tabName)}</label>`;

        if (tabButton) {
            tabButton?.addEventListener("change", (ev) => self.openTab(tabName, ev));
            tabButton?.addEventListener("click", (ev) => self.openTab(tabName, ev));
            tabButton.slot = "tabs";
        }
        return tabButton; //@ts-ignore
    }

    //
    openTab(tabName: string, ev?: any) {
        if (!tabName) return;
        const self: any = this;
        if (self.currentTab) {
            self.currentTab.value = tabName ?? self.currentTab.value;
        }
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function () {
        const self: any = this;
        const root = H`
        <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(self.tabs ?? []), (key_value) => this.createTab(key_value?.[0]))}</form>
        <div class="ui-tabbed-box-content" part="content"><slot></slot></div>`

        //
        requestAnimationFrame(() => {
            self.currentTab.value ||= [...self?.tabs?.keys?.() ?? []]?.[0] || "";
            E(self, {}, [I({ current: self.currentTab, mapped: self.tabs })])
        });
        return root;
    }
}
