import {GraphQLOptions} from 'apollo-server-core';
import {ExpressGraphQLOptionsFunction} from 'apollo-server-express';
import {Server} from '../server';
import {ContextRequest, createContextFactory} from './context';
import {createSchema} from './schema';

export async function createGraphOptions(server: Server): Promise<ExpressGraphQLOptionsFunction> {
  const schema = await createSchema(server);
  const createContext = await createContextFactory(server);

  return (req: ContextRequest): GraphQLOptions => ({

    // Schema is created already, so just include it.
    schema,

    // Load in the new context here, this'll create the loaders + mutators for
    // the lifespan of this request.
    context: createContext(req),
  });
}
