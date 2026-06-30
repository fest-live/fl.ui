declare module "fest/cdnImport" {
    export const importCache: (name: string) => Promise<unknown>;
    export const importCdn: (modules: string[]) => Promise<unknown>;
    export default importCdn;
}
