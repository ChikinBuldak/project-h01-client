// src/utils/registry/game-state.ts

import { TraitRegistry, type PlayerPhysicsState, type PlayerStateMessage } from "@/types";
import { InGameStateComponent, type InGameStateType } from "@/ecs/components/scenes/InGameStateComponent";
import { TypeOf, type Clone, type Eq, type From} from '../../types/utils';
import { Transform } from "@/ecs/components";

// --- Type keys ---
const TransformKey = TypeOf(Transform);
const PlayerPhysicsStateKey = Symbol("PlayerPhysicsState");
const PlayerStateMessageKey = Symbol("PlayerStateMessage");

// --- Eq<Transform> ---
TraitRegistry.register<Eq<Transform>, Transform, Transform>(
  "Eq",
  TransformKey,
  TransformKey,
  {
    equals(a, b) {
      return (
        a.position.x === b.position.x &&
        a.position.y === b.position.y &&
        a.rotation === b.rotation
      );
    },
  }
);

// --- Clone<Transform> ---
TraitRegistry.register<Clone<Transform>, Transform, Transform>(
  "Clone",
  TransformKey,
  TransformKey,
  {
    clone(source) {
      return new Transform(source.position.x, source.position.y, source.rotation);
    },
  }
);

// From PlayerStateMessage
TraitRegistry.register<
  From<PlayerStateMessage, Transform>,
  PlayerStateMessage,
  Transform
>("Into", TypeOf(PlayerStateMessageKey), TransformKey, {
  from(from) {
    if ("state" in from && "transform" in from.state) {
      const t = from.state.transform;
      return new Transform(t.position.x, t.position.y, t.rotation ?? 0);
    }
    throw new Error("Invalid PlayerStateMessage in Into<Transform>");
  },
});

// From PlayerPhysicsState
TraitRegistry.register<
  From<PlayerPhysicsState, Transform>,
  PlayerPhysicsState,
  Transform
>("Into", TypeOf(PlayerPhysicsStateKey), TransformKey, {
  from(from) {
    if ("transform" in from) {
      return new Transform(from.transform);
    }
    throw new Error("Invalid PlayerPhysicsState in Into<Transform>");
  },
});

const InGameStateTypeKey = Symbol("InGameStateType");
// Trait InGameStateComponent -> InGameStateType
TraitRegistry.register<
    From<InGameStateComponent, InGameStateType>,
    InGameStateComponent,
    InGameStateType
>("Into", TypeOf(InGameStateComponent), TypeOf(InGameStateTypeKey), {
    from(from) {
        return {
            isPaused: from.isPaused,
        } as InGameStateType
    }
} )

TraitRegistry.register<Eq<InGameStateType>, InGameStateType, InGameStateComponent>(
    "Eq",
    TypeOf<InGameStateType>(InGameStateTypeKey),
    TypeOf(InGameStateComponent),
    {
        equals(a, b) {
            return a.isPaused === b.isPaused;
        }
    })

// helper to get the registry
export function getEqInGameState() {
    return TraitRegistry.get<Eq<InGameStateType>, InGameStateType, InGameStateComponent>(
        "Eq",
        TypeOf(InGameStateTypeKey),
        TypeOf(InGameStateComponent)
    );
}

export const getEqTransform = () =>
  TraitRegistry.get<Eq<Transform>, Transform, Transform>("Eq", TransformKey, TransformKey);

export const getCloneTransform = () =>
  TraitRegistry.get<Clone<Transform>, Transform, Transform>("Clone", TransformKey, TransformKey);

export const getIntoTransformFromPlayerState = () =>
  TraitRegistry.get<From<PlayerStateMessage, Transform>, PlayerStateMessage, Transform>(
    "From",
    TypeOf(PlayerStateMessageKey),
    TransformKey
  );

export const getIntoTransformFromPhysicsState = () =>
  TraitRegistry.get<From<PlayerPhysicsState, Transform>, PlayerPhysicsState, Transform>(
    "From",
    TypeOf(PlayerPhysicsStateKey),
    TransformKey
  );

export const getIntoInGameStateTypeFromInGameStateComponent = () => 
    TraitRegistry.get<
    From<InGameStateComponent, InGameStateType>,
    InGameStateComponent,
    InGameStateType
>("From", TypeOf(InGameStateComponent), TypeOf(InGameStateTypeKey));