import { KeyCode, none, some,type From, type KeyCodeType, type Option } from "@/types";
import { TraitRegistry, TypeOf } from "./trait.registry";

/**
 * A high-speed lookup Set containing all valid key strings.
 */
let ValidKeyCodes: Set<string>;

function getValidKeyCodes() {
    if (!ValidKeyCodes) {
        ValidKeyCodes = new Set<string>(Object.values(KeyCode));
    }
    return ValidKeyCodes;
}

const KeyCodeTypeKey = Symbol("KeyCodeType");

/**
 * Register the implementation for From<string, KeyCodeType>
 */
TraitRegistry.register<From<String, Option<KeyCodeType>>, String, KeyCodeType>(
    "From",
    TypeOf(String), // `From<string...`
    TypeOf(KeyCodeTypeKey), // `...KeyCodeType>`
    {
        /**
         * Safely casts a raw string (e.g., from `event.key`) into a `KeyCodeType`.
         * This is the `From` trait implementation.
         * @param key The raw string from a keyboard event.
         * @returns A valid `KeyCodeType` if the key is recognized, otherwise `undefined`.
         */
        from(key: string): Option<KeyCodeType> {
            const lowerKey = key.toLowerCase();
            if (getValidKeyCodes().has(lowerKey)) {
                // This cast is now safe because we've just verified
                // the string exists in our set of valid KeyCodeTypes.
                return some(lowerKey as KeyCodeType);
            }
            return none;
        }
    }
);

/**
 * Getter for the From<string, KeyCodeType> trait implementation.
 */
export const getFromStringToKeyCodeType = () =>
    TraitRegistry.get<From<String, Option<KeyCodeType>>, String, KeyCodeType>(
        "From",
        TypeOf(String),
        TypeOf(KeyCodeTypeKey)
    );