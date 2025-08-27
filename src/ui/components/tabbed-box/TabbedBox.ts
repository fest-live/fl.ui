import { defineElement, checkedRef, Q, H, E, M, bindWith } from "fest/lure"
import { handleHidden, preloadStyle } from "fest/dom"
import { UIElement } from "@helpers/base/UIElement"

// @ts-ignore
import styles from "./TabbedBox.scss?inline"
import { subscribe } from "fest/object";
const styled = preloadStyle(styles);

// @ts-ignore
@defineElement("ui-tabbed-box")
export class TabbedBox extends UIElement {
    public tabs: Map<string, HTMLElement|string|any> = new Map();

    // internal built tabs
    #tabs: Map<string, {button: UIElement, content: UIElement, input: UIElement, opened: any}> = new Map();

    //
    constructor() { super(); }
    onInitialize() { super.onInitialize?.(); }
    onRender() {
        const self: any = this;
        E(self, {}, M(self.tabs.keys(), (tabName) => {
            //
            const $internal = self?.createTab?.(tabName);
            if (!$internal) return;

            $internal?.input?.addEventListener("change", () => self.openTab(tabName));
            $internal?.button?.addEventListener("click", () => self.openTab(tabName));
            if ($internal?.button) $internal.button.slot = "tabs";

            //
            const $content = self?.tabs?.get?.(tabName) ?? Q(`[data-name="${tabName}"]`, self);
            if (!$content) return;

            //
            $content?.setAttribute?.("data-name", tabName);
            $content?.addEventListener?.("focus", () => self.openTab(tabName));
            $content?.addEventListener?.("focusin", () => self.openTab(tabName));
            if ($content) $content.slot = "content";

            //
            bindWith($content, "data-hidden", $internal?.opened, handleHidden);
            subscribe($internal?.opened, () => self.openTab(tabName));

            //
            const fragment = document.createDocumentFragment();
            fragment.append($internal.button, $content);
            return fragment;
        }));
    }

    //
    createTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        const radio = H`<input type="radio" name="tabbed-box-tabs" value="${tabName}">`;
        const tabButton = H`<div class="ui-tabbed-box-tab">${radio}</div>`;
        const tabContent = Q(`[data-name="${tabName}"]`, self);
        const $internal = {button: tabButton, content: tabContent, input: radio, opened: checkedRef(radio)};
        this.#tabs.set(tabName, $internal); //@ts-ignore
        return $internal; //@ts-ignore
    }

    //
    openTab(tabName: string) {
        if (!tabName) return;
        const self: any = this;
        Q(`input[value="${tabName}"]`, self)?.click?.();
    }

    //
    styles = () => styled?.cloneNode?.(true);
    render = function() { return H`
        <div class="ui-tabbed-box-tabs"><slot name="tabs"></slot></div>
        <div class="ui-tabbed-box-content"><slot name="content"></slot></div>
    `}
}
