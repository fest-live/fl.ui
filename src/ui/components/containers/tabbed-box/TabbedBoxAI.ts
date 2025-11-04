import { defineElement, H, property } from "fest/lure"
import { preloadStyle } from "fest/dom"
import { subscribe, autoRef, makeReactive, type refValid } from "fest/object";

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
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const isHTMLElement = (value: unknown): value is HTMLElement => value instanceof HTMLElement;

const normalizeTabContent = (value: any, tabName: string) => {
    if (!value) return null;
    if (typeof value === "string") {
        const template = document.createElement("template");
        template.innerHTML = value;
        return template.content.cloneNode(true);
    }
    if (isHTMLElement(value)) {
        value.dataset.tab = tabName;
        return value;
    }
    if (value instanceof DocumentFragment) {
        return value;
    }
    return value;
};

// @ts-ignore
@defineElement("ui-tabbed-box")
export class TabbedBox extends UIElement {
    @property({ source: "attr" }) currentTab?: string = "";

    //
    private tabsBox?: HTMLElement
    private detachTabsOverflow?: () => void
    private resizeObserver?: ResizeObserver
    private renderedTabs = new Map<string, HTMLLabelElement>();
    private cleanupListeners: (() => void)[] = [];
    private tabsSource: refValid<Map<string, HTMLElement | string | any>> = makeReactive(new Map());
    private renderTabNameFn?: (tabName: string) => any;

    @property({ source: "prop" })
    get tabs(): Map<string, HTMLElement | string | any> {
        return this.tabsSource;
    }

    set tabs(value: Map<string, HTMLElement | string | any> | undefined) {
        this.applyTabs(value ?? new Map());
    }

    @property({ source: "prop" })
    get renderTabName(): ((tabName: string) => any) | undefined {
        return this.renderTabNameFn;
    }

    set renderTabName(value: ((tabName: string) => any) | undefined) {
        this.renderTabNameFn = value;
        this.updateRenderedTabLabels();
        this.requestUpdate?.();
    }

    constructor() {
        super();
        const self: any = this;
        self.currentTab ??= "";
        self.tabsSource = makeReactive(new Map());
    }
    onInitialize() {
        super.onInitialize?.();
        this.applyTabs(this.tabsSource);
    }

