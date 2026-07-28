/*
 * Filename: vite.config.js
 * FullPath: modules/projects/fl.ui/vite.config.js
 * Change date and time: 18.01.00_28.07.2026
 * Reason for changes: Serve playground without fest/* UNLOADABLE_DEPENDENCY (Vite 8 + plugin-external).
 */
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import { initiate, projectMap } from "../../shared/vite.config.js";

export const NAME = "fl-ui";
export const __dirname = resolve(import.meta.dirname, "./");

export default defineConfig(async ({ command }) => {
    const tsconfig = JSON.parse(await readFile(resolve(__dirname, "./tsconfig.json"), { encoding: "utf8" }));
    const base = initiate(NAME, tsconfig, __dirname);

    // WHY: restored `_markdown.scss` / component SCSS use Veela `core/misc/*` and `veela-lib`.
    base.css = {
        ...base.css,
        preprocessorOptions: {
            ...base.css?.preprocessorOptions,
            scss: {
                ...base.css?.preprocessorOptions?.scss,
                loadPaths: [
                    resolve(__dirname, "../veela.css/src/scss"),
                    resolve(__dirname, "../veela.css/src/scss/core"),
                    ...(base.css?.preprocessorOptions?.scss?.loadPaths || [])
                ]
            }
        }
    };

    if (command === "serve") {
        // Playground HTML entries — not the library `src/index.ts` build entry.
        base.optimizeDeps = {
            ...base.optimizeDeps,
            force: false,
            entries: [
                resolve(__dirname, "./index.html"),
                resolve(__dirname, "./demo.html")
            ],
            // Workspace packages are source-linked; skip prebundle conversion.
            exclude: [
                ...(base.optimizeDeps?.exclude || []),
                ...Array.from(projectMap.keys())
            ]
        };
    }

    return base;
});
