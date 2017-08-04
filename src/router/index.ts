import {Router} from 'express';
import {Server} from '../server';
import {applyRoutes} from './routes';

export function createRouter(server: Server): Router {

    // Create our base router. All the application routes will
    // be attached to this.
    const router = Router();

    server.plugins.doFilter('pre_register_routes', router);

    // Attach the application routes to the router.
    applyRoutes(server, router);

    // Register all the plugin routes.
    server.plugins.doFilter('post_register_routes', router);

    // Return the fully formed router.
    return router;
}
