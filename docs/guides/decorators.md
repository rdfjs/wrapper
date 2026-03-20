# Decorators

RDF/JS Wrapper ships a set of TypeScript decorators that let you declare property mappings declaratively without writing getter and setter bodies manually. Decorators are available for both getters and setters.

!!! note "TypeScript configuration"
    Decorators require TypeScript 5 or later with `"experimentalDecorators"` disabled (they use the native TC39 decorator proposal). Ensure your `tsconfig.json` does **not** set `"experimentalDecorators": true`.

## `@getter`

```typescript
getter(predicate, arity, valueMapping, termMapping?)
```

Applies to a class getter. The decorator replaces the getter body with the appropriate `TermWrapper` method call.

| Parameter | Type | Description |
|---|---|---|
| `predicate` | `string` | The RDF predicate IRI. |
| `arity` | `GetterArity` | Whether to use `singular`, `singularNullable`, or `objects`. |
| `valueMapping` | `IValueMapping<T>` | Maps an RDF term to a JavaScript value. |
| `termMapping` | `ITermMapping<T>` | Required when `arity` is `GetterArity.Set`; maps a JS value back to an RDF term. |

### GetterArity Values

| Value | Underlying Method | Description |
|---|---|---|
| `GetterArity.Singular` | `singular` | Exactly one value; throws if absent or multiple. |
| `GetterArity.SingularNullable` | `singularNullable` | Zero or one value; returns `undefined` if absent. |
| `GetterArity.Set` | `objects` | Multiple values; returns a live `Set<T>`. |

## `@setter`

```typescript
setter(predicate, arity, termMapping)
```

Applies to a class setter. Replaces the setter body with the appropriate `TermWrapper` method call.

| Parameter | Type | Description |
|---|---|---|
| `predicate` | `string` | The RDF predicate IRI. |
| `arity` | `SetterArity` | Whether to use `overwrite` or `overwriteNullable`. |
| `termMapping` | `ITermMapping<T>` | Maps a JavaScript value to an RDF term. |

### SetterArity Values

| Value | Underlying Method | Description |
|---|---|---|
| `SetterArity.Singular` | `overwrite` | Value must not be `undefined`; throws otherwise. |
| `SetterArity.SingularNullable` | `overwriteNullable` | `undefined` removes the triple. |

---

## Example

```typescript
import {
    TermWrapper,
    ValueMapping,
    TermMapping,
    ObjectMapping,
    getter,
    setter,
    GetterArity,
    SetterArity,
} from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

class Tag extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined {
        throw new Error()
    }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}
}

class Article extends TermWrapper {
    @getter(SCHEMA + "headline", GetterArity.Singular, ValueMapping.literalToString)
    get headline(): string {
        throw new Error()
    }

    @setter(SCHEMA + "headline", SetterArity.Singular, TermMapping.stringToLiteral)
    set headline(_: string) {}

    @getter(SCHEMA + "keywords", GetterArity.Set, ObjectMapping.as(Tag), ObjectMapping.as(Tag))
    get tags(): Set<Tag> {
        throw new Error()
    }
}
```

The getter and setter bodies (`throw new Error()` and empty `{}`) are never executed — the decorators replace them entirely. This pattern makes the intent clear while still satisfying TypeScript's type requirements.

---

## Equivalence to Manual Mappings

A decorated getter is equivalent to the manual version:

```typescript
// Decorated
@getter(SCHEMA + "headline", GetterArity.Singular, ValueMapping.literalToString)
get headline(): string { throw new Error() }

// Manual equivalent
get headline(): string {
    return this.singular(SCHEMA + "headline", ValueMapping.literalToString)
}
```

Both approaches are supported; choose whichever fits your style.
