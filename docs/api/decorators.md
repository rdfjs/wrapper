# Decorators API Reference

RDF/JS Wrapper provides two TypeScript decorators for declaring property mappings declaratively.

## Import

```typescript
import { getter, setter, GetterArity, SetterArity, ValueMapping, TermMapping } from "@rdfjs/wrapper"
```

---

## `getter`

```typescript
function getter(
    predicate: string,
    arity: GetterArity,
    valueMapping: IValueMapping<any>,
    termMapping?: ITermMapping<any>,
): (target: unknown, context: ClassGetterDecoratorContext) => () => unknown
```

Applies to a **class getter**. Replaces the getter body with a call to the appropriate `TermWrapper` read method.

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `predicate` | `string` | ✅ | The RDF predicate IRI. |
| `arity` | `GetterArity` | ✅ | Controls which read method is used. |
| `valueMapping` | `IValueMapping<T>` | ✅ | Maps the RDF term to a JavaScript value. |
| `termMapping` | `ITermMapping<T>` | Only for `GetterArity.Set` | Maps a JavaScript value back to an RDF term (required for sets). Defaults to `TermMapping.stringToLiteral`. |

### GetterArity

```typescript
enum GetterArity {
    Singular,         // → this.singular(predicate, valueMapping)
    SingularNullable, // → this.singularNullable(predicate, valueMapping)
    Set,              // → this.objects(predicate, valueMapping, termMapping)
}
```

### Example

```typescript
@getter("https://schema.org/name", GetterArity.SingularNullable, ValueMapping.literalToString)
get name(): string | undefined {
    throw new Error() // replaced by decorator
}

@getter("https://schema.org/age", GetterArity.Singular, ValueMapping.literalToNumber)
get age(): number {
    throw new Error()
}

@getter("https://schema.org/keywords", GetterArity.Set, ValueMapping.literalToString, TermMapping.stringToLiteral)
get keywords(): Set<string> {
    throw new Error()
}
```

---

## `setter`

```typescript
function setter(
    predicate: string,
    arity: SetterArity,
    termMapping: ITermMapping<any>,
): (target: any, context: ClassSetterDecoratorContext) => (value: any) => void
```

Applies to a **class setter**. Replaces the setter body with a call to the appropriate `TermWrapper` write method.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `predicate` | `string` | The RDF predicate IRI. |
| `arity` | `SetterArity` | Controls which write method is used. |
| `termMapping` | `ITermMapping<T>` | Maps a JavaScript value to an RDF term. |

### SetterArity

```typescript
enum SetterArity {
    Singular,         // → this.overwrite(predicate, value, termMapping)
    SingularNullable, // → this.overwriteNullable(predicate, value, termMapping)
}
```

### Example

```typescript
@setter("https://schema.org/name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
set name(_: string | undefined) {} // replaced by decorator

@setter("https://schema.org/age", SetterArity.Singular, TermMapping.numberToLiteral)
set age(_: number) {}
```

---

## Full Decorated Class Example

!!! note "Self-referencing in decorators"
    TypeScript evaluates decorator arguments at class definition time. This means `ObjectMapping.as(Person)` inside a `Person` class decorator would reference the class before it is fully declared, causing a TypeScript error. Use a non-decorator getter for self-referential properties, or reference a separate class.

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

class Person extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined { throw new Error() }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}

    @getter(SCHEMA + "age", GetterArity.SingularNullable, ValueMapping.literalToNumber)
    get age(): number | undefined { throw new Error() }

    @setter(SCHEMA + "age", SetterArity.SingularNullable, TermMapping.numberToLiteral)
    set age(_: number | undefined) {}

    // Self-referential properties cannot use decorators; use a manual getter instead:
    get friends(): Set<Person> {
        return this.objects(SCHEMA + "knows", ObjectMapping.as(Person), ObjectMapping.as(Person))
    }
}
```
