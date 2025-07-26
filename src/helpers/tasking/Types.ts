export type FX = ((a: any)=>any);
export interface ITask {
    $active: boolean;
    list?: ITask[]|null;
    taskId: string;
    payload: any;
    get order(): number;
    set active(activeStatus: boolean);
    get active(): boolean;
    set focus(activeStatus: boolean);
    get focus(): boolean;
    takeAction?(): boolean|void;
}
