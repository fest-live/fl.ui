import { defineElement, H, E, M, I, property } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { observableByMap } from "fest/object";

//
import { UIElement } from "@fl-design/base/UIElement"

// @ts-ignore
import styles from "./TabbedBox.scss?inline"
const styled = preloadStyle(styles);

//
const renderTabName = (tabName: string) => {
    if (!tabName) return "";

    // split _ as spaces
    tabName = tabName?.replace?.(/_/g, " ") || tabName;

    // capitalize first word letter
    tabName = (tabName?.charAt?.(0)?.toUpperCase?.() + tabName?.slice?.(1)) || tabName;

    //
    return tabName;
}

//
const addPartProperty = (element: HTMLElement | string, name: string = "") => {
    if (typeof element == "string") { return element; }
    if (element instanceof HTMLElement) {
        element?.setAttribute?.(`data-tab`, name);
        element?.setAttribute?.(`part`, "tab");
    }
    return element;
}

//
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// @ts-ignore
@defineElement("ui-tabbed-box")
export class TabbedBox extends UIElement {
    @property({ source: "attr" }) currentTab?: string = "";

    //
    private tabsBox?: HTMLElement
    private detachTabsOverflow?: () => void
    private resizeObserver?: ResizeObserver

    //
    public renderTabName = renderTabName;

    //
    constructor() { super(); const self: any = this; self.currentTab ??= ""; }
    onInitialize() {
        const self: any = this;
        super.onInitialize?.();

        //
        self.currentTab ||= [...self?.tabs?.keys?.() ?? []]?.[0] || "";
        E(self, {}, [I({ current: self.getProperty("currentTab"), mapped: self.tabs })])
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
        self.observeTabsOverflow();
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        const tabButton = H`<label class="ui-tabbed-box-tab">${addPartProperty(self?.renderTabName?.(tabName) ?? tabName, tabName)}</label>`;

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
            self.currentTab = tabName ?? self.currentTab;
        }
    }

    //
    styles = () => styled?.cloneNode?.(true);

    //
    render = function () {
        const self: any = this;
        const root = H`
        <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(self.tabs ?? new Map()) ?? [], (key_value) => this.createTab(key_value?.[0]))}</form>
        <div class="ui-tabbed-box-content" part="content"><slot></slot></div>`
        return root;
    }

    //
    private observeTabsOverflow() {
        const self: any = this;
        self.tabsBox = self.shadowRoot?.querySelector?.(".ui-tabbed-box-tabs") ?? undefined;
        const tabsBox = self.tabsBox;
        if (!tabsBox) return;

        self.detachTabsOverflow?.();
        self.resizeObserver?.disconnect();

        const updateIndicators = () => {
            const maxScrollLeft = tabsBox.scrollWidth - tabsBox.clientWidth;
            const hasOverflow = maxScrollLeft > 1;
            const startOverflow = tabsBox.scrollLeft > 1;
            const endOverflow = tabsBox.scrollLeft < maxScrollLeft - 1;

            tabsBox.toggleAttribute("data-scrollable", hasOverflow);
            tabsBox.toggleAttribute("data-scrollable-start", startOverflow);
            tabsBox.toggleAttribute("data-scrollable-end", endOverflow);
        };

        const onWheel = (event: WheelEvent) => {
            if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
                const delta = clamp(event.deltaY, -80, 80);
                tabsBox.scrollLeft += delta;
                event.preventDefault();
            }
        };

        const onPointerUp = () => updateIndicators();

        tabsBox.addEventListener("wheel", onWheel, { passive: false });
        tabsBox.addEventListener("scroll", updateIndicators, { passive: true });
        tabsBox.addEventListener("pointerup", onPointerUp, { passive: true });

        self.detachTabsOverflow = () => {
            tabsBox.removeEventListener("wheel", onWheel);
            tabsBox.removeEventListener("scroll", updateIndicators);
            tabsBox.removeEventListener("pointerup", onPointerUp);
        };

        updateIndicators();
        queueMicrotask(updateIndicators);
        requestAnimationFrame(updateIndicators);

        if (typeof ResizeObserver !== "undefined") {
            self.resizeObserver = new ResizeObserver(updateIndicators);
            self.resizeObserver.observe(tabsBox);
        }
    }
}