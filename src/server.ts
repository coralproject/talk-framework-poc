import * as express from 'express';
import {Plugins} from './plugins';
import {createRouter} from './router';

export type PluginFunction = (server: Server) => void;

export interface ServerConfiguration {
    port?: number;
    devel?: boolean;
}

export class Server {
    public app: express.Application;
    public plugins: Plugins;
    public config: ServerConfiguration;

    constructor(config: ServerConfiguration) {
        this.config = config;
        this.config.devel = this.config.devel || false;
        this.config.port = this.config.port || 3000;
        this.plugins = new Plugins();
        this.app = express();
    }

    public use(...plugins: PluginFunction[]): void {
        plugins.forEach((plugin: PluginFunction) => {

            // Hand the current server instance to the plugin so it may
            // configure it.
            plugin(this);
        });
    }

    public start(callback: () => void): void {

        // Pass in the reference to the app usage and registration.
        this.plugins.doFilter('register_app', this.app);

        // Attach the routes, passing in the server instance. This is
        // also where all the middleware is registerd.
        this.app.use(createRouter(this));

        // Listen on the designated port.
        this.app.listen(this.config.port, callback);
    }
}
