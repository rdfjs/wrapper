/**
 * Base class of all errors thrown by this library.
 */
export class WrapperError extends Error {
    /**
     * Creates a new instance of {@link WrapperError}.
     *
     * @param message - A human-readable description of the error.
     * @param cause - The specific original cause of the error.
     */
    constructor(message?: string, cause?: any) {
        super(message)
        this.name = this.constructor.name
        this.cause = cause
    }
}
