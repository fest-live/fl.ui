/**
 * <md-view> Web Component and MarkdownViewer API
 *
 * Unified markdown rendering service that provides both:
 * - Web Component API: <md-view src="..." content="..."></md-view>
 *   Parsed HTML is rendered into a light-DOM `.markdown-body` child (default slot); shadow DOM holds layout/chrome only.
 * - Class-based API: createMarkdownViewer({ content: "...", ... })
 *
 * Usage:
 *   // Web Component
 *   <md-view content="# Hello World"></md-view>
 *   <md-view src="/path/to/file.md"></md-view>
 *
 *   // Class-based API
 *   import { createMarkdownViewer } from "fest/fl-ui/services/markdown-view";
 *   const viewer = createMarkdownViewer({ content: "# Hello", showActions: true });
 *   document.body.append(viewer.render());
 *
 * See fest/fl-ui/services/markdown-view/Markdown for implementation.
 */

// Re-export MarkdownView component (Web Component)
export { MarkdownView as MdViewElement, MarkdownView as default } from "./ts/Markdown";

// Re-export MarkdownViewer class and factory function (Class-based API)
export { MarkdownViewer, createMarkdownViewer, type MarkdownViewerOptions } from "./ts/Markdown";
