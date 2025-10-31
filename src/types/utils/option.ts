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
export const map = <T, U>(opt: Option<T>, fn: (t: T) => U): Option<U> =>
  isSome(opt) ? some(fn(opt.value)) : none;

export const andThen = <T, U>(
  opt: Option<T>,
  fn: (t: T) => Option<U>
): Option<U> => (isSome(opt) ? fn(opt.value) : none);
