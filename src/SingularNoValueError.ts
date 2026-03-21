export class SingularNoValueError extends Error {
    constructor(predicate: string, subject: string) {
        super(`No value found for predicate ${predicate} on term ${subject}`)
        this.name = "SingularNoValueError"
    }
}
