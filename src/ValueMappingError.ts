export class ValueMappingError extends Error {
    constructor(expected: string, actual: string) {
        super(`Value mapping expected ${expected} but got ${actual}`)
        this.name = "ValueMappingError"
    }
}
