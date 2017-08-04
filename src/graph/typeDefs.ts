import {Server} from '../server';

// Load the typeDefs from the filesystem.
export const typeDefs = `
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post] # the list of Posts by this author
}
type Post {
  id: Int!
  title: String
  author: Author
  votes: Int
}
# the schema allows the following query:
type Query {
  date: String!
  posts: [Post]
  author(id: Int!): Author
}
# this schema allows the following mutation:
type Mutation {
  upvotePost (
    postId: Int!
  ): Post
}
`;

export async function createTypeDefs(server: Server): Promise<string> {
  return server.plugins.doFilter('register_typedefs', typeDefs);
}
