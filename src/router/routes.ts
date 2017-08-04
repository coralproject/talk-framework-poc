import {graphiqlExpress, graphqlExpress} from 'apollo-server-express';
import * as bodyParser from 'body-parser';
import {Router} from 'express';
import {createGraphOptions} from '../graph';
import {Server} from '../server';

export async function applyRoutes(server: Server, router: Router): Promise<void> {

    // Create the graph options that will be used to mount the graphql handler.
    const graphOptions = await createGraphOptions(server);

    // Bind the JSON bodyparser middleware to the router.
    router.use('/api/v1/graph/ql', bodyParser.json(), graphqlExpress(graphOptions));

    // Bind the JSON bodyparser middleware as well as the graphiql handler on
    // this request if the debugging mode is enabled.
    if (server.config.devel) {
        router.use('/api/v1/graph/iql', bodyParser.json(), graphiqlExpress({
            endpointURL: '/api/v1/graph/ql',
        }));
    }
}
