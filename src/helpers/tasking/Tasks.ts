import { makeReactive, $triggerLess } from "fest/object";
import { getBy, getFocused } from "./Manager";
import { ITask } from "./Types";

//
export class Task implements ITask {
    $active: boolean = false;
    $action: ()=>boolean|void;
    payload: any;
    taskId: string;
    list?: ITask[]|null;

    //
    constructor(taskId: string, list?: ITask[]|null, payload: any = {}, action?: any) {
        this.taskId = taskId;
        this.list = list;
        this.payload = payload;
        this.$action = action ?? (()=>{
            if (location.hash != this.taskId) {
                return history.replaceState("", "", this.taskId || location.hash);
            }
        });
        this.addSelfToList(list, true);
    }

    //
    addSelfToList(list?: ITask[]|null, doFocus: boolean = false): ITask {
        if (list == null) return this;

        //
        const has = getBy(list, this);
        if (has != this) {
            if (!has) { list?.push(this); } else { Object.assign(has, this); }
        }

        //
        this.list = list;

        //
        if (doFocus) { this.focus = true; }
        history.pushState("", "", /*location.hash =*/ getFocused(list, false)?.taskId || "");

        //
        return this;
    };

    //
    get active(): boolean { return this.$active; }
    get order(): number { return this.list?.findIndex?.((t)=>(t == this || (typeof t.taskId == "string" && t.taskId == this.taskId))) ?? -1; }
    get focus(): boolean {
        if (!this.taskId) return false;
        const task = this.list?.findLast?.((t)=>t.active) ?? null; if (!task) return false;
        if (task?.taskId == this.taskId) { return true; };
        return false;
    }

    //
    set active(activeStatus: boolean) {
        const index = this.order;
        if (index >= 0) {
            const task = this.list?.[index];
            if (task != null &&task?.$active != activeStatus) {
                task.$active = activeStatus;
            }
        }
    }

    //
    set focus(activeStatus: boolean) {
        if (activeStatus != this.active) { this.active = activeStatus; }

        //
        const index = this.order;
        if (this.active && index >= 0) {
            const last = this.list?.findLastIndex?.((t)=>t.active) ?? -1
            if (index < last || last < 0)
                {
                    // avoid remove and add reactive element triggering
                    this.list?.[$triggerLess]?.(()=>{
                        this.list?.splice?.(index, 1); this.list?.push?.(this);
                    })
                }

            //
            this.takeAction();
        }
    }

    //
    takeAction(): boolean|void {
        return this.$action?.call?.(this);
    }

    //
    removeFromList() {
        if (!this.list) return this;
        const index = this.order;
        if (index >= 0) { this.list.splice(index, 1); }
        this.list = null;
        return this;
    }
};

//
export const makeTask = (...args: any[])=>{
    // @ts-ignore
    return makeReactive(new Task(...args));
}
