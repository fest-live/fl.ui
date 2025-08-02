import { ScrollBar } from "../../src/ui/scrollbar/Scrollbar";
import { addEvent, addEvents, includeSelf } from "fest/dom";

//
export const doButtonAction = (button, input: HTMLInputElement)=>{
    if (button.matches(".u2-copy") && input?.matches?.("input") && (input?.selectionStart != input?.selectionEnd)) { navigator.clipboard.writeText(input.value.substring(input.selectionStart || 0, input.selectionEnd || input.selectionStart || 0)); }
    if (button.matches(".u2-paste") && input?.selectionStart != null) {
        navigator.clipboard.readText().then(
            (clipText) => {
                const oldStart = input?.selectionStart || 0;
                const paste = (input?.value?.substring(0, input?.selectionStart || 0) || "") + (clipText || "") + (input?.value?.substring?.(input?.selectionEnd || 0) || "");
                if (input) { input.value = paste; };

                //
                input?.setSelectionRange(
                    oldStart + (clipText?.length||0),
                    oldStart + (clipText?.length||0)
                );

                //
                input?.dispatchEvent(new Event("input", {
                    bubbles: true,
                    cancelable: true,
                }))
            },
        );
    }
}

//
export const holdFocus = (input)=>{
    let pointerId = -1;

    addEvent(input, "pointerdown", (ev)=>{
        if (pointerId < 0) {
            input?.setPointerCapture?.(pointerId = ev?.pointerId);
        }
    });

    addEvent(input, "blur", (ev)=>{
        if (pointerId >= 0) {
            input?.focus?.();
        }
    });

    addEvent(document, "pointerup", (ev)=>{
        if (pointerId == ev?.pointerId) {
            input?.releasePointerCapture?.(pointerId);
            pointerId = -1;
        }
    });

    addEvent(document, "pointercancel", (ev)=>{
        if (pointerId == ev?.pointerId) {
            input?.releasePointerCapture?.(pointerId);
            pointerId = -1;
        }
    });
}

//
export const makeInput = (host?: HTMLElement, ROOT = document.documentElement)=>{
    if (!host) return;

    //
    const input = host?.querySelector?.("input");
    holdFocus(input);

    //
    const weak  = new WeakRef(host);
    const scp   = [0, 0];
    const scp_w = new WeakRef(scp);
    const enforceFocus = (ev)=>{
        const scrollable = weak?.deref?.();
        const element = ev?.target as HTMLElement;
        if (element?.matches?.("input[type=\"text\"], ui-longtext, ui-focustext") && (scrollable?.contains(element) || element?.contains?.(scrollable as Node))) {
            const input: HTMLInputElement | null = (element?.matches("input") ? element : element?.querySelector?.("input[type=\"text\"]")) as HTMLInputElement;
            if (input) {
                if (ev.type == "click" || ev.pointerType == "touch") {
                    ev?.preventDefault?.();
                    ev?.stopPropagation?.();
                }
                if (document.activeElement != input && ev.type == "click") {
                    input?.focus?.();
                }
            }
        }
    };

    //
    addEvent(ROOT, "click", enforceFocus);
    addEvent(ROOT, "select", enforceFocus);
    addEvent(ROOT, "selectionchange", enforceFocus);
    addEvent(ROOT, "selectstart", enforceFocus);

    //
    {
        const bar = host?.shadowRoot?.querySelector?.(".u2-scroll-box");
        const box = host?.shadowRoot?.querySelector?.(".u2-input-box") as HTMLElement;
        const scr_w = new WeakRef(box);
        const scrollPos = scp;

        //
        if (scrollPos) {
            scrollPos[0] = box?.scrollLeft || 0;
            scrollPos[1] = box?.scrollTop  || 0;
        }

        //
        addEvent(document, "wheel", (ev)=>{
            const scrollable = scr_w?.deref?.();
            if (scrollable?.matches?.(":where(:hover, :active)")) {
                ev.preventDefault();
                ev.stopPropagation();
                {   //
                    scrollable?.scrollBy?.({
                        left: ((ev?.deltaY || 0)+(ev?.deltaX || 0)), top: 0,
                        behavior: "smooth"
                    });
                }
            }
        }, {passive: false});

        //
        new ScrollBar({
            content: box,
            holder: host,
            scrollbar: bar
        }, 0);
    }

    //
    let selection = false;
    const whenCancel = (ev)=>{
        //const box = weak?.deref?.()?.shadowRoot?.querySelector?.(".u2-input-box") as HTMLElement;
        //const scrollPos = scp_w?.deref?.();
        /*if (selection) { box.scrollTo({
            left: scrollPos?.[0] || 0,
            top : scrollPos?.[1] || 0,
            behavior: "instant"
        }); };*/
        selection = false;
    }

    //
    addEvent(ROOT, "pointerup", whenCancel, {capture: true, passive: true});
    addEvent(ROOT, "pointercancel", whenCancel, {capture: true, passive: true});
    addEvent(ROOT, "selectionchange", ()=>{
        const box = weak?.deref?.()?.querySelector(".u2-input-box") as HTMLElement;
        const scrollPos = scp_w?.deref?.();
        if (scrollPos) {
            scrollPos[0] = box?.scrollLeft || 0;
            scrollPos[1] = box?.scrollTop  || 0;
        }
        if (input?.selectionStart != input?.selectionEnd) {
            //selection = true;
        }
    }, {capture: true, passive: true});

    //
    const preventScroll = ()=>{
        const box = weak?.deref?.()?.shadowRoot?.querySelector(".u2-input-box") as HTMLElement;
        const scrollPos = [box.scrollLeft, box.scrollTop];
        /*if (selection) { box.scrollTo({
            left: scrollPos[0],
            top: scrollPos[1],
            behavior: "instant"
        }); };*/
    }

    //
    const toFocus = ()=>{ if (document.activeElement != input) { input?.focus?.(); } }
    const preventDrag = (ev)=>{ ev.preventDefault(); if (ev.dataTransfer) { ev.dataTransfer.dropEffect = "none"; } }
    {   //
        const box = host?.shadowRoot?.querySelector?.(".u2-input-box") as HTMLElement;
        addEvents(box, {
            "scroll"   : preventScroll,
            "scrollend": preventScroll,
            "dragstart": preventDrag
        });
        addEvents(box, {
            "dragstart": preventDrag,
            "focus"    : toFocus
        });
        addEvents(host, {
            "dragstart": preventDrag,
            "focus"    : toFocus
        });
        addEvents(input, {
            "dragstart": preventDrag
        });
    }
}

//
export const updateInput = (state, target)=>{
    const selector = "input:where([type=\"text\"], [type=\"number\"], [type=\"range\"])";
    const input    = includeSelf(target, "input");
    const name     = input?.name || target?.dataset?.name || "";

    //
    if (state?.[name] != null) { // not exists not preferred...
        if (state && input?.matches?.(selector)) {
            if (input.value != state[name]) {
                input.value = state[name];
                input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true, }));
            }
        }

        // setup radio boxes (requires wrapper)
        if (state) {
            const radio = includeSelf(target, `input:where([type=\"radio\"][name=\"${name}\"][value=\"${state?.[name]}\"])`);
            if (state && radio && state[name] == radio.value && !radio?.checked) { radio?.click?.(); };
        }

        // setup check boxes
        const checkbox = includeSelf(target, "input:where([type=\"checkbox\"])");
        if (state && checkbox) {
            if (state[name] != checkbox.checked) {
                checkbox.checked = !!state[name];
                checkbox.dispatchEvent(new Event("change", { bubbles: true, cancelable: true, }))
            }
        }
    }
}
