import { gameConfig, type GameConfig, type Resource } from "@/types";
import { registerResource } from "@/utils/registry/resource.registry";

export class ConfigResource implements Resource {
  public effectiveOnline: boolean;
  public config: GameConfig;

  constructor(effectiveOnline: boolean) {
    this.effectiveOnline = effectiveOnline;
    this.config = gameConfig; //
  }
}

registerResource("configResource", ConfigResource);

declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    configResource: ConfigResource;
  }
}