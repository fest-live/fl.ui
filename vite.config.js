import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import { initiate } from "../../shared/vite.config.js";

export const NAME = "fl-ui";
export const __dirname = resolve(import.meta.dirname, "./");

export default defineConfig(async () => {
    const tsconfig = JSON.parse(await readFile(resolve(__dirname, "./tsconfig.json"), { encoding: "utf8" }));
    return initiate(NAME, tsconfig, __dirname);
});
