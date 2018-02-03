import * as DataLoader from 'dataloader';
import {merge} from 'lodash';
import {Server} from '../../server';
import Context from '../context';

// Import the core mutators.
// TODO: import them!

// MutatorFunction is the base mutator function type which provides a value given
// the request context and any additional args.
export type MutatorFunction = (...args: any[]) => any;

// Mutator is a function that will resolve out the required value.
export type Mutator = MutatorFunction | DataLoader<any, any>;

// IMutator is an object which contains the name of the mutator as the key and the
// actual mutator as the value.
export interface IMutator {
  [mutator: string]: Mutator;
}

// IMutatorNamespace represents a namespace of mutators keyed by the namespace
// name with the IMutator as the value.
export interface IMutatorNamespace {
  [namespace: string]: IMutator;
}

// MutatorFactory takes a context and returns an IMutatorNamespace.
export type MutatorFactory = (ctx: Context) => IMutatorNamespace;

// coreMutators are the core mutators assembled into a single array. These are merged
// with those provided by the plugins.
const coreMutators: MutatorFactory[] = [

];

// decorateMutators provides a higher ordered interface to adding new mutators
// to the application.
export function decorateMutators(server: Server, pluginMutatorFactory: MutatorFactory): void {
  server.plugins.addFilter('register_mutators', async (mutators: MutatorFactory[]): Promise<MutatorFactory[]> => {

    // Push into the mutators already present.
    mutators.push(pluginMutatorFactory);

    // Return those mutators.
    return mutators;
  });
}

// createMutatorsFactory will create a MutatorFactory that can be used to create a
// IMutatorNamespace per request on the graph.
export async function createMutatorsFactory(server: Server): Promise<MutatorFactory> {
  const mutators: MutatorFactory[] = await server.plugins.doFilter('register_mutators', coreMutators);

  // We need to return an object to be accessed.
  return (ctx: Context): IMutatorNamespace => merge(...mutators.map((mutator: MutatorFactory): IMutatorNamespace => {

    // Each mutator is a function which takes the context.
    return mutator(ctx);
  }));
}
