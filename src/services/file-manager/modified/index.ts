export { default as FileManager } from "./FileManager";
export { FileManagerContent } from "./FileManagerContent";
export { FileOperative, type FileEntryItem, type EntryKind } from "./Operative";
export { createItemCtxMenu } from "./ContextMenu";
export { UIElement } from "./UIElement";

// Register custom elements
import { default as FileManager } from "./FileManager";
import { FileManagerContent } from "./FileManagerContent";

if (typeof customElements !== 'undefined') {
    if (!customElements.get('ui-file-manager')) {
        customElements.define('ui-file-manager', FileManager);
    }
    if (!customElements.get('ui-file-manager-content')) {
        customElements.define('ui-file-manager-content', FileManagerContent);
    }
}