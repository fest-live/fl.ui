declare module "@fest-lib/cdnImport" {
    export const importCache: (name: string) => Promise<unknown>;
    export const importCdn: (modules: string[]) => Promise<unknown>;
    export default importCdn;
}
