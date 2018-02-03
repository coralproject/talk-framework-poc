import * as DataLoader from 'dataloader';
import {parse} from 'url';
import * as errors from '../../errors';
import Context from '../context';
// const scraper = require('../../services/scraper');
import {arrayJoinBy, singleJoinBy, SingletonResolver} from './util';
// const AssetModel = require('../../models/asset');
// const AssetsService = require('../../services/assets');

/**
 * Retrieves assets by an array of ids.
 * @param {Object} context the context of the request
 * @param {Array}  ids     array of ids to lookup
 */
const genAssetsByID = (ctx: Context, ids) => AssetModel.find({
  id: {
    $in: ids,
  },
}).then(singleJoinBy(ids, 'id'));

/**
 * [getAssetsByQuery description]
 * @param  {Object} context  the context of the request
 * @param  {Object} query    the query
 * @return {Promise}         resolves the assets
 */
const getAssetsByQuery = (ctx: Context, query) => {
  return AssetsService.search(query);
};

/**
 * This endpoint find or creates an asset at the given url when it is loaded.
 * @param   {Object} context   the context of the request
 * @param   {String} assetURL the url passed in from the query
 * @returns {Promise}          resolves to the asset
 */
const findOrCreateAssetByURL = async (ctx: Context, assetURL) => {

  // Verify that the assetURL is parsable.
  const parsedAssetURL = parse(assetURL);
  if (!parsedAssetURL.protocol) {
    throw errors.ErrInvalidAssetURL;
  }

  const asset = await AssetsService.findOrCreateByUrl(assetURL);

  // If the asset wasn't scraped before, scrape it! Otherwise just return
  // the asset.
  if (!asset.scraped) {
    await scraper.create(asset);
  }

  return asset;
};

const getAssetsForMetrics = async (ctx: Context) => {
  const actions = await ctx.loaders.Actions.getByTypes({action_type: 'FLAG', item_type: 'COMMENT'});

  const ids = actions.map(({item_id}) => item_id);

  const connection = await ctx.loaders.Comments.getByQuery({ids});

  return connection.nodes;
};

const findByUrl = async (ctx: Context, assetURL) => {

  // Verify that the assetURL is parsable.
  const parsedAssetURL = parse(assetURL);
  if (!parsedAssetURL.protocol) {
    throw errors.ErrInvalidAssetURL;
  }

  return AssetsService.findByUrl(assetURL);
};

/**
 * Creates a set of loaders based on a GraphQL context.
 * @param  {Object} context the context of the GraphQL request
 * @return {Object}         object of loaders
 */

module.exports = (ctx: Context) => ({
  Assets: {

    // TODO: decide whether we want to move these to mutators or not, as in fact
    // this operation create a new asset if one isn't found.
    getByURL: (url) => findOrCreateAssetByURL(ctx, url),

    findByUrl: (url) => findByUrl(ctx, url),
    search: (query) => getAssetsByQuery(ctx, query),
    getByID: new DataLoader((ids) => genAssetsByID(ctx, ids)),
    getForMetrics: () => getAssetsForMetrics(ctx),
    getAll: new SingletonResolver(() => AssetModel.find({})),
  },
});
