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
    if (tabName == "home") { return H`<ui-icon icon="house-line"></ui-icon>`; };

    //
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
const normalizeTabPosition = (value?: string): "top" | "bottom" => {
    const normalized = String(value || "top").trim().toLowerCase();
    return normalized === "bottom" ? "bottom" : "top";
};

//
const parseBooleanOption = (value: unknown): boolean => {
    if (typeof value === "boolean") { return value; }
    if (typeof value === "number") { return value !== 0; }
    if (value == null) { return false; }
    const normalized = String(value).trim().toLowerCase();
    if (!normalized.length) { return true; }
    if (["false", "0", "no", "off", "null", "undefined"].includes(normalized)) { return false; }
    return true;
};


//
class TabChangedEvent extends Event {
    newTab?: string;
    constructor(name, options, newTab) {
        super(name, options);
        this.newTab = newTab;
    }
}

//
class TabCloseEvent extends Event {
    tabName?: string;
    constructor(name, options, tabName) {
        super(name, options);
        this.tabName = tabName;
    }
}

// @ts-ignore
@defineElement("ui-tabbed-with-sidebar")
export class TabbedSidebar extends UIElement {
    @property({ source: "attr" }) currentTab?: string = ""; //@ts-ignore
    @property({ source: "attr", name: "tab-position" }) tabPosition?: string = "top"; //@ts-ignore
    @property({ source: "attr", name: "sidebar-as-drop-menu" }) sidebarAsDropMenu?: string | boolean = false; //@ts-ignore
    sidebarOpened = booleanRef(false); //@ts-ignore

    //
    setTabs(tabs: Map<string, HTMLElement | string | any>) {
        const self: any = this;
        self.tabs ??= tabs ?? self.tabs;
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this; if (self?.shadowRoot?.querySelector(`[data-tab-name="${tabName}"]`)) return;
        const renderLabel = self?.renderTabName?.bind?.(self) ?? renderTabName;
        const rawLabel = renderLabel?.(tabName) ?? tabName;
        const readableLabel = typeof rawLabel === "string" ? rawLabel : renderTabName?.(String(tabName ?? "")) ?? String(tabName ?? "");

        const tabButton = H`<label class="ui-tabbed-box-tab" role="tab" data-tab-name=${tabName}></label>`;
        const tabLabel = H`<span class="ui-tabbed-box-tab-label"></span>`;
        const closeButton = H`<button type="button" class="ui-tabbed-box-tab-close" aria-label=${`Close ${readableLabel}`} part="tab-close">
            <ui-icon icon="x"></ui-icon>
        </button>`;

        addPartProperty(tabButton, tabName);

        if (tabLabel instanceof HTMLElement) {
            if (rawLabel instanceof Node) {
                tabLabel.append(rawLabel);
            } else if (rawLabel != null) {
                tabLabel.textContent = typeof rawLabel === "string" ? rawLabel : String(rawLabel);
            }
        }

        tabButton?.append(tabLabel, closeButton);

        if (tabButton) {
            tabButton?.addEventListener("change", (ev) => self.openTab(tabName, ev));
            tabButton?.addEventListener("click", (ev) => self.openTab(tabName, ev));
            tabButton.slot = "tabs";
        }

        closeButton?.addEventListener("click", (event: Event) => {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            self.dispatchEvent(new TabCloseEvent("tab-close", { bubbles: true, composed: true }, tabName));
        });

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
    onInitialize() {
        super.onInitialize?.(); const self = this as any;
        if (!self.getAttribute("sidebar-as-drop-menu")) { self.removeAttribute("sidebar-as-drop-menu"); }
        if (!self.getAttribute("tab-position")) { self.removeAttribute("tab-position"); }
    }

    //
    onRender() {
        const self: any = this;
        makeClickOutsideTrigger(
            self.sidebarOpened,
            Q("button.open-sidebar", self?.shadowRoot),
            Q(".sidebar", self?.shadowRoot)
        );

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
    private readonly sidebarUniqueId = `tabbed-sidebar-${Math.random().toString(36).slice(2)}`;
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
    private getTabPositionSetting(): "top" | "bottom" {
        return normalizeTabPosition(this.tabPosition || "top");
    }

    //
    private hasSidebarDropMenu(): boolean {
        return parseBooleanOption(this.sidebarAsDropMenu ?? false);
    }

    //
    private syncHostFeatureAttributes(position: "top" | "bottom", dropMenu: boolean) {
        const host = this as unknown as HTMLElement;
        host?.setAttribute?.("data-tab-position", position);
        if (dropMenu) {
            host?.setAttribute?.("data-sidebar-drop-menu", "");
        } else {
            host?.removeAttribute?.("data-sidebar-drop-menu");
        }
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function () {
        const self: any = this;
        const tabPosition = self.getTabPositionSetting?.() || "top";
        const dropMenu = self.hasSidebarDropMenu?.() ?? false;
        self.syncHostFeatureAttributes?.(tabPosition, dropMenu);
        const sidebarId = self.sidebarUniqueId;
        return H`<div part="bar" class="bar c2-surface">
            <button
                part="open-sidebar"
                class="open-sidebar c2-surface"
                aria-haspopup="menu"
                aria-controls=${sidebarId}
                aria-expanded=${conditional(self.sidebarOpened, "true", "false")}
                on:click=${() => { self.sidebarOpened.value = !self.sidebarOpened.value; }}
            ><ui-icon icon="${conditional(self.sidebarOpened, 'text-outdent', 'list')}"></ui-icon></button>
            <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(self.tabs ?? new Map()) ?? [], (key_value) => (key_value?.[0] != "home" ? self.createTab(key_value?.[0]) : null))}</form>
            <form class="ui-tabbed-box-tabs pinned" part="pinned">${self.createTab("home")}</form>
        </div>
        <div part="content-box" class="content-box">
            <div part="sidebar" class="sidebar" id=${sidebarId} data-visible=${conditional(self.sidebarOpened, "true", "false")}><slot name="sidebar"></slot></div>
            <div part="content" class="content"><slot></slot></div>
        </div>`;
    }
}

//
export default TabbedSidebar;
