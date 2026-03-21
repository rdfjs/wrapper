export class SingularTooManyValuesError extends Error {
    constructor(predicate: string, subject: string) {
        super(`More than one value for predicate ${predicate} on term ${subject}`)
        this.name = "SingularTooManyValuesError"
    }
}
