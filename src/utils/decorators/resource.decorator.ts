// src/utils/decorators/resource.decorator.ts

import type { Resource } from "@/types";
import { registerResource } from "@/utils/registry/resource.registry";

// This is the type for a class constructor that creates a Resource
type ResourceConstructor = new (...args: any[]) => Resource;

/**
 * Class decorator that automatically registers a Resource with the 
 * central resource registry.
 * @param name The unique string key for this resource.
 * @example 
 *```ts
 * @resource("assetServer")
 * export class AssetServer implements Resource { ... }
 *```
 */
export function resource(name: string) {
  return function (constructor: ResourceConstructor) {
    // This is the line you were writing manually before!
    registerResource(name, constructor);
  };
}