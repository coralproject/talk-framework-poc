import {find} from 'lodash';
import {Context} from '../context';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
];

export default (ctx: Context) => ({
  Authors: {
    get: (id: number) => find(authors, {id}),
  },
});
