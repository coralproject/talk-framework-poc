export default {
  author: (post, args, {loaders: {Authors}}) => Authors.get(post.authorId),
};
