# ValueMapping API Reference

The `ValueMapping` namespace contains functions that convert an RDF/JS `TermWrapper` to a JavaScript value. These functions are used as the `valueMapping` argument to `TermWrapper` read methods (`singular`, `singularNullable`, `objects`).

## Import

```typescript
import { ValueMapping } from "@rdfjs/wrapper"
```

## Type

```typescript
type IValueMapping<T> = (termWrapper: TermWrapper) => T
```

A value mapping is a function that receives a `TermWrapper` (wrapping the RDF object term) and returns a JavaScript value.

---

## Built-in Value Mappings

### `ValueMapping.literalToString`

```typescript
literalToString(termWrapper: TermWrapper): string
```

Returns the string value of a literal term.

```typescript
get name(): string {
    return this.singular("https://schema.org/name", ValueMapping.literalToString)
}
```

### `ValueMapping.literalToNumber`

```typescript
literalToNumber(termWrapper: TermWrapper): number
```

Parses the literal value as a number using `Number(value)`.

```typescript
get age(): number {
    return this.singular("https://schema.org/age", ValueMapping.literalToNumber)
}
```

### `ValueMapping.literalToBoolean`

```typescript
literalToBoolean(termWrapper: TermWrapper): boolean
```

Returns `true` if the literal value is `"true"` or `"1"`.

```typescript
get active(): boolean {
    return this.singular("https://schema.org/active", ValueMapping.literalToBoolean)
}
```

### `ValueMapping.literalToDate`

```typescript
literalToDate(termWrapper: TermWrapper): Date
```

Parses the literal value as a `Date` using `new Date(value)`.

```typescript
get birthDate(): Date {
    return this.singular("https://schema.org/birthDate", ValueMapping.literalToDate)
}
```

### `ValueMapping.literalToLangString`

```typescript
literalToLangString(termWrapper: TermWrapper): ILangString
```

Returns an `{ lang: string, string: string }` object from a language-tagged literal.

```typescript
get label(): ILangString {
    return this.singular("https://www.w3.org/2000/01/rdf-schema#label", ValueMapping.literalToLangString)
}
```

### `ValueMapping.iriToString`

```typescript
iriToString(termWrapper: TermWrapper): string
```

Returns the IRI value of a named node.

```typescript
get homepage(): string {
    return this.singular("https://schema.org/url", ValueMapping.iriToString)
}
```

### `ValueMapping.blankNodeToString`

```typescript
blankNodeToString(termWrapper: TermWrapper): string
```

Returns the blank node identifier. **Throws** if the term is not a blank node.

### `ValueMapping.iriOrBlankNodeToString`

```typescript
iriOrBlankNodeToString(termWrapper: TermWrapper): string
```

Returns the value of any named node or blank node.

### `ValueMapping.asIs`

```typescript
asIs(termWrapper: TermWrapper): Term
```

Returns the underlying RDF/JS `Term` without any conversion.

---

## Custom Value Mappings

You can write your own value mapping as a plain function:

```typescript
import type { IValueMapping } from "@rdfjs/wrapper"

const decimalToNumber: IValueMapping<number> = (tw) => parseFloat(tw.value)

get price(): number {
    return this.singular("https://schema.org/price", decimalToNumber)
}
```
