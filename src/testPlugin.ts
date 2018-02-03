import {decorateWithHooks} from './graph/hooks';
import {decorateResolvers} from './graph/resolvers';

export default (server) => {
  decorateResolvers(server, {
    Query: {
      date: () => 'new!',
    },
    Author: {
      firstName: () => 'wyatt',
    },
  });

  decorateWithHooks(server, {
    Post: {
      title: {
        async post(obj, args, ctx, info, title: string): Promise<string> {
          return `${title}!`;
        },
      },
    },
  });
};
