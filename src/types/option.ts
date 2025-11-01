// Base type for Option<T>
export type Option<T> = Some<T> | None;

export type Some<T> = {
  readonly tag: 'some';
  readonly value: T;
};

export type None = {
  readonly tag: 'none';
};

// Constructors
export const some = <T>(value: T): Option<T> => ({
  tag: 'some',
  value,
});

export const none: None = { tag: 'none' };

// Type guards
export const isSome = <T>(opt: Option<T>): opt is Some<T> =>
  opt.tag === 'some';

export const isNone = <T>(opt: Option<T>): opt is None =>
  opt.tag === 'none';

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