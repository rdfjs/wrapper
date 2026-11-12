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

    //#region Ignore in documentation

    /** @ignore */
    static override captureStackTrace(targetObject: object, constructorOpt?: Function) {
        super.captureStackTrace(targetObject, constructorOpt)
    }

    /** @ignore */
    static override prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]) {
        super.prepareStackTrace(err, stackTraces)
    }

    /** @ignore */
    static override get stackTraceLimit() {
        return super.stackTraceLimit
    }

    /** @ignore */
    static override set stackTraceLimit(value) {
        super.stackTraceLimit = value
    }

    //#endregion
}
