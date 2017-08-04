import {find} from 'lodash';
import {Context} from '../context';

const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 },
];

export default (ctx: Context) => ({
  Posts: {
    list: () => posts,
    get: (id: number) => find(posts, {id}),
    getByAuthor: (authorId: number) => find(posts, {authorId}),
  },
});
