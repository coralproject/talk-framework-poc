export default {
  upvotePost: (_, { postId }, {loaders: {Posts}}) => {
    const post = Posts.get(postId);
    if (!post) {
      throw new Error(`Couldn't find post with id ${postId}`);
    }
    post.votes += 1;
    return post;
  },
};
