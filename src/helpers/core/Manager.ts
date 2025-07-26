export type FX = ((a: any)=>any);

//
export const navigationEnable = (tasks: Task[], taskEnvAction?: (task?: Task|null)=>boolean|void)=>{
    let ignoreForward = false;
    const initialHistoryCount = history?.length;

    // prevent behaviour once...
    addEventListener("hashchange", (ev)=>{
        const fc = getBy(tasks, location.hash);
        if (fc) { fc.focus = true; } else { history.replaceState("", "", getFocused(tasks, false)?.taskId || ""); };
    }); history?.pushState?.("", "", location.hash = location.hash || "#");
    addEventListener("popstate", (ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();

        //
        // hide taskbar before back
        if (ignoreForward) { ignoreForward = false; } else
        if (taskEnvAction?.(getFocused(tasks, true) ?? null)) {
            ignoreForward = true; history?.forward?.();
            ignoreForward = true; history?.replaceState?.("", "", getFocused(tasks, false)?.taskId || "");
        } else
        { history?.go?.(initialHistoryCount + 1 - history.length); }
    });

    //
    return tasks;
}

//
interface Task {
    $active: boolean;
    list: Task[];
    taskId: string;
    payload: any;
    get order(): number;
    set active(activeStatus: boolean);
    get active(): boolean;
    set focus(activeStatus: boolean);
    get focus(): boolean;
    takeAction?(): boolean|void;
}

//
export const getBy = (tasks: Task[] = [], taskId: string|any)=>{
    return tasks.find((t)=>(taskId == t || (typeof t.taskId == "string" && t.taskId == (typeof taskId == "string" ? taskId : t.taskId))));
}

//
export const makeTask = (taskId: string, list: Task[] = [], payload: any = {}, action?: ()=>boolean|void): Task => {
    action ??= ()=>{
        return history.replaceState("", "", taskId || location.hash);
    };

    //
    const task: Task = {
        list,
        taskId,
        payload,
        $active: false,

        //
        get order(): number {
            const tasks = this.list;
            return tasks.findIndex((t)=>((typeof t.taskId == "string") && t.taskId == this.taskId));
        },

        //
        get focus(): boolean {
            if (!this.taskId) return false;
            const tasks = this.list;
            const task = tasks.findLast((t)=>t.active); if (!task) return false;
            if (task?.taskId == this.taskId) { return true; };
            return false;
        },

        //
        get active(): boolean {
            return this.$active;
        },

        //
        set active(activeStatus: boolean) {
            const taskId = this.taskId;
            if (!taskId) return;
            const tasks = this.list;
            const index = tasks.findIndex((t)=>((typeof t.taskId == "string") && t.taskId == taskId));
            if (index >= 0) {
                const task = tasks[index];
                if (task?.$active != activeStatus) {
                    task.$active = activeStatus;
                }
            }
        },

        //
        set focus(activeStatus: boolean) {
            // blur not implemented
            if (activeStatus) return;

            //
            const taskId = this.taskId; if (!taskId) return;
            const tasks = this.list;

            //
            const last  = tasks.findLastIndex((t)=>t.active);
            const index = tasks.findIndex((t)=>(typeof t.taskId == "string" && t.taskId == taskId));
            const task  = tasks[index];

            //
            if (index >= 0) {
                if (!task.active) {
                    const toActive = getBy(this.list, taskId);
                    if (toActive) toActive.active = true;
                }

                //
                if (index < last) { // @ts-ignore
                    if (tasks.silentForwardByIndex) { tasks.silentForwardByIndex(index) } else // @ts-ignore
                    {   tasks.splice(index, 1);       tasks.push(task); }
                }

                //
                if (location.hash != taskId) { this.takeAction(); }
            }
        },

        //
        takeAction(): boolean|void {
            return action?.call?.(this);
        }
    }

    //
    list.push(task);
    return task;
}

//
export const historyBack = (tasks: Task[] = [])=>{
    history?.back?.(); const lastFocus = getFocused(tasks, false)?.taskId || "";
    if (location?.hash?.trim?.() != lastFocus) { history?.replaceState?.("", "", lastFocus); }
    return tasks;
}

//
export const getFocused = (tasks: Task[] = [], includeHash: boolean = true)=>{
    return (tasks.findLast((t)=>t.active) ?? (includeHash ? tasks?.find?.((t)=>t.taskId == location.hash) : null));
}

//
export const addToTaskList = (tasks: Task[] = [], task: Task, doFocus: boolean = true)=>{
    if (!task || (typeof task != "object")) return this;

    //
    const index = tasks.findIndex((t)=>((typeof t.taskId == "string") && t.taskId == task.taskId || task == t));

    //
    if (index < 0) {
        tasks.push(task);
    } else {
        const exist = tasks[index];
        if (exist != task) { Object.assign(exist, task); }
    }

    //
    if (doFocus) { task.focus = true; }
    history.pushState("", "", /*location.hash =*/ getFocused(tasks, false)?.taskId || "");

    //
    return this;
}

//
export const removeFromTaskList = (tasks: Task[] = [], task: Task)=>{
    if (!task) return tasks;
    const index = tasks.findIndex((t)=>((typeof t.taskId == "string") && t.taskId == (typeof task == "string" ? task : task.taskId) || task == t));
    if (index >= 0) {
        const task = tasks[index];
        tasks.splice(index, 1);
        return task;
    }
    return task;
}
