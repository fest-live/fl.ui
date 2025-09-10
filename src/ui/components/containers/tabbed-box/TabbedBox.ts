import { defineElement, H, E, M, I } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { observableByMap, ref } from "fest/object";

//
import { UIElement } from "@design/base/UIElement"

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

    // internal built tabs
    //protected currentTab = ref("");
    //protected tabs?: Map<string, HTMLElement|string|any>;

    //
    constructor() { super(); }
    onInitialize() {
        const self: any = this;
        super.onInitialize?.();
        self.currentTab = ref("");
    }

    //
    /*renderTabName = function (tabName: string) {
        //const self: any = this;
        return tabName;
    }*/

    //
    setTabs(tabs: Map<string, HTMLElement|string|any>) {
        const self: any = this; self.tabs = tabs;
    }

    //
    renderTabs() {
        const self: any = this;
        if (!self.tabs) return;
        E(self, {}, [I({ current: self.currentTab, mapped: self.tabs })])
    }

    //
    onRender() {
        const self: any = this;
        self.currentTab.value ||= [...self.tabs?.keys?.()]?.[0] || "";
        self.renderTabs();
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
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function() { return H`
        <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(this.tabs ?? []), (key_value) => this.createTab(key_value?.[0]))}</form>
        <div class="ui-tabbed-box-content" part="content"><slot></slot></div>`
    }
}
