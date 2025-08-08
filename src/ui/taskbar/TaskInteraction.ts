/* Task Interaction Logic */
import { ITask } from "@helpers/tasking/Types";
import { Q } from "fest/lure";

//
export class TaskInteraction {
    list: ITask[] = [];
    taskbar: HTMLElement|any;

    //
    constructor(list: ITask[] = [], taskbar: HTMLElement|any = null) {
        this.list = list || [];
        this.bindInteraction(taskbar);
    }

    //
    bindInteraction(taskbar: HTMLElement|any): TaskInteraction {
        if (!taskbar) return this;
        this.taskbar = taskbar;
        this.taskbar?.addEventListener?.("click", (ev)=>{
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();

            //
            const taskEl = Q("ui-task", ev?.target, 0, "parent");
            const task = this.list?.find((t)=>(t?.taskId == (taskEl?.getAttribute?.("task-id") || "")) ?? null) ?? null;
            if (task) {
                if (!task?.focus) { task.focus = true; } else { task.active = false; };
            } else {
                this.list?.forEach?.((t)=>{if (t?.focus) { t.focus = false; }});
            }
        });
        return this;
    }
}
