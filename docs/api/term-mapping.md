# TermMapping API Reference

The `TermMapping` namespace contains functions that convert a JavaScript value to an RDF/JS `TermWrapper`. These functions are used as the `termMapping` argument to `TermWrapper` write methods (`overwrite`, `overwriteNullable`, `objects`).

## Import

```typescript
import { TermMapping } from "@rdfjs/wrapper"
```

## Type

```typescript
type ITermMapping<T> = (
    value: T,
    dataset: DatasetCore,
    factory: DataFactory,
) => TermWrapper | undefined
```

A term mapping is a function that receives a JavaScript value and the dataset/factory context, and returns a `TermWrapper` (or `undefined` to suppress adding a triple).

---

## Built-in Term Mappings

### `TermMapping.stringToLiteral`

```typescript
stringToLiteral(value: string, dataset, factory): TermWrapper
```

Creates a plain string literal.

```typescript
set name(value: string) {
    this.overwrite("https://schema.org/name", value, TermMapping.stringToLiteral)
}
```

### `TermMapping.stringToIri`

```typescript
stringToIri(value: string, dataset, factory): TermWrapper
```

Creates a named node from a string IRI.

```typescript
set homepage(value: string) {
    this.overwrite("https://schema.org/url", value, TermMapping.stringToIri)
}
```

### `TermMapping.stringToBlankNode`

```typescript
stringToBlankNode(value: string | undefined, dataset, factory): TermWrapper
```

Creates a blank node. The string is used as the blank node label; pass `undefined` to generate a fresh blank node.

### `TermMapping.numberToLiteral`

```typescript
numberToLiteral(value: number, dataset, factory): TermWrapper
```

Creates an `xsd:double` literal from a number.

```typescript
set price(value: number) {
    this.overwrite("https://schema.org/price", value, TermMapping.numberToLiteral)
}
```

### `TermMapping.booleanToLiteral`

```typescript
booleanToLiteral(value: boolean, dataset, factory): TermWrapper
```

Creates an `xsd:boolean` literal.

```typescript
set active(value: boolean) {
    this.overwrite("https://schema.org/active", value, TermMapping.booleanToLiteral)
}
```

### `TermMapping.dateToLiteral`

```typescript
dateToLiteral(value: Date, dataset, factory): TermWrapper
```

Creates an `xsd:date` literal from a `Date` object (using `toISOString()`).

```typescript
set birthDate(value: Date) {
    this.overwrite("https://schema.org/birthDate", value, TermMapping.dateToLiteral)
}
```

### `TermMapping.langStringToLiteral`

```typescript
langStringToLiteral(value: ILangString, dataset, factory): TermWrapper
```

Creates a language-tagged literal from an `{ lang: string, string: string }` object.

```typescript
set label(value: ILangString) {
    this.overwrite("https://www.w3.org/2000/01/rdf-schema#label", value, TermMapping.langStringToLiteral)
}
```

### `TermMapping.asIs`

```typescript
asIs(value: Term, dataset, factory): TermWrapper
```

Wraps an existing RDF/JS `Term` as-is.

### `TermMapping.identity`

```typescript
identity<T>(value: T): T
```

Returns the value unchanged. Used internally; not typically needed in application code.

---

## Custom Term Mappings

You can write your own term mapping as a plain function:

```typescript
import type { ITermMapping } from "@rdfjs/wrapper"
import { TermWrapper } from "@rdfjs/wrapper"

const decimalFromNumber: ITermMapping<number> = (value, dataset, factory) =>
    new TermWrapper(
        factory.literal(
            value.toString(),
            factory.namedNode("http://www.w3.org/2001/XMLSchema#decimal"),
        ),
        dataset,
        factory,
    )

set price(value: number) {
    this.overwrite("https://schema.org/price", value, decimalFromNumber)
}
```