    //
    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.detachTabsOverflow?.();
        this.resetTabSubscriptions();
    }

    //
    onRender() {
        if (!this.tabsSource) return;
        this.observeTabsOverflow();
        this.refreshActiveTabContent();
    }

    private observeTabChanges() {
        if (!this.tabsSource) return;
        const subscription = subscribe(this.tabsSource, () => {
            this.renderedTabs.clear();
            this.ensureCurrentTab();
            if (this.isConnected) {
                this.refreshActiveTabContent();
                this.updateTabStates();
            }
            this.requestUpdate?.();
        });
        this.cleanupListeners.push(subscription);
    }

    private refreshActiveTabContent() {
        const current = this.currentTab;
        if (!current) return;
        const container = this.shadowRoot?.querySelector?.(".ui-tabbed-box-content-host") as HTMLElement | undefined;
        if (!container) return;

        container.replaceChildren();
        const tabContent = this.tabsSource?.get?.(current);
        const normalized = normalizeTabContent(tabContent, current);
        if (!normalized) {
            container.append(H`<div class="ui-tabbed-box-empty">Nothing to display</div>`);
            return;
        }

        if (Array.isArray(normalized)) {
            normalized.forEach((node) => container.append(node));
        } else {
            container.append(normalized);
        }
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const label = this.resolveTabLabel(tabName);
        const tabButton = H`<label class="ui-tabbed-box-tab" part="tab" data-tab=${tabName} role="tab">${label}</label>` as HTMLLabelElement;
        if (tabButton) {
            tabButton?.addEventListener("click", (ev) => this.openTab(tabName, ev));
            tabButton?.addEventListener("keydown", (ev: KeyboardEvent) => this.handleTabKeydown(ev, tabName));
            tabButton.slot = "tabs";
            this.renderedTabs.set(tabName, tabButton);
        }
        return tabButton; //@ts-ignore
    }

    private handleTabKeydown(ev: KeyboardEvent, tabName: string) {
        if (ev.defaultPrevented) return;
        const { key } = ev;
        if (key === "Enter" || key === " ") {
            ev.preventDefault();
            this.openTab(tabName, ev);
            return;
        }
        if (key === "ArrowRight" || key === "ArrowLeft") {
            ev.preventDefault();
            this.focusSiblingTab(tabName, key === "ArrowRight" ? 1 : -1);
        }
    }

    private focusSiblingTab(current: string, step: 1 | -1) {
        const tabs = [...(this.tabsSource?.keys?.() ?? [])];
        if (!tabs.length) return;
        const currentIndex = tabs.indexOf(current);
        if (currentIndex === -1) return;
        const nextIndex = (currentIndex + step + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        if (!nextTab) return;
        this.renderedTabs.get(nextTab)?.focus?.();
    }

    //
    openTab(tabName: string, ev?: any) {
        if (!tabName) return;
        const changed = this.currentTab !== tabName;
        this.currentTab = tabName;
        this.refreshActiveTabContent();
        this.updateTabStates();
        if (changed) {
            this.dispatchEvent(new CustomEvent("tabchange", { detail: { tabName } }));
        }
    }

    private updateTabStates() {
        const active = this.currentTab;
        for (const [name, element] of this.renderedTabs) {
            element.toggleAttribute("data-active", name === active);
            element.setAttribute("aria-selected", String(name === active));
            element.setAttribute("tabindex", name === active ? "0" : "-1");
        }
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = () => {
        this.renderedTabs.clear();
        const tabNames = Array.from(this.tabsSource?.keys?.() ?? []);
        const tabNodes = tabNames
            .map((name) => this.createTab(name))
            .filter(Boolean) as HTMLLabelElement[];
        const root = H`
        <form class="ui-tabbed-box-tabs" part="tabs" role="tablist">${tabNodes}</form>
        <div class="ui-tabbed-box-content" part="content">
            <div class="ui-tabbed-box-content-host" data-tab-content-container="true"></div>
        </div>`
        queueMicrotask(() => {
            this.updateTabStates();
            this.refreshActiveTabContent();
        });
        return root;
    }

    private observeTabsOverflow() {
        this.tabsBox = this.shadowRoot?.querySelector?.(".ui-tabbed-box-tabs") ?? undefined;
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

    private resolveTabLabel(tabName: string) {
        const raw = this.renderTabNameFn?.(tabName);
        const labeled = addPartProperty(raw ?? tabName, "tab", tabName);
        if (labeled instanceof DocumentFragment) {
            return labeled.cloneNode(true);
        }
        if (isHTMLElement(labeled)) {
            return labeled.cloneNode(true);
        }
        return labeled;
    }

    private applyTabs(source: Map<string, HTMLElement | string | any>) {
        const reactive = makeReactive(source ?? new Map());
        if (reactive !== this.tabsSource) {
            this.tabsSource = reactive;
            this.resetTabSubscriptions();
        }
        if (!this.cleanupListeners.length) {
            this.observeTabChanges();
        }
        this.ensureCurrentTab();
        if (this.isConnected) {
            this.refreshActiveTabContent();
            this.updateTabStates();
        }
        this.requestUpdate?.();
    }

    private resetTabSubscriptions() {
        this.cleanupListeners.forEach((dispose) => dispose?.());
        this.cleanupListeners.length = 0;
    }

    private ensureCurrentTab() {
        const keys = Array.from(this.tabsSource?.keys?.() ?? []);
        if (!keys.length) {
            this.currentTab = "";
            return;
        }
        if (!this.currentTab || !this.tabsSource?.has?.(this.currentTab)) {
            this.currentTab = keys[0] ?? "";
        }
    }

    private updateRenderedTabLabels() {
        if (!this.renderedTabs.size) return;
        for (const [name, element] of this.renderedTabs) {
            const label = this.resolveTabLabel(name);
            element.replaceChildren(label);
        }
    }
}
