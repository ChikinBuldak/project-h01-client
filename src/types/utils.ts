export interface From<Src, Dst> {
  from(value: Src): Dst;
}

export interface Into<Dst> {
  into(): Dst;
}

export interface Clone<T> {
  /**
   * Clone the object, returning an object with the exact same value
   */
  clone(): T;
}

export interface Eq<T> {
  /**
   * Checks whether this object is equal to another of the same type.
   * @param other The other object to compare against.
   * @returns true if both objects are considered equal.
   */
  equals(other: T): boolean;
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