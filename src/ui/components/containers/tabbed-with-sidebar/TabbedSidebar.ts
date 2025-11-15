import { defineElement, Q, H, makeClickOutsideTrigger, M, property } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { $trigger, booleanRef, conditional, observableByMap, stringRef, subscribe } from "fest/object"
import { UIElement } from "@fl-design/base/UIElement"

/*
 * Used for mobile applications
 * In desktop or widescreen sidebar can be statically visible
 * In mobile applications sidebar is hidden by default and can be opened by clicking on the button
 *
 * <ui-box-with-sidebar>
 *   <div slot="bar">
 *     <button part="open-sidebar" class="open-sidebar" on:click=${()=>{this.sidebarOpened.value = true;}}></button>
 *     <button class="open-sidebar" on:click=${()=>{this.sidebarOpened.value = true;}}></button>
 *     <slot name="bar"></slot>
 *   </div>
 *   <div part="sidebar" class="sidebar c2-surface" visibility="${this.sidebarOpened}"><slot name="sidebar"></slot></div>
 *   <div part="content" class="content"><slot></slot></div>
 * </ui-box-with-sidebar>
 */

// @ts-ignore
import styles from "./TabbedSidebar.scss?inline"
const styled = preloadStyle(styles);



//
const renderTabName = (tabName: any) => {
    if (typeof tabName != "string") { return tabName; }
    if (tabName == null || tabName == "") return "";

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

// @ts-ignore
@defineElement("ui-tabbed-with-sidebar")
export class TabbedSidebar extends UIElement {
    @property({ source: "attr" }) currentTab?: string = ""; //@ts-ignore
    sidebarOpened = booleanRef(false); //@ts-ignore

    //
    setTabs(tabs: Map<string, HTMLElement | string | any>) {
        const self: any = this;
        self.tabs ??= tabs ?? self.tabs;
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        const tabButton = H`<label class="ui-tabbed-box-tab">${addPartProperty((self?.renderTabName?.bind?.(self) ?? renderTabName)?.(tabName) ?? tabName, tabName)}</label>`;

        if (tabButton) {
            tabButton?.addEventListener("change", (ev) => self.openTab(tabName, ev));
            tabButton?.addEventListener("click", (ev) => self.openTab(tabName, ev));
            tabButton.slot = "tabs";
        }

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
    constructor() { super(); }
    onInitialize() { super.onInitialize?.(); }
    onRender() {
        const self: any = this;
        makeClickOutsideTrigger(self.sidebarOpened, Q("button", self?.shadowRoot), Q(".sidebar", self?.shadowRoot));

        //
        Q("a")?.addEventListener?.("click", ()=>{
            self.sidebarOpened.value = false;
        });

        //
        self.sidebarOpened.value = false;
        if (!self.tabs || !self.currentTab) return;
        this.observeTabsOverflow?.();
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

    //
    styles = () => styled?.cloneNode?.(true);
    render = function () {
        const self: any = this;
        return H`<div part="bar" class="bar c2-surface">
            <button part="open-sidebar" class="open-sidebar c2-surface" on:click=${() => { self.sidebarOpened.value = !self.sidebarOpened.value; }}><ui-icon icon="${conditional(self.sidebarOpened, 'text-outdent', 'list')}"></ui-icon></button>
            <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(self.tabs ?? new Map()) ?? [], (key_value) => self.createTab(key_value?.[0]))}</form>
        </div>
        <div part="content-box" class="content-box">
            <div part="sidebar" class="sidebar" data-visible=${self.sidebarOpened}><slot name="sidebar"></slot></div>
            <div part="content" class="content"><slot></slot></div>
        </div>`;
    }
}

//
export default TabbedSidebar;
