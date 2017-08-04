import * as Debug from 'debug';
import {PluginHook, PluginHookFilterFunction} from './pluginsHook';

const debug = Debug('talk:plugins');

const tags = [
    'register_app',
    'post_register_routes',
    'pre_register_routes',
    'register_resolvers',
    'register_typedefs',
    'register_schema',
];

export class Plugins {
    private filters: {[name: string]: PluginHook};

    constructor() {
        this.filters = {};
    }

    public doFilter(tag: string, value: any, ...args): Promise<any> {
        if (!(tag in this.filters)) {
            return value;
        }

        return this.filters[tag].applyFilters(value, ...args);
    }

    public addFilter(tag: string, fct: PluginHookFilterFunction): void {
        if (tags.indexOf(tag) === -1) {
            throw new Error(`hook ${tag} is not a supported hook name`);
        }

        debug(`added filter to tag ${tag}`);

        if (!(tag in this.filters)) {
            this.filters[tag] = new PluginHook({tag});
        }

        this.filters[tag].addFilter(fct);
    }
}
