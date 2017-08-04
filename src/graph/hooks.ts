import * as Debug from 'debug';
import {
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import * as Joi from 'joi';
import {Server} from '../server';

const debug = Debug('talk:graph:schema');

/**
 * XXX taken from graphql-js: src/execution/execute.js, because that function
 * is not exported
 *
 * If a resolve function is not given, then a default resolve behavior is used
 * which takes the property of the source object of the same name as the field
 * and returns it as the result, or if it's a function, returns the result
 * of calling that function.
 */
const defaultResolveFn = (source, args, context, {fieldName}) => {

  // ensure source is a value for which property access is acceptable.
  if (typeof source === 'object' || typeof source === 'function') {
    const property = source[fieldName];
    if (typeof property === 'function') {
      return source[fieldName](args, context);
    }
    return property;
  }
};

// IFieldIteratorFn is used to represent a field itterator that will handle
// applying post/pre hooks to the schema.
export type IFieldIteratorFn = (
  field: GraphQLField<any, any> | GraphQLObjectType | GraphQLInterfaceType,
  typeName: string,
  fieldName: string,
) => void;

export function isGraphQLField(field: GraphQLField<any, any> | GraphQLObjectType | GraphQLInterfaceType): field is GraphQLField<any, any> {
  return !('resolveType' in field);
}

// This function is pretty much copied verbatim from the graphql-tools repo:
// https://github.com/apollographql/graphql-tools/blob/b12973c86e00be209d04af0184780998056051c4/src/schemaGenerator.ts#L180-L194
// With the small alteration that we look for the `resolveType` function on the
// schema so we can wrap post hooks around it to provide additional resolve
// points.
const forEachField = (schema: GraphQLSchema, fn: IFieldIteratorFn) => {
  const typeMap = schema.getTypeMap();
  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];

    if (type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType) {

      // Here we capture the change to extract the resolve type. We pass this
      // with the `isResolveType = true` to introduce the specific beheviour.
      if ('resolveType' in type) {
        fn(type, typeName, '__resolveType');
      }

      const fields = type.getFields();
      Object.keys(fields).forEach((fieldName) => {
        const field = fields[fieldName];
        fn(field, typeName, fieldName);
      });
    }
  });
};

/**
 * Decorates the field with the post resolvers (if available) and attaches a
 * default type in the form of `Default${typeName}`.
 */
const decorateResolveFunction = (field, typeName, fieldName, post) => {

  // Cache the original resolverType function.
  const originalResolveType = field.resolveType;

  // defaultResolveType is the default type that is resolved on a resolver
  // when the interface being looked up is not defined.
  const defaultResolveType = `Default${typeName}`;

  // Return the function to handle the resolveType hooks.
  const defaultResolveTypeFn = (obj, context, info) => {
    const type = originalResolveType(obj, context, info);

    // Only if a previous resolver was unable to resolve the field type do we
    // progress to the hooks (in order!) to resolve the field name until we
    // have resolved it.
    if (typeof type !== 'undefined' && type != null) {
      return type;
    }

    // All else fails, resort to the defaultResolveType.
    return defaultResolveType;
  };

  // This only needs to do something if post hooks are defined.
  if (post.length === 0) {

    // Set the default on the resolveType function.
    field.resolveType = defaultResolveTypeFn;

    return;
  }

  // Ensure it matches the format we expect.
  Joi.assert(post, Joi.array().items(Joi.func().maxArity(3)), `invalid post hooks were found for ${typeName}.${fieldName}`);

  // Return the function to handle the resolveType hooks.
  field.resolveType = (obj, context, info) => {
    const type = defaultResolveTypeFn(obj, context, info);

    // Only if a previous resolver was unable to resolve the field type do we
    // progress to the hooks (in order!) to resolve the field name until we
    // have resolved it.
    if (typeof type !== 'undefined' && type != null && type !== defaultResolveType) {
      return type;
    }

    // We will walk through the post hooks until we find the right one. This
    // follows what redux does to combine existing reducers.
    for (const resolveType of post) {
      const resolvedType = resolveType(obj, context, info);
      if (typeof resolvedType !== 'undefined' && resolvedType != null) {
        return resolvedType;
      }
    }

    return type;
  };
};

