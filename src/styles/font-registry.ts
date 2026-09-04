/**
 * Font Registry
 * FIND:font-registry
 *
 * WHY: Dynamic shards keep each CRX chunk under the 2048 kB minify warning.
 * INVARIANT: do not statically import shard files from this barrel.
 */

const loadShard = (loader: () => Promise<{ fontRegistry: Record<string, unknown> }>) => loader();

export const loadFontRegistryShards = async () => {
    const parts = await Promise.all([
        loadShard(() => import("./font-registry-variable")),
        loadShard(() => import("./font-registry-inter-roman")),
        loadShard(() => import("./font-registry-inter-italic")),
        loadShard(() => import("./font-registry-display-roman")),
        loadShard(() => import("./font-registry-display-italic")),
    ]);
    return Object.assign({}, ...parts.map((part) => part.fontRegistry));
};
