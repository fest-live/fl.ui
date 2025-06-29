import { ref, booleanRef, stringRef, makeReactive } from "u2re/object";
import { WRef, observeContentBox } from "u2re/dom";

//
const ROOT = document.documentElement;
const SELECTOR = "ui-modal[type=\"contextmenu\"], ui-button, ui-taskbar, ui-navbar, ui-statusbar, button, label, input, ui-longtext, ui-focustext, ui-row-select, ui-row-button, .u2-input, .ui-input";

//
export const handleByPointer = (cb, root = ROOT)=>{
    let pointerId = -1;
    const rst = (ev)=>{ pointerId = -1; };
    const tgi = (ev)=>{ if (pointerId < 0) pointerId = ev.pointerId; if (pointerId == ev.pointerId) { cb?.(ev); } };
    root.addEventListener("pointerup", rst);
    root.addEventListener("pointercancel", rst);
    root.addEventListener("pointermove", tgi);
    return ()=>{
        root.removeEventListener("pointerup", rst);
        root.removeEventListener("pointercancel", rst);
        root.removeEventListener("pointermove", tgi);
    }
}

//
export const handleForFixPosition = (container, cb, root = window)=>{
    const ptu = (ev)=>cb?.(ev);
    container.addEventListener("scroll", ptu);
    root.addEventListener("resize", ptu);
    const obs = observeContentBox(container, ptu);
    return ()=>{
        container.removeEventListener("scroll", ptu);
        root.removeEventListener("resize", ptu);
        obs?.disconnect?.();
    }
}

//
export const pointerRef = ()=>{
    const coordinate = [ ref(0), ref(0) ];
    coordinate.push(WRef(handleByPointer((ev)=>{ coordinate[0].value = ev.clientX; coordinate[1].value = ev.clientY; })));
    coordinate[Symbol.dispose] = coordinate[2]?.deref?.() ?? coordinate[2];
    return coordinate;
}

//
export const visibleBySelectorRef = (selector)=>{
    const visRef = booleanRef(false);
    visRef[Symbol.dispose] = handleByPointer((ev)=>{
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        visRef.value = target?.matches?.(selector) ?? false;
    });
    return visRef;
}

//
export const showAttributeRef = (attribute = "data-tooltip")=>{
    const valRef = stringRef("");
    valRef[Symbol.dispose] = handleByPointer((ev)=>{
        const target: any = document.elementFromPoint(ev.clientX, ev.clientY);
        valRef.value = target?.getAttribute?.(attribute)?.(`[${attribute}]`) ?? "";
    });
    return valRef;
}

//
//! TODO: My final promise...
//! - area out trigger (unflag)
//! - area outer click/action trigger (unflag)
//! - area dynamicly updated by events (getBoundingClientRect or some sort of)


//
type RefBool = { value: boolean };
interface TriggerOptions {
    root?: any;
    selector?: string;     // селектор, внутри которого клик не считается "dispose"
    closeEvents?: string[]; // дополнительные события для "dispose"
    mouseLeaveDelay?: number; // задержка для mouseleave
}


// Функция для создания ref и привязки "схлопывающих" событий
export function makeTriggerRef(
    ref: RefBool, element: any = document.documentElement,
    closeEvents: string[] = ["pointerdown", "click", "contextmenu", "scroll"]
) { // Сброс ref.value в false
    const close = () => { ref.value = false; }; // Включение ref.value в true (например, по кнопке)
    const open  = () => { ref.value = true;  }; // Навешиваем обработчики для сброса
    closeEvents.forEach(event => element.addEventListener(event, close)); // Возвращаем методы управления
    return {
        ref, open, close,
        destroy() { closeEvents.forEach(event => element.removeEventListener(event, close)); },
        [Symbol.dispose]() { closeEvents.forEach(event => element.removeEventListener(event, close)); }
    };
}

//
export function makeAdvancedTriggerRef(ref: RefBool, element: any, options: TriggerOptions = {}) {
    const {
        root = document.documentElement,
        closeEvents = ["scroll"],
        mouseLeaveDelay = 100
    } = options;

    let mouseLeaveTimer: any = null;

    // Проверка: клик вне элемента/селектора
    function isOutside(target: any) {
        if (element && (element?.contains?.(target?.element ?? target) || element?.querySelector?.(target?.selector || ""))) return false;
        return true;
    }

    // Обработчик клика
    function onPointerDown(ev: Event) {
        const t = ev.target as HTMLElement;
        if (isOutside(t)) ref.value = false;
    }

    // Обработчик mouseleave, scroll и других событий
    function onMouseLeave() { mouseLeaveTimer = setTimeout(() => { ref.value = false; }, mouseLeaveDelay); }
    function onMouseEnter() { if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer); }
    function onDisposeEvent() { ref.value = false; }

    // Навешиваем обработчики
    root.addEventListener("pointerdown", onPointerDown);
    closeEvents.forEach(event => root.addEventListener(event, onDisposeEvent));
    if (element) {
        element.addEventListener("mouseleave", onMouseLeave);
        element.addEventListener("mouseenter", onMouseEnter);
    }

    // Открытие
    const open  = () => { ref.value = true; }; // Принудительное закрытие
    const close = () => { ref.value = false; };

    // Очистка обработчиков
    function destroy() {
        root.removeEventListener("pointerdown", onPointerDown);
        closeEvents.forEach(event => root.removeEventListener(event, onDisposeEvent));
        if (element) {
            element.removeEventListener("mouseleave", onMouseLeave);
            element.removeEventListener("mouseenter", onMouseEnter);
        }
    }

    //
    return { ref, open, close, destroy };
}

//
type Area = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    // можно добавить centerX, centerY и т.д.
};

//
export function boundingBoxRef(anchor: HTMLElement, options?: {
    root?: HTMLElement,
    observeResize?: boolean,
    observeMutations?: boolean,
}) {
    const area: Area = makeReactive({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
    const { root = window, observeResize = true, observeMutations = false } = options || {};

    // Функция обновления area
    function updateArea() {
        const rect = anchor.getBoundingClientRect();
        area.top = rect.top;
        area.left = rect.left;
        area.right = rect.right;
        area.width = rect.width;
        area.bottom = rect.bottom;
        area.height = rect.height;
        // Можно добавить area.centerX = (rect.left + rect.right) / 2 и т.д.
    }

    // События, которые могут влиять на положение/размер
      root.addEventListener("scroll", updateArea, true);
    window.addEventListener("resize", updateArea);

    // ResizeObserver для отслеживания изменений размеров самого anchor
    let resizeObs: ResizeObserver | undefined;
    if (observeResize && "ResizeObserver" in window) {
        resizeObs = new ResizeObserver(updateArea);
        resizeObs.observe(anchor);
    }

    // MutationObserver для отслеживания изменений DOM (если нужно)
    let mutationObs: MutationObserver | undefined;
    if (observeMutations) {
        mutationObs = new MutationObserver(updateArea);
        mutationObs.observe(anchor, { attributes: true, childList: true, subtree: true });
    }

    // Первичное обновление
    updateArea();

    // Очистка
    function destroy() {
        root.removeEventListener("scroll", updateArea, true);
        window.removeEventListener("resize", updateArea);
        resizeObs?.disconnect();
        mutationObs?.disconnect();
    }

    //
    area[Symbol.dispose] = destroy;
    return area;//{ area, updateArea, destroy };
}
