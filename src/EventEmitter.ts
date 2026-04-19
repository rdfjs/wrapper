export class EventEmitter<Args extends any[]> {
    public readonly listeners: Set<(...args: Args) => void> = new Set();

    on(listener: (...args: Args) => void): void {
        this.listeners.add(listener);
    }

    off(listener: (...args: Args) => void): void {
        this.listeners.delete(listener);
    }

    emit(...args: Args): void {
        for (const listener of this.listeners) {
            listener(...args);
        }
    }
}
