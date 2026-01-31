/**
 * FL.UI Viewer Components
 *
 * Self-contained viewer components with Shadow DOM encapsulation.
 * These components can be used standalone or integrated with fl.ui.
 *
 * Components:
 * - md-view: Markdown viewer/renderer (from services/markdown-view)
 * - rs-explorer: File system explorer (Native File System Access API)
 */

// Export RsExplorer from local fl.ui directory
export { RsExplorerElement, default as RsExplorer } from "./rs-explorer/RsExplorer";
export type { FileItem, ExplorerState } from "./rs-explorer/RsExplorer";

// Re-export MarkdownView from services
export { MarkdownView as MdViewElement } from "@fl-src/services/markdown-view/Markdown";
