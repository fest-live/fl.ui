/*
 * Filename: vite.config.js
 * FullPath: modules/projects/fl.ui/vite.config.js
 * Change date and time: 01.28.00_29.07.2026
 * Reason for changes: Serve File Manager demos over HTTPS so OPFS / drop / paste work off-localhost.
 */
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { initiate, projectMap } from "../../shared/vite.config.js";
import { loadHttpsOptions } from "./https/load-options.ts";

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

        // OPFS + File System Access require a secure context. Prefer project
        // PEMs under `https/local` (or mapped folder); fall back to basic-ssl.
        const useHttps = process.env.VIEW_DEV_HTTP !== "1";
        const port = Number(process.env.VIEW_DEV_PORT || process.env.PORT || 8434);
        const viteDevOrigin = (process.env.VITE_DEV_ORIGIN || "").trim();
        const plugins = [...(base.plugins || [])];

        let serverHttps = false;
        if (useHttps) {
            const loaded = loadHttpsOptions();
            if (loaded.hasBundle && loaded.https) {
                serverHttps = {
                    key: loaded.https.key,
                    cert: loaded.https.cert,
                    ca: loaded.https.ca
                };
                console.info(`[fl-ui] HTTPS certs: domain=${loaded.domain} folder=${loaded.folder}`);
            } else {
                plugins.push(basicSsl());
                serverHttps = undefined; // basic-ssl injects certs
                console.info(`[fl-ui] HTTPS via @vitejs/plugin-basic-ssl (${loaded.diagnostics.join("; ")})`);
            }
        } else {
            console.warn("[fl-ui] VIEW_DEV_HTTP=1 — OPFS may be unavailable off localhost");
        }

        base.plugins = plugins;
        base.server = {
            ...base.server,
            host: "0.0.0.0",
            port: Number.isFinite(port) && port > 0 ? port : 8434,
            strictPort: false,
            https: serverHttps,
            // Do not pin worker URLs to localhost when browsing via LAN IP.
            ...(viteDevOrigin ? { origin: viteDevOrigin } : { origin: undefined }),
            open: false
        };
    }

    return base;
});
