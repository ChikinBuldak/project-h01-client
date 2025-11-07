import type { Resource } from "@/types";
import { registerResource } from "@/utils/registry/resource.registry";

export class DomResource implements Resource {
    /** Main element <div id="world-container"> */
    public container: HTMLElement | null = null;
    
    /** Element <div id="world"> moved by camera */
    public worldElement: HTMLElement | null = null;

    /**
     * Map of all entities that are rendered into their DOM element.
     * DomRenderSystem will manage this map.
     */
    public elements = new Map<number, HTMLDivElement>();
}

registerResource("domResource", DomResource);

declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    domResource: DomResource;
  }
}