export default {
  posts: (obj, args, {loaders: {Posts}}) => Posts.list(),
  author: (_, { id }, {loaders: {Authors}}) => Authors.get(id),
  date: () => (new Date()).toISOString(),
};
