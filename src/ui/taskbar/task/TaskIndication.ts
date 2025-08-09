/* Task Indication Logic */
import { ITask } from "@helpers/tasking/Types";
import { bindWith } from "fest/lure";
import { handleAttribute } from "fest/dom";

//
export class TaskIndication {
    task: ITask|null = null;
    taskEl: HTMLElement|any;

    //
    constructor(task: ITask|null = null, taskEl: HTMLElement|any = null) {
        this.task = task || null;
        this.bindIndication(taskEl);
    }

    //
    bindIndication(taskEl: HTMLElement|any): TaskIndication {
        if (!taskEl) return this;
        this.taskEl = taskEl;
        bindWith(this.taskEl, "data-focus", this.task?.focus, handleAttribute);
        bindWith(this.taskEl, "data-active", this.task?.active, handleAttribute);
        return this;
    }
}
