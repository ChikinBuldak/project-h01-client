// Base type for Option<T>
export type Option<T> = Some<T> | None;

export type Some<T> = {
  readonly some: true;
  readonly value: T;
};

export type None = {
  readonly some: false;
};

// Constructors
export const some = <T>(value: T): Option<T> => ({
  some: true,
  value,
});

export const none: None = { some: false };

// Type guards
export const isSome = <T>(opt: Option<T>): opt is Some<T> =>
  opt.some;

export const isNone = <T>(opt: Option<T>): opt is None =>
  !opt.some;

// Functional utilities
export const mapOpt = <T, U>(opt: Option<T>, fn: (t: T) => U): Option<U> =>
  isSome(opt) ? some(fn(opt.value)) : none;

export const andThenOpt = <T, U>(
  opt: Option<T>,
  fn: (t: T) => Option<U>
): Option<U> => (isSome(opt) ? fn(opt.value) : none);

export function safeCall<T>(fn: () => T): T | null {
  try {
    const result = fn();
    return result === undefined ? null : result;
  } catch {
    return null;
  }
}
/**
 * Unwrap the Option value, so that compiler would understand the concrete type of `T`
 * @param opt 
 */
export function unwrapOpt<T>(opt: Some<T>): T;
export function unwrapOpt<T>(opt: None): null;
export function unwrapOpt<T>(opt: Option<T>): T | null;
export function unwrapOpt<T>(opt: Option<T>): T | null {
  return isSome(opt) ? opt.value : null;
}

export type Nullable<T> = T | null;
export type Undefinable<T> = T | undefined;

/**
 * Converts a nullable or undefined value into either:
 * - the raw value (T) if non-nullish, or
 * - the singleton `none` if null or undefined.
 *
 * This allows you to access the value directly without `.value`.
 */
export function ofNullable<T>(value: T | null | undefined): T | None {
  return value !== null && value !== undefined ? value : none;
}

/* Option wrapper (for method chaining support) */

export class OptionWrapper<T> {
  public readonly inner: Some<T> | None;
  private constructor(inner: Some<T> | None) {
    this.inner = inner;
  }

  /** Create Option from nullable or undefined value */
  static ofNullable<T>(value: T | null | undefined): OptionWrapper<T> {
    return new OptionWrapper(
      value !== null && value !== undefined ? some(value) : none
    );
  }

  /** Create Option from a raw value (always Some) */
  static some<T>(value: T): OptionWrapper<T> {
    return new OptionWrapper(some(value));
  }

  /** Singleton None */
  static none<T>(): OptionWrapper<T> {
    return new OptionWrapper<T>(none);
  }

  /** Check if Option contains a value */
  isSome(): this is OptionWrapperWithValue<T> {
    return this.inner.some;
  }

  /** Check if Option is empty */
  isNone(): this is OptionWrapperNone<T> {
    return !this.inner.some;
  }

  /** Map the value inside if Some */
  map<U>(fn: (t: T) => U): OptionWrapper<U> {
    return this.isSome()
      ? new OptionWrapper(some(fn(this.inner.value)))
      : OptionWrapper.none<U>();
  }

  /** Flat map (monadic bind) */
  flatMap<U>(fn: (t: T) => OptionWrapper<U>): OptionWrapper<U> {
    return this.isSome() ? fn(this.inner.value) : OptionWrapper.none<U>();
  }

  /** Return fallback value if None */
  orElse(fallback: T): T {
    return this.isSome() ? this.inner.value : fallback;
  }

  /** Unwrap to raw value or null */
  unwrap(): T | null {
    return this.isSome() ? this.inner.value : null;
  }

  /** Get the raw value or throw */
  expect(message: string): T {
    if (this.isSome()) return this.inner.value;
    throw new Error(message);
  }

  get value(): T {
    if (this.isSome()) return this.inner.value;
    throw new Error("Tried to access value of None");
  }
}

/** Helper types for correct narrowing */
export type OptionWrapperWithValue<T> = OptionWrapper<T> & { inner: Some<T> };
export type OptionWrapperNone<T> = OptionWrapper<T> & { inner: None };