import type { Resource, SystemResources } from "@/types";

// Utility type to convert PascalCase keys to camelCase
export type CamelCase<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S;

export type CamelCasedResources<T extends SystemResources> = {
  [K in keyof T as CamelCase<string & K>]: T[K];
};

// Helper function to build camelCase resource map
export function buildCamelCasedResources(resourcesMap: Map<Function, Resource>): CamelCasedResources<SystemResources> {
  const out: any = {};
  for (const [ctor, resource] of resourcesMap.entries()) {
    const key = ctor.name.charAt(0).toLowerCase() + ctor.name.slice(1);
    out[key] = resource;
  }
  return out;
}