export type PreHookFunction = (obj?: any, args?: any, ctx?: any, info?: any) => Promise<any>;
export type PostHookFunction = (obj?: any, args?: any, ctx?: any, info?: any, result?: any) => Promise<any>;

// IHooks are the hooks provided by a plugin hook that will attach to a schema.
export interface IHooks {
  [type: string]: {
    [field: string]: {
      pre?: PreHookFunction;
      post?: PostHookFunction;
    };
  };
}

// isPreHookFunction is a type guard protecting pre hooks.
export function isPreHookFunction(arg: PreHookFunction): arg is PreHookFunction {
  return typeof arg === 'function';
}

// isPostHookFunction is a type guard protecting post hooks.
export function isPostHookFunction(arg: PostHookFunction): arg is PostHookFunction {
  return typeof arg === 'function';
}

/**
 * Decorates the schema with pre and post hooks as provided by the Plugin
 * Manager.
 * @param  {GraphQLSchema} schema the schema to decorate
 * @param  {Array}         pluginHooks  hooks to apply to the schema
 * @return {void}
 */
export const decorateWithHooks = (server: Server, pluginHooks: IHooks) => {
  server.plugins.addFilter('register_schema', async (schema: GraphQLSchema): Promise<GraphQLSchema> => {

    // Loop over the schema fields and apply the hooks to them.
    forEachField(schema, (field, typeName: string, fieldName: string) => {

      // Check to see if the field is in the provided hooks.
      if (!(typeName in pluginHooks && fieldName in pluginHooks[typeName])) {

        // It wasn't! Stop processing this field.
        return;
      }

      // Collect the hooks from this plugin.
      const hooks = pluginHooks[typeName][fieldName];

      // If this is a PreHookFunction, then add it to the available hooks.
      let pre: PreHookFunction = null;
      if (isPreHookFunction(hooks.pre)) {
        debug(`adding pre hook to resolver ${typeName}.${fieldName}'`);

        Joi.assert(hooks.pre, Joi.func().maxArity(4));
        pre = hooks.pre;
      }

      // If this is a PostHookFunction, then add it to the available hooks.
      let post: PostHookFunction = null;
      if (isPostHookFunction(hooks.post)) {
        debug(`adding post hook to resolver ${typeName}.${fieldName}'`);

        Joi.assert(hooks.pre, Joi.func().maxArity(5));
        post = hooks.post;
      }

      // If we have no hooks to add here, don't try to modify anything.
      if (pre === null && post === null) {
        return;
      }

      // If this is a resolve type, we need to do some specific things to handle
      // this type of field.
      if (!isGraphQLField(field)) {

        // Warn if we have any pre hooks.
        if (pre !== null) {
          throw new Error(
            `invalid pre hooks were found for ${typeName}.${fieldName}, only post hooks are supported on the __resolveType hook`,
          );
        }

        // Decorate the resolve function on the field with the new resolveType func.
        decorateResolveFunction(field, typeName, fieldName, post);
        return;
      }

       // Cache the original resolve function, this emulates the beheviour found in
      // graphql-tools:
      // https://github.com/apollographql/graphql-tools/blob/6e9cc124b10d673448386041e6c3d058bc205a02/src/schemaGenerator.ts#L423-L425
      let baseResolver = field.resolve;
      if (typeof baseResolver === 'undefined') {
        baseResolver = defaultResolveFn;
      }

      // Apply our async resolve function which will fire all pre functions (and
      // wait until they resolve) followed by waiting for the response and then
      // firing their post hooks. Lastly, we respond with the result of the
      // original resolver.
      field.resolve = async (obj, args, ctx, info) => {

        // Apply our pre hook.
        if (pre !== null) {
          await pre(obj, args, ctx, info);
        }

        // Resolve the field using the base resolver.
        let result = await baseResolver(obj, args, ctx, info);

        // Apply our post hook.
        if (post !== null) {

          // Check to see if this post function accepts a result, if it does, we
          // expect that it modifies the result, otherwise, just fire the post hook,
          // wait till it's done, then move onto the next hook.
          if (post.length === 5) {
            result = await post(obj, args, ctx, info, result);
          } else {
            await post(obj, args, ctx, info);
          }
        }

        // Return the resolved value.
        return result;
      };
    });

    return schema;
  });
};
