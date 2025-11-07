import type { Resource } from "@/types";

export interface ResourceRegistry {}

// Internal mutable registry map
const registryMap = new Map<string, new (...args: any[]) => Resource>();

// Function to register resources
export function registerResource<K extends string, R extends Resource>(
  key: K,
  ctor: new (...args: any[]) => R
): void {
  registryMap.set(key, ctor);
}

// Helper to build typed resource objects dynamically
export function buildResourceMap(
  worldResources: Map<Function, Resource>
): { [K in keyof ResourceRegistry]?: ResourceRegistry[K] } {
  const result: any = {};
  for (const [ctor, instance] of worldResources.entries()) {
    // find registered key matching this ctor
    for (const [key, regCtor] of registryMap.entries()) {
      if (regCtor === ctor) {
        result[key] = instance;
      }
    }
  }
  return result;
}