import { ITask } from "../../helpers/tasking/Types";
import { propRef, subscribe } from "fest/object";
import { handleHidden, handleAttribute, handleStyleChange, setStyleProperty } from "fest/dom";
import { bindWith } from "fest/lure";

//
export class TaskStateReflect {
    task?: ITask|null;
    element?: HTMLElement|any|null;
    bindings?: {
        visible?: any|null;
        focus?: any|null;
        title?: any|null;
        icon?: any|null;
        order?: any|null;
        orderSub?: any|null;
    }|null;

    //
    constructor(task: ITask|null = null, element: HTMLElement|any|null = null) {
        this.update(task, element);
    }

    //
    update(task: ITask|null = null, element: HTMLElement|any|null = null) {
        if (this.task !== task) { this.task = task; }
        if (this.element !== element) { this.element = element; }
        if (this.bindings) { this.unbind();  }
        this.bindings = {
            visible: bindWith(this.element, "data-hidden", propRef(this.task, "active"), handleHidden),
            focus: bindWith(this.element, "data-focus", propRef(this.task, "focus"), handleAttribute),
            title: bindWith(this.element, "data-title", propRef(this.task, "title"), handleAttribute),
            icon: bindWith(this.element, "data-icon", propRef(this.task, "icon"), handleAttribute),
            order: bindWith(this.element, "--order", propRef(this.task, "order"), handleStyleChange),
        };
        return this;
    }

    unbind() {
        if (this.bindings) {
            Object.values(this.bindings).forEach((binding)=>{ typeof binding == "function" ? binding() : binding?.unbind?.() });
            this.bindings?.orderSub?.();
            this.bindings = null;
        }
        if (this.element) {
            handleHidden(this.element, this.task, false);
            handleAttribute(this.element, "data-focus", null);
            handleAttribute(this.element, "data-title", null);
            handleAttribute(this.element, "data-icon", null);
            handleStyleChange(this.element, "--order", null);
        }
    }

    //
    bind(element: HTMLElement|any|null = null) {
        if (element) { this.update(this.task, element); }
        if (this.element) {
            this.bindings ??= {};

            const visibleRef = propRef(this.task, "active")
            this.bindings.visible = bindWith(this.element, "data-hidden", visibleRef, handleHidden);

            const focusRef = propRef(this.task, "focus")
            this.bindings.focus = bindWith(this.element, "data-focus", focusRef, handleAttribute);

            const titleRef = propRef(this.task, "title")
            this.bindings.title = bindWith(this.element, "data-title", titleRef, handleAttribute);

            const iconRef = propRef(this.task, "icon")
            this.bindings.icon = bindWith(this.element, "data-icon", iconRef, handleAttribute);

            const orderRef = propRef(this.task, "order")
            this.bindings.order = bindWith(this.element, "--order", orderRef, handleStyleChange);

            // crutch for not working order property
            this.bindings.orderSub = subscribe([this.task, "focus"], (_, prop)=>{ if (prop == "focus") {
                setStyleProperty(this.element, "--order", this.task?.order);
            }});
        }
        return this;
    }
}
