import * as z from "zod";
import configJson from '@/assets/game.config.json';


export const AssetsSchema = z.object({
  "images": z.array(z.string()),
  "audio": z.array(z.string()),
});
export type Assets = z.infer<typeof AssetsSchema>;

export const BasicAttack1Schema = z.object({
  "row": z.number(),
  "frameCount": z.number(),
  "frameDuration": z.number(),
});
export type BasicAttack1 = z.infer<typeof BasicAttack1Schema>;

export const PitSchema = z.object({
  "x": z.number(),
  "y": z.number(),
  "width": z.number(),
  "height": z.number(),
});
export type Pit = z.infer<typeof PitSchema>;

export const LocalPlayerSchema = z.object({
  "x": z.number(),
  "y": z.number(),
});
export type LocalPlayer = z.infer<typeof LocalPlayerSchema>;

export const RemotePlayerSchema = z.object({
  "x": z.number(),
  "y": z.number(),
  "mockMove": z.boolean(),
});
export type RemotePlayer = z.infer<typeof RemotePlayerSchema>;

export const AnimationsSchema = z.object({
  "idle": BasicAttack1Schema,
  "basic_attack_1": BasicAttack1Schema,
  "basic_attack_2": BasicAttack1Schema,
  "basic_attack_3": BasicAttack1Schema,
});
export type Animations = z.infer<typeof AnimationsSchema>;

export const SceneSchema = z.object({
  "localPlayer": LocalPlayerSchema,
  "remotePlayer": RemotePlayerSchema,
  "ground": z.array(PitSchema),
  "pit": PitSchema,
});
export type Scene = z.infer<typeof SceneSchema>;

export const ModelSchema = z.object({
  "name": z.string(),
  "sprite": z.string(),
  "animations": AnimationsSchema,
});
export type Model = z.infer<typeof ModelSchema>;

export const PlayerSchema = z.object({
  "width": z.number(),
  "height": z.number(),
  "frameWidth": z.number(),
  "frameHeight": z.number(),
  "model": ModelSchema,
});
export type Player = z.infer<typeof PlayerSchema>;

export const GameConfigSchema = z.object({
  "assets": AssetsSchema,
  "player": PlayerSchema,
  "scene": SceneSchema,
});
export type GameConfig = z.infer<typeof GameConfigSchema>;

export const gameConfig: GameConfig = configJson as GameConfig;