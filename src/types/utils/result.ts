/** Represents a successful operation with a value T. */
export type Ok<T> = {
    readonly tag: "ok";
    readonly value: T;
};

/** Represents a failed operation with an error E. */
export type Err<E> = {
    readonly tag: "err";
    readonly error: E;
};

/**
 * The Result type, which is either an Ok (success) or an Err (failure).
 * T is the success type, E is the error type.
 */
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T, E = unknown>(value: T): Result<T, E> => ({ tag: "ok", value });
export const err = <T = unknown, E = unknown>(error: E): Result<T, E> => ({ tag: "err", error });

/** Checks if the Result is the Ok variant. */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.tag === "ok";

/** Checks if the Result is the Err variant. */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => result.tag === 'err';

/**
 * Maps an Ok<T> to Ok<U> by applying a function, leaving Err<E> untouched.
 */
export const map = <T, E, U>(
    result: Result<T, E>,
    fn: (t: T) => U
): Result<U, E> => {
    if (isOk(result)) {
        return ok(fn(result.value));
    }
    // Result is Err, return a new Err with the existing error (but updated type signature for U)
    return err(result.error) as Result<U, E>;
};

/**
 * Maps an Err<E> to a new Err<U> by applying a function, leaving Ok<T> untouched.
 */
export const mapErr = <T, E, U>(
    result: Result<T, E>,
    fn: (e: E) => U
): Result<T, U> => {
    if (isOk(result)) {
        // Result is Ok, return a new Ok with the existing value (but updated type signature for U)
        return ok(result.value) as Result<T, U>;
    }
    return err(fn(result.error));
};

/**
 * Chains two fallible operations.
 * Maps an Ok<T> to Result<U, E> by calling a function that returns a Result.
 */
export const andThen = <T, E, U>(
    result: Result<T, E>,
    fn: (t: T) => Result<U, E>
): Result<U, E> => {
    if (isOk(result)) {
        return fn(result.value);
    }
    // Result is Err, return the existing Err (but updated type signature)
    return result as Result<U, E>;
};

/**
 * Unwraps the value, throwing an error with a custom message if it is Err.
 */
export const expect = <T, E>(result: Result<T, E>, msg: string): T => {
    if (isOk(result)) {
        return result.value;
    }
    const errorMessage = JSON.stringify(result.error);
    throw new Error(`${msg}: ${errorMessage}`);
};

/**
 * Unwraps the value, throwing a default error message if it is Err.
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
    return expect(result, 'Called unwrap() on an Err value');
};

/**
 * Returns the contained Ok value or a provided default value.
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
    if (isOk(result)) {
        return result.value;
    }
    return defaultValue;
};

export const matchOk = <T, E>(result: Result<T, E>): { value: T } | undefined => {
    if (isOk(result)) {
        return { value: result.value };
    }
    return undefined;
};

/**
 * Returns an object suitable for destructuring in a pattern match:
 * - If the result is Err, returns { error: E }
 * - If the result is Ok, returns undefined
 * This allows checking for failure and simultaneously extracting the error.
 */
export const matchErr = <T, E>(result: Result<T, E>): { error: E } | undefined => {
    if (isErr(result)) {
        return { error: result.error };
    }
    return undefined;
};

/**
 * Wraps a function that might throw an exception, executing it and returning
 * its result as a Result<T, E> type, ensuring type safety without exceptions.
 * * @param fn The function to execute.
 * @returns An Ok<T> on success, or an Err<E> containing the thrown error on failure.
 */
export function tryCatch<T, E = Error>(
    fn: () => T
): Result<T, E> {
    try {
        const value = fn();
        return ok<T, E>(value);
    } catch (e) {
        // The error type is inferred from the function's type parameter E.
        return err<T, E>(e as E); 
    }
}

/**
 * Executes a function based on the state of the Result (Ok or Err).
 * This is the primary way to consume a Result safely in functional TypeScript.
 * * @param result The Result object to match against.
 * @param handlers An object containing the functions to call for Ok and Err variants.
 * @returns The return value of the executed handler function (type R).
 */
export const match = <T, E, R>(
    result: Result<T, E>,
    handlers: {
        ok: (value: T) => R;
        err: (error: E) => R;
    }
): R => {
    switch (result.tag) {
        case "ok":

            return handlers.ok(result.value);
        case "err":
            return handlers.err(result.error);
    }
};