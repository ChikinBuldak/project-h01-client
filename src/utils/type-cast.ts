import { err, ok, type Result } from "@/types";

// Core interfaces
export interface From<T> {
    from(value: T): this;
}

export interface Into<T> {
    into<Target>(): Target extends T ? Target : never;
}

// Safe casting interface
export interface SafeCast {
    /**
     * Safely cast to a type that the current type can be converted into
     */
    into<T>(): T;

    /**
     * Attempt to cast to a type, returns Result type for error handling
     */
    tryInto<T>(): Result<T, Error>;
}

// Base class that implements safe casting
export class SafeCastable implements SafeCast {
    value: unknown;
    constructor(value: unknown) {
        this.value = value;
    }

    into<T>(): T {
        return this.value as T;
    }

    tryInto<T>(): Result<T, Error> {
        try {
            return ok(this.value as T);
        } catch (error) {
            return err(error as Error);
        }
    }
}

export type Castable<T, U> = T extends U ? T : never;
export type MaybeCastable<T, U> = T extends U ? T : (U extends T ? U : never);

// Main converter class
export class Converter<T> implements SafeCast {
    private value: T;
    constructor(value: T) {
        this.value = value
    }
    /**
     * Safe cast with type checking
     */
    into<U>(): MaybeCastable<T, U> {
        // Runtime type checking could be added here
        return this.value as unknown as MaybeCastable<T, U>;
    }

    /**
     * Try cast with error handling
     */
    tryInto<U>(): Result<MaybeCastable<T, U>, Error> {
        try {
            // You can add custom validation logic here
            const result = this.into<U>();
            return ok(result);
        } catch (error) {
            return err(error as Error);
        }
    }

    /**
     * Unsafe cast (use with caution)
     */
    unsafeInto<U>(): U {
        return this.value as unknown as U;
    }

    /**
     * Chain conversions
     */
    then<U>(fn: (value: T) => U): Converter<U> {
        return new Converter(fn(this.value));
    }
}

// Utility functions
export function from<T>(value: T): Converter<T> {
    return new Converter(value);
}

export function cast<T, U>(value: T): U {
    return value as unknown as U;
}

export function tryCast<T, U>(value: T): Result<U, Error> {
    try {
        return ok(value as unknown as U);
    } catch (error) {
        return err(error as Error);
    }
}
