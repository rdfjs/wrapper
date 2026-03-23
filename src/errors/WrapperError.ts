export class WrapperError extends Error {
    constructor(message?: string, cause?: any) {
        super(message)
        this.name = this.constructor.name
        this.cause = cause
    }
}
