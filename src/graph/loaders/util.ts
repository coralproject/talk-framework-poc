import * as DataLoader from 'dataloader';
import {groupBy} from 'lodash';

/**
 * SingletonResolver is a cached loader for a single result.
 */
export class SingletonResolver {
  private _cache: any;
  private _resolver: (...args: any[]) => Promise<any>;

  constructor(resolver) {
    this._cache = null;
    this._resolver = resolver;
  }

  public load() {
    if (this._cache) {
      return this._cache;
    }

    const promise = this._resolver(arguments).then((result) => {
      return result;
    });

    // Set the promise on the cache.
    this._cache = promise;

    return promise;
  }
}

/**
 * This joins a set of results with a specific keys and sets an empty array in
 * place if it was not found.
 * @param  {Array}  ids ids to locate
 * @param  {String} key key to group by
 * @return {Array}      array of results
 */
export const arrayJoinBy = (ids, key) => (items) => {
  const itemsByKey = groupBy(items, key);

  return ids.map((id) => {
    if (id in itemsByKey) {
      return itemsByKey[id];
    }

    return [];
  });
};

/**
 * This joins a set of results with a specific keys and sets null in place if it
 * was not found.
 * @param  {Array}  ids ids to locate
 * @param  {String} key key to group by
 * @return {Array}      array of results
 */
export const singleJoinBy = (ids, key) => (items) => {
  const itemsByKey = groupBy(items, key);
  return ids.map((id) => {
    if (id in itemsByKey) {
      return itemsByKey[id][0];
    }

    return null;
  });
};

/**
 * SharedCacheDataLoader provides a version of the DataLoader that wraps up a
 * redis backed cache with the dataloader's request cache.
 */
export class SharedCacheDataLoader<T, V> extends DataLoader<T, V> {
  protected _prefix: string;
  protected _expiry: number;
  protected _keyFunc: (prefix: string) => string;

  /**
   * wraps up the prefix needed for the redis backed shared cache driver
   */
  public static keyFunc(prefix) {
    return (key) => `cache.sbl[${prefix}][${key}]`;
  }

  /**
   * wraps the dataloader batchLoadFn with the shared cache's wrapper
   */
  public static batchLoadFn(prefix, expiry, batchLoadFn) {
    return (ids) => cache.wrapMany(ids, expiry, (workKeys) => {
      return batchLoadFn(workKeys);
    }, SharedCacheDataLoader.keyFunc(prefix));
  }


  constructor(prefix, expiry, batchLoadFn, options) {
    super(SharedCacheDataLoader.batchLoadFn(prefix, expiry, batchLoadFn), options);

    this._prefix = prefix;
    this._expiry = expiry;
    this._keyFunc = SharedCacheDataLoader.keyFunc(this._prefix);
  }

  /**
   * clear the key from the shared cache and the request cache
   */
  public clear(key) {
    return cache
      .invalidate(key, this._keyFunc)
      .then(() => super.clear(key));
  }

  /**
   * prime the shared cache and the request cache
   */
  public prime(key, value) {
    return cache
      .set(key, value, this._expiry, this._keyFunc)
      .then(() => super.prime(key, value));
  }

  /**
   * prime many values in the shared cache and the request cache
   */
  public primeMany(keys, values) {
    return cache
      .setMany(keys, values, this._expiry, this._keyFunc)
      .then(() => keys.map((key, i) => super.prime(key, values[i])));
  }
}

/**
 * SharedCounterDataLoader is identical to SharedCacheDataLoader with the
 * exception in that it is designed to work with numerical cached data.
 */
export class SharedCounterDataLoader<T, V> extends SharedCacheDataLoader<T, V> {

  /**
   * Increments the key in the cache if it already exists in the cache, if not
   * it does nothing.
   */
  public incr(key) {
    return cache.incr(key, this._expiry, this._keyFunc);
  }

  /**
   * Decrements the key in the cache if it already exists in the cache, if not
   * it does nothing.
   */
  public decr(key) {
    return cache.decr(key, this._expiry, this._keyFunc);
  }
}

/**
 * Maps an object's paths to a string that can be used as a cache key.
 * @param  {Array} paths paths on the object to be used to generate the cache
 *                       key
 */
export const objectCacheKeyFn = (...paths) => (obj) => {
  return paths.map((path) => obj[path]).join(':');
};

/**
 * Maps an object's paths to a string that can be used as a cache key.
 * @param  {Array} paths paths on the object to be used to generate the cache
 *                       key
 */
export const arrayCacheKeyFn = (arr) => {
  return arr.sort().join(':');
};
