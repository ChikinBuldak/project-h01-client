import { gameConfig, type GameConfig, type Resource } from "@/types";

export class ConfigResource implements Resource {
  public effectiveOnline: boolean;
  public config: GameConfig;

  constructor(effectiveOnline: boolean) {
    this.effectiveOnline = effectiveOnline;
    this.config = gameConfig; //
  }
}