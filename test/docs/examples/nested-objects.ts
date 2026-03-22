import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

export class Address extends TermWrapper {
    get street(): string | undefined {
        return this.singularNullable(SCHEMA + "streetAddress", ValueMapping.literalToString)
    }

    set street(value: string | undefined) {
        this.overwriteNullable(SCHEMA + "streetAddress", value, TermMapping.stringToLiteral)
    }

    get city(): string | undefined {
        return this.singularNullable(SCHEMA + "addressLocality", ValueMapping.literalToString)
    }
}

export class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable(SCHEMA + "name", ValueMapping.literalToString)
    }

    get address(): Address | undefined {
        return this.singularNullable(SCHEMA + "address", ObjectMapping.as(Address))
    }

    set address(value: Address | undefined) {
        this.overwriteNullable(SCHEMA + "address", value, ObjectMapping.as(Address))
    }

    get knows(): Person | undefined {
        return this.singularNullable(SCHEMA + "knows", ObjectMapping.as(Person))
    }
}
