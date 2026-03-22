import { DatasetWrapper, TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

export class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable(SCHEMA + "name", ValueMapping.literalToString)
    }

    set name(value: string | undefined) {
        this.overwriteNullable(SCHEMA + "name", value, TermMapping.stringToLiteral)
    }
}

export class People extends DatasetWrapper {
    /** All people in the dataset (via rdf:type schema:Person). */
    get all(): Iterable<Person> {
        return this.instancesOf(SCHEMA + "Person", Person)
    }

    /** All subjects that have a schema:name property. */
    get named(): Iterable<Person> {
        return this.subjectsOf(SCHEMA + "name", Person)
    }
}
