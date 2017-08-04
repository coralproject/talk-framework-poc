export type PluginHookFilterFunction = (value?, ...args: any[]) => Promise<any>;

export class PluginHook {
    private tag: string;
    private callbacks: PluginHookFilterFunction[];

    constructor({tag}) {
        this.tag = tag;
        this.callbacks = [];
    }

    public addFilter(fct) {
        this.callbacks.push(fct);
    }

    public async applyFilters(value: any, ...args) {
        if (this.callbacks.length === 0) {
            return value;
        }

        for (const callback of this.callbacks) {
            value = await callback(value, ...args);
        }

        return value;
    }
}
