export type Trait<A extends any[] = any[], R = any> = (...args: A) => R;

type TypeKey<T> =
  | { kind: "symbol"; id: symbol }     // for plain `type`s
  | { kind: "class"; ctor: new (...args: any[]) => T }; // for classes

export function TypeOf<T>(key: symbol | (new (...args: any[]) => T)): TypeKey<T> {
  return typeof key === "symbol" ? { kind: "symbol", id: key } : { kind: "class", ctor: key };
}

export class TraitRegistry {
  private static impls = new Map<string, any>();

  private static key(trait: string, a: TypeKey<any>, b?: TypeKey<any>) {
    const nameA = a.kind === "class" ? a.ctor.name : a.id.description ?? "SymbolA";
    const nameB = b
      ? b.kind === "class"
        ? b.ctor.name
        : b.id.description ?? "SymbolB"
      : "";
    return `${trait}:${nameA}:${nameB}`;
  }

  static register<TraitType, A, B = void>(
    traitName: string,
    a: TypeKey<A>,
    b: TypeKey<B> | undefined,
    impl: TraitType
  ) {
    const key = this.key(traitName, a, b);
    this.impls.set(key, impl);
  }

  static get<TraitType, A, B = void>(
    traitName: string,
    a: TypeKey<A>,
    b?: TypeKey<B>
  ): TraitType {
    const impl = this.impls.get(this.key(traitName, a, b));
    if (!impl) throw new Error(`No impl for ${traitName} <${a}, ${b}>`);
    return impl;
  }
}