import type { DataFactory, Literal, Term } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
import type { ILangString } from "../type/ILangString.js"

/**
 * A collection of {@link ITermFromValueMapping | mappers} that create RDF/JS literals from JavaScript primitives.
 *
 * @see
 * - {@link Literal}
 * - [Literals in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal)
 */
export namespace LiteralFrom {
    export function anyUriString(value: string, factory: DataFactory): Term {
        return factory.literal(value, factory.namedNode(XSD.anyURI))
    }

    export function anyUriUrl(value: URL, factory: DataFactory): Term {
        return anyUriString(value.toString(), factory)
    }

    export function base64(value: Uint8Array, factory: DataFactory): Term {
        // TODO: Sort typing
        return factory.literal((value as any).toBase64(), factory.namedNode(XSD.base64Binary))
    }

    /**
     * {@link ITermFromValueMapping Maps} a big integer to an integer literal.
     *
     * @param value - The big integer to convert.
     * @param factory - A collection of methods for creating terms.
     * @returns A literal with datatype [`xsd:integer`](https://www.w3.org/TR/xmlschema-2/#integer) whose lexical form is the decimal representation of the value.
     *
     * @remarks
     * This is the term counterpart of the {@link LiteralAs.bigint} value mapping, so integers too large for a JavaScript `number` round-trip through RDF without loss of precision.
     *
     * @example Assign a bigint beyond Number.MAX_SAFE_INTEGER
     * The mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public set property(value: bigint) {
     *         RequiredAs.object(this, "p", value, LiteralFrom.bigint)
     *     }
     * }
     * ```
     *
     * assigned the value `9007199254740993n` produces the RDF
     * ```turtle
     * <s> <p> "9007199254740993"^^<xsd:integer> .
     * ```
     *
     * @see
     * - [`xsd:integer` in XML Schema Part 2: Datatypes](https://www.w3.org/TR/xmlschema-2/#integer)
     * - [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
     */
    export function bigint(value: bigint, factory: DataFactory): Term {
        return factory.literal(value.toString(), factory.namedNode(XSD.integer))
    }

    export function boolean(value: boolean, factory: DataFactory): Term {
        return factory.literal(value.toString(), factory.namedNode(XSD.boolean))
    }

    export function date(value: Date, factory: DataFactory): Term {
        return factory.literal(value.toISOString().split("T")[0]!, factory.namedNode(XSD.date))
    }

    export function dateTime(value: Date, factory: DataFactory): Term {
        return factory.literal(value.toISOString(), factory.namedNode(XSD.dateTime))
    }

    export function double(value: number, factory: DataFactory): Term {
        return factory.literal(value.toString(), factory.namedNode(XSD.double))
    }

    export function integer(value: number, factory: DataFactory): Term {
        return factory.literal(value.toString(), factory.namedNode(XSD.integer))
    }

    export function hex(value: Uint8Array, factory: DataFactory): Term {
        // TODO: Sort typing
        return factory.literal((value as any).toHex(), factory.namedNode(XSD.hexBinary))
    }

    export function langString(value: ILangString, factory: DataFactory): Term {
        // TODO: Direction
        return factory.literal(value.string, {language: value.lang})
    }

    export function string(value: string, factory: DataFactory): Term {
        return factory.literal(value)
    }

    /**
     * {@link ITermFromValueMapping Maps} a registered symbol to a string literal.
     *
     * @param value - The symbol to convert. Must be registered in the global symbol registry, i.e. created via [`Symbol.for()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for).
     * @param factory - A collection of methods for creating terms.
     * @returns A string literal whose value is the key under which the symbol is registered.
     *
     * @remarks
     * This is the term counterpart of the {@link LiteralAs.symbol} value mapping, which converts literals to symbols via [`Symbol.for()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for).
     *
     * Only symbols in the global symbol registry carry a key ([`Symbol.keyFor()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/keyFor)) that can round-trip through RDF, so unregistered symbols (e.g. created via the `Symbol()` function) are rejected.
     *
     * @throws {@link !TypeError TypeError} If the symbol is not registered in the global symbol registry.
     *
     * @example Assign a registered symbol
     * The mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public set property(value: symbol) {
     *         RequiredAs.object(this, "p", value, LiteralFrom.symbol)
     *     }
     * }
     * ```
     *
     * assigned the value `Symbol.for("example")` produces the RDF
     * ```turtle
     * <s> <p> "example" .
     * ```
     *
     * @see
     * - [`Symbol.for()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for)
     * - [`Symbol.keyFor()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/keyFor)
     */
    export function symbol(value: symbol, factory: DataFactory): Term {
        const key = Symbol.keyFor(value)

        if (key === undefined) {
            throw new TypeError("Symbol must be registered in the global symbol registry")
        }

        return factory.literal(key)
    }

    export function langTuple([key, value]: [string, string], factory: DataFactory): Term {
        return factory.literal(value, key)
    }

    export function datatypeTuple([key, value]: [string, string], factory: DataFactory): Term {
        return factory.literal(value, factory.namedNode(key))
    }
}
