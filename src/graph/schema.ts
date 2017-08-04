import {GraphQLSchema} from 'graphql';
import {makeExecutableSchema } from 'graphql-tools';
import {Server} from '../server';
import {createResolvers} from './resolvers';
import {createTypeDefs} from './typeDefs';

export async function createSchema(server: Server): Promise<GraphQLSchema> {

  // Decorate the resolvers and the typeDefs with the plugin hooks.
  const resolvers = await createResolvers(server);
  const typeDefs = await createTypeDefs(server);

  // Create our schema object with the plugin filter.
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return server.plugins.doFilter('register_schema', schema);
}
