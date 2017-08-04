import {IResolvers} from 'graphql-tools/dist/Interfaces';
import {filter, find, merge} from 'lodash';
import {Server} from '../../server';

import Author from './author';
import Mutation from './mutation';
import Post from './post';
import Query from './query';

// coreResolvers are provided by core Talk.
const coreResolvers = {
  Author,
  Mutation,
  Post,
  Query,
};

// decorateResolvers provides a higher ordered interface to adding new resolvers
// to the application.
export function decorateResolvers(server: Server, pluginResolvers: IResolvers): void {
  server.plugins.addFilter('register_resolvers', async (resolvers: IResolvers): Promise<IResolvers> => {
    return merge(resolvers, pluginResolvers);
  });
}

// createResolvers generates the resolvers for the graph after merging with the
// coreResolvers and plugin resolvers.
export async function createResolvers(server: Server): Promise<IResolvers> {
  return server.plugins.doFilter('register_resolvers', coreResolvers);
}
