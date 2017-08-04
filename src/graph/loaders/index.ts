import * as DataLoader from 'dataloader';
import {merge} from 'lodash';
import {Server} from '../../server';
import {Context} from '../context';

// Import the core loaders.
import Authors from './authors';
import Posts from './posts';

// LoaderFunction is the base loader function type which provides a value given
// the request context and any additional args.
export type LoaderFunction = (...args: any[]) => any;

// Loader is a function that will resolve out the required value.
export type Loader = LoaderFunction | DataLoader<any, any>;

// ILoader is an object which contains the name of the loader as the key and the
// actual loader as the value.
export interface ILoader {
  [loader: string]: Loader;
}

// ILoaderNamespace represents a namespace of loaders keyed by the namespace
// name with the ILoader as the value.
export interface ILoaderNamespace {
  [namespace: string]: ILoader;
}

// LoaderFactory takes a context and returns an ILoaderNamespace.
export type LoaderFactory = (ctx: Context) => ILoaderNamespace;

// coreLoaders are the core loaders assembled into a single array. These are merged
// with those provided by the plugins.
const coreLoaders: LoaderFactory[] = [
  Authors,
  Posts,
];

// decorateLoaders provides a higher ordered interface to adding new loaders
// to the application.
export function decorateLoaders(server: Server, pluginLoaderFactory: LoaderFactory): void {
  server.plugins.addFilter('register_loaders', async (loaders: LoaderFactory[]): Promise<LoaderFactory[]> => {

    // Push into the loaders already present.
    loaders.push(pluginLoaderFactory);

    // Return those loaders.
    return loaders;
  });
}

// createLoadersFactory will create a LoaderFactory that can be used to create a
// ILoaderNamespace per request on the graph.
export async function createLoadersFactory(server: Server): Promise<LoaderFactory> {
  const loaders: LoaderFactory[] = await server.plugins.doFilter('register_loaders', coreLoaders);

  // We need to return an object to be accessed.
  return (ctx: Context): ILoaderNamespace => merge(...loaders.map((loader: LoaderFactory): ILoaderNamespace => {

    // Each loader is a function which takes the context.
    return loader(ctx);
  }));
}
