/**
 * Turn type from Srdc to Dst safely
 */
export interface From<Src, Dst> {
  /**
   * Safely cast the value from Src to Dst
   * @param value: Source value 
   */
  from(value: Src): Dst;
}

export interface Clone<T> {
  /**
   * Clone the object, returning an object with the exact same value
   */
  clone(source: T): T;
}

export type FromFn<A, B> = (a: A) => B;
export type IntoFn<A, B> = (a: A) => B;

export function from<A, B>(value: A, convert: FromFn<A, B>): B {
  return convert(value);
}

export function into<A, B>(value: A, convert: IntoFn<A, B>): B {
  return convert(value);
}

/**
 * Represents the opaque ID returned by `setInterval` or `setTimeout`.
 * In browsers, this is a `number`. In Node.js, it's a `NodeJS.Timeout` object.
 * We alias it as `number` for clarity in this browser-based project.
 */
export type IInterval = number;

// Rust-like Trait capabilities

// Define a generic trait interface
export interface Eq<A> {
  equals(a: A, b: A): boolean;
}

declare const __InGameStateTypeBrand: unique symbol;

export type ToType<T, Brand extends string = string> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
} & { readonly [__InGameStateTypeBrand]: Brand };

/**
 * Defines the specific handlers for an exhaustive match.
 * e.g., { toggle: (arg: Toggle) => T, patch: (arg: Patch) => T }
 */
type ExhaustiveHandlers<TUnion extends { type: string }, TReturn> = {
  [K in TUnion['type']]: (
    // Extracts the specific union member, e.g., Toggle or Patch
    arg: Extract<TUnion, { type: K }>
  ) => TReturn;
};

/**
 * Defines handlers for a non-exhaustive match, which *requires* a default.
 * e.g., { toggle?: (arg: Toggle) => T, _: () => T }
 */
type NonExhaustiveHandlers<TUnion extends { type: string }, TReturn> = Partial<
  ExhaustiveHandlers<TUnion, TReturn>
> & {
  // The default case handler, as seen in your example
  _: () => TReturn;
};

/**
 * The complete type for the handlers object. It must be either:
 * 1. An exhaustive map of all possible types.
 * 2. A partial map that *includes* a default '_' handler.
 */
type MatchHandlers<TUnion extends { type: string }, TReturn> =
  | ExhaustiveHandlers<TUnion, TReturn>
  | NonExhaustiveHandlers<TUnion, TReturn>;

/**
 * A type-safe pattern matching function for discriminated unions.
 * This is a curried function to fix type inference.
 *
 * @param value The discriminated union object to match against.
 * @returns A new function that accepts the handlers object.
 */
export function match<TUnion extends { type: string }>(value: TUnion) {
  /**
   * The inner function that receives the handlers.
   * `TUnion` is fixed, allowing `TReturn` and `arg` to be inferred correctly.
   */
  return <TReturn>(handlers: MatchHandlers<TUnion, TReturn>): TReturn => {
    // Check if a specific handler exists for the value's type.
    // We cast to `any` here to dynamically access the key,
    // but the `handlers` object itself was strictly typed on input.
    const specificHandler = (handlers as any)[value.type];

    if (specificHandler) {
      // If the handler exists, call it with the value.
      // The `handlers` type ensures `specificHandler` is the correct
      // function for this specific `value` type.
      return specificHandler(value);
    }

    // If no specific handler, we must have a default case.
    // We cast to `NonExhaustiveHandlers` to safely access `_`.
    // The `MatchHandlers` type guarantees `_` must exist if a
    // specific handler was missing.
    const defaultHandler = (
      handlers as NonExhaustiveHandlers<TUnion, TReturn>
    )._;

    // Note: If you provide an exhaustive handler *and* a default,
    // the specific handler will always be chosen first.
    if (defaultHandler) {
      return defaultHandler();
    }

    // This line is theoretically unreachable if TypeScript is used,
    // as the `MatchHandlers` type would have caught the missing handler.
    throw new Error(`Unhandled match case: ${value.type}`);
  };
}

/**
 * Helper type to map primitive values to their string-key representation.
 * e.g., 'StartGame' -> 'StartGame', null -> 'null'
 */
type ValueKey<T> = T extends string | number ? `${T}` :
                   T extends null ? 'null' :
                   T extends undefined ? 'undefined' :
                   never;

/**
 * Handlers for an exhaustive value match.
 * Keys are stringified versions of the values.
 */
type ExhaustiveValueHandlers<TValue, TReturn> = {
  [K in TValue as ValueKey<K>]: () => TReturn;
};

/**
 * Handlers for a non-exhaustive value match (requires a default `_` handler).
 */
type NonExhaustiveValueHandlers<TValue, TReturn> = Partial<ExhaustiveValueHandlers<TValue, TReturn>> & {
  _: () => TReturn;
};

/**
 * The complete type for the value handlers object.
 */
type ValueMatchHandlers<TValue, TReturn> =
  | ExhaustiveValueHandlers<TValue, TReturn>
  | NonExhaustiveValueHandlers<TValue, TReturn>;

/**
 * A type-safe pattern matching function for primitive unions (string | number | null | undefined).
 *
 * @param value The primitive value to match against.
 * @returns A new function that accepts the handlers object.
 */
export function matchValue<TValue extends string | number | null | undefined>(value: TValue) {
  /**
   * The inner function that receives the handlers.
   */
  return <TReturn>(handlers: ValueMatchHandlers<TValue, TReturn>): TReturn => {
    // Convert the value to its string-key equivalent (e.g., null -> "null")
    const key = String(value) as ValueKey<TValue>;

    // Check if a specific handler exists
    if (Object.prototype.hasOwnProperty.call(handlers, key)) {
      // Cast to any to access dynamic key, but it's safe due to types.
      return (handlers as any)[key]();
    }

    // Check for the default handler
    // We must cast to the non-exhaustive type to prove `_` might exist.
    const defaultHandler = (
      handlers as NonExhaustiveValueHandlers<TValue, TReturn>
    )._;

    if (defaultHandler) {
      return defaultHandler();
    }

    // This is unreachable if types are correct
    throw new Error(`Unhandled matchValue case: ${key}`);
  };
}