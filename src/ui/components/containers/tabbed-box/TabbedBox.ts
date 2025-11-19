import { defineElement, H, E, M, I, property } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { $trigger, observableByMap, subscribe } from "fest/object";

//
import { UIElement } from "@fl-design/base/UIElement"

// @ts-ignore
import styles from "./TabbedBox.scss?inline"
const styled = preloadStyle(styles);



//
const renderTabName = (tabName: any) => {
    if (typeof tabName != "string") { return tabName; }
    if (tabName == null || tabName == "") { return ""; }

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

//
class TabChangedEvent extends Event {
    newTab?: string;
    constructor(name, options, newTab) {
        super(name, options);
        this.newTab = newTab;
    }
}


//
const normalizeTabPosition = (value?: string): "top" | "bottom" => {
    const normalized = String(value ?? "bottom").trim().toLowerCase();
    return normalized === "top" ? "top" : "bottom";
}

// @ts-ignore
@defineElement("ui-tabbed-box")
export class TabbedBox extends UIElement {
    @property({ source: "attr" }) currentTab?: string = "";
    @property({ source: "attr", name: "tab-position" }) tabPosition?: string = "bottom";

    //
    constructor() { super(); const self: any = this; self.currentTab ??= ""; }
    onInitialize() {
        const self: any = this;
        super.onInitialize?.();

        //
        self.currentTab ||= [...self?.tabs?.keys?.() ?? []]?.[0] || "";
        console.log(self.currentTab);

        //
        E(self, {}, [I({ current: self.getProperty("currentTab"), mapped: self.tabs })])

        //
        subscribe(self.getProperty("currentTab"), (_newVal)=>{
            self.dispatchEvent(new TabChangedEvent("tab-changed", { bubbles: true }, self.currentTab));
        });
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
        this.observeTabsOverflow?.();
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        const tabLabel  = H`<span class="ui-tabbed-box-tab-label">${(self?.renderTabName?.bind?.(self) ?? renderTabName)?.(tabName) ?? tabName}</span>`;
        const tabButton = H`<button slot="tabs" type="button" on:click=${(ev: Event)=>self.openTab(tabName, ev)} class="ui-tabbed-box-tab" role="tab" data-tab-name=${tabName}>${tabLabel}</button>`;
        addPartProperty(tabButton, tabName);

        //
        self?.getProperty?.("currentTab")?.[$trigger]?.();
        return tabButton; //@ts-ignore
    }

    //
    openTab(tabName: string, ev?: any) {
        if (!tabName) return;
        const self: any = this;
        if (tabName) {
            self.currentTab = tabName ?? self.currentTab;
            self.dispatchEvent(new TabChangedEvent("tab-changed", { bubbles: true }, self.currentTab));
        }
    }

    //
    styles = () => styled?.cloneNode?.(true);

    //
    private syncTabPositionAttr(position: "top" | "bottom") {
        const host = this as unknown as HTMLElement;
        host?.setAttribute?.("data-tab-position", position);
    }

    render = function () {
        const self: any = this;
        const tabPosition = normalizeTabPosition(self.tabPosition);
        self.syncTabPositionAttr?.(tabPosition);
        const root = H`
        <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(self.tabs ?? new Map()) ?? [], (key_value) => this.createTab(key_value?.[0]))}</form>
        <div class="ui-tabbed-box-content" part="content"><slot></slot></div>`
        return root;
    }

    //
    private tabsBox?: HTMLElement
    private detachTabsOverflow?: () => void
    private resizeObserver?: ResizeObserver
    private observeTabsOverflow() {
        const self: any = this;
        this.tabsBox = self.shadowRoot?.querySelector?.(".ui-tabbed-box-tabs") ?? undefined;
        const tabsBox = this.tabsBox;
        if (!tabsBox) return;

        this.detachTabsOverflow?.();
        this.resizeObserver?.disconnect();

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

        this.detachTabsOverflow = () => {
            tabsBox.removeEventListener("wheel", onWheel);
            tabsBox.removeEventListener("scroll", updateIndicators);
            tabsBox.removeEventListener("pointerup", onPointerUp);
        };

        updateIndicators();
        queueMicrotask(updateIndicators);
        requestAnimationFrame(updateIndicators);

        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(updateIndicators);
            this.resizeObserver.observe(tabsBox);
        }
    }
}

//
export default TabbedBox;
