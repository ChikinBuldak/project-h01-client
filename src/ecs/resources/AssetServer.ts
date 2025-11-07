import { isErr, tryCatchAsync, type Resource } from "@/types";
import { registerResource } from "@/utils/registry/resource.registry";

export class AssetServer implements Resource {
    private assets = new Map<string, HTMLImageElement>();
    private preloaded = false;

    /**
 * Loads an array of image URLs and stores them.
 * This should be called once at startup.
 * @param urls A list of asset URLs to preload.
 */
    public async preload(urls: string[]) {
        if (this.preloaded) return;

        console.log(`[AssetServer] Preloading ${urls.length} assets...`);
        const promises = urls.map(url => this.load(url));
        await Promise.all(promises);

        this.preloaded = true;
        console.log("[AssetServer] Preload complete.");
    }


    /**
     * Loads a single image asset.
     */
    private async load(url: string): Promise<void> {
        if (this.assets.has(url)) return;

        const res = await tryCatchAsync(() => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load asset: ${url}. Error: ${err}`));
        }));

        if (isErr(res)) {
            console.error(res.error);
        } else {
            this.assets.set(url, res.value);
        }
    }

    /**
 * Gets a preloaded asset from the server.
 * @param handle The asset's URL (which acts as its handle).
 * @returns The loaded HTMLImageElement, or null if not found.
 */
    public get(handle: string): HTMLImageElement | null {
        return this.assets.get(handle) || null;
    }
}

registerResource("assetServer", AssetServer);
declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    assetServer: AssetServer;
  }
}