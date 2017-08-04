import * as express from 'express';
import {Server} from '../server';
import {createLoadersFactory, ILoaderNamespace, LoaderFactory} from './loaders';
import {createMutatorsFactory, IMutatorNamespace, MutatorFactory} from './mutators';

// ContextOptions are provided by the server when initializing.
export interface ContextOptions {

  // createLoaders is a LoaderFactory that will create loaders
  // per request for every type of loader.
  createLoaders: LoaderFactory;

  createMutators: MutatorFactory;
}

// ContextRequest is the express request that has been
// saturated with the current logged in user.
export interface ContextRequest extends express.Request {
  user?: any; // if no user is logged in, the user will be null.
}

// Context provides request contextual interfaces for the resolvers to utilize
// when resolving fields in the graph.
export class Context {
  public user: any;
  public loaders: ILoaderNamespace;
  public mutators: IMutatorNamespace;

  constructor(req: ContextRequest, options: ContextOptions) {
    if (req.user) {
      this.user = req.user;
    }

    this.loaders = options.createLoaders(this);
    this.mutators = options.createMutators(this);
  }
}

// ContextFactory will return a new context per request.
export type ContextFactory = (req: ContextRequest) => Context;

// createContextFactory will create a creator function which can generate new
// Context objects from the provided plugins.
export async function createContextFactory(server: Server): Promise<ContextFactory> {
  const createLoaders: LoaderFactory = await createLoadersFactory(server);
  const createMutators: MutatorFactory = await createMutatorsFactory(server);

  return (req: ContextRequest): Context => new Context(req, {
    createLoaders,
    createMutators,
  });
}
