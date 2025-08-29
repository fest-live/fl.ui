import { defineElement, checkedRef, Q, H, E, M, bindWith } from "fest/lure"
import { handleHidden, preloadStyle, setChecked } from "fest/dom"
import { UIElement } from "@design/base/UIElement"

// @ts-ignore
import styles from "./TabbedBox.scss?inline"
import { observableByMap, subscribe, $trigger } from "fest/object";
const styled = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-tabbed-box")
export class TabbedBox extends UIElement {
    //public tabs?: Map<string, HTMLElement|string|any>;

    // internal built tabs
    #tabs: Map<string, {button: UIElement, content: UIElement, input: UIElement, opened: any}> = new Map();

    //
    constructor() { super(); }
    onInitialize() {
        const self: any = this;
        super.onInitialize?.();
        self.renderTabs();
    }

    //
    setTabs(tabs: Map<string, HTMLElement|string|any>) {
        const self: any = this;
        self.tabs = tabs;
    }

    //
    renderTabs() {
        const self: any = this;
        if (!self.tabs) return;

        //
        E(self, {}, M([...(self.tabs?.keys() ?? [])], (tabName) => {
            //
            const $internal = self?.createTab?.(tabName);
            if (!$internal) return;

            //
            $internal?.input?.addEventListener("change", (ev) => self.openTab(tabName, ev));
            $internal?.button?.addEventListener("click", (ev) => self.openTab(tabName, ev));
            if ($internal?.button) $internal.button.slot = "tabs";

            //
            const $content = self?.tabs?.get?.(tabName) ?? Q(`[data-name="${tabName}"]`, self);
            if (!$content) return;

            //
            $content?.setAttribute?.("data-name", tabName);
            $content?.addEventListener?.("focus", () => self.openTab(tabName));
            $content?.addEventListener?.("focusin", () => self.openTab(tabName));
            //if ($content) $content.slot = "content";

            //
            bindWith($content, "data-hidden", $internal?.opened, handleHidden);

            //
            return $content;
        }));
    }

    //
    onRender() {
        const self: any = this;
        self.renderTabs();
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        const radio = H`<input type="radio" class="ui-tabbed-box-handle" name="tab-handle" value="${tabName}">`;
        const tabButton = H`<label class="ui-tabbed-box-tab">${tabName}${radio}</label>`;
        const tabContent = Q(`[data-name="${tabName}"]`, self);
        const $internal = {button: tabButton, content: tabContent, input: radio, opened: checkedRef(radio)};
        this.#tabs.set(tabName, $internal); //@ts-ignore
        return $internal; //@ts-ignore
    }

    //
    openTab(tabName: string, ev?: any) {
        if (!tabName) return;
        const self: any = this;
        const qr = Q(`input[value="${tabName}"]`, self?.shadowRoot);
        if (!qr?.element) return;
        if (!ev?.target?.matches?.("input")) { setChecked(qr, true); } // avoid recursion

        //
        this.#tabs.entries().forEach(([$tabName, tab]) => {
            if (tabName != $tabName) { tab.opened.value = /*(tab?.input as any)?.checked ??*/ false; }
        });
        const opened = this.#tabs.get(tabName)?.opened;
        if (opened) { opened.value = qr?.checked || false; }
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function() { return H`
        <form class="ui-tabbed-box-tabs">${M(observableByMap(this.#tabs) ?? [], ([tabName, $tab]) => $tab?.button)}</form>
        <div class="ui-tabbed-box-content"><slot></slot></div>
    `}
}
