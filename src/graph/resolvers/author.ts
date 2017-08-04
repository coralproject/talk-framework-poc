export default {
  posts: (author, args, {loaders: {Posts}}) => Posts.getByAuthor(author.id),
};
