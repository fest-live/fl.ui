/*
 * Filename: overlays.ts
 * FullPath: modules/projects/fl.ui/test/suites/overlays.ts
 * Reason for changes: Demonstrate the shared transient overlay host and back lifecycle.
 */

import { closeHighestPriority, resolveOverlayHost } from "@fest-lib/lure";
import { openUnifiedContextMenu } from "../../src/ui/explorer/ContextMenu";
import { toggleCalendarFlyout, isCalendarFlyoutOpen } from "../../src/ui/navigation/calendar/CalendarFlyout";
import { setChromeFlyoutShellHost } from "../../src/ui/navigation/flyout/ChromeFlyout";

export function mount(el: HTMLElement): void {
    el.style.cssText =
        "display:flex;flex-direction:column;gap:1rem;padding:1rem;position:relative;box-sizing:border-box;";

    const caption = document.createElement("p");
    caption.className = "fl-ui-dev-suite-caption";
    caption.textContent =
        "Overlays — ContextMenu and Calendar share host discovery plus priority-based back dismissal.";

    const shellHost = document.createElement("div");
    shellHost.setAttribute("data-env-shell-overlays", "");
    shellHost.style.cssText =
        "position:relative;min-block-size:10rem;padding:1rem;border:1px dashed #3f5278;border-radius:12px;background:#111b2d;";

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;";
    const open = document.createElement("button");
    open.type = "button";
    open.textContent = "Open context menu";
    const calendar = document.createElement("button");
    calendar.type = "button";
    calendar.textContent = "Open calendar flyout";
    calendar.setAttribute("data-chrome-flyout-anchor", "calendar");
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close highest-priority overlay";
    const status = document.createElement("output");
    status.style.cssText = "font:0.8rem ui-monospace,monospace;color:#9bb6df;";
    controls.append(open, calendar, close, status);

    const renderStatus = (message: string) => {
        const host = resolveOverlayHost();
        status.value = `${message} · host: ${host === shellHost ? "shell" : host === document.body ? "body" : "app"}`;
    };
    open.addEventListener("click", () => {
        const rect = open.getBoundingClientRect();
        openUnifiedContextMenu({
            x: Math.round(rect.left),
            y: Math.round(rect.bottom),
            items: [{
                id: "more",
                label: "More",
                action: () => {},
                children: [{
                    id: "child",
                    label: "Child action",
                    action: () => renderStatus("child action"),
                }],
            }],
        });
        renderStatus("menu open");
    });
    setChromeFlyoutShellHost(shellHost);
    calendar.addEventListener("click", () => {
        toggleCalendarFlyout(calendar);
        renderStatus(`calendar ${isCalendarFlyoutOpen() ? "open" : "closed"}`);
    });
    close.addEventListener("click", () => {
        const closed = closeHighestPriority();
        renderStatus(closed ? `closed: ${closed.id}` : "no active overlay");
    });
    shellHost.append(controls);
    el.append(caption, shellHost);
    renderStatus("ready");
}
