import * as DataLoader from 'dataloader';
import {find} from 'lodash';
import Context from '../context';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
];

export default (ctx: Context) => ({
  Authors: {
    get: new DataLoader(async (ids: number[]) => authors.filter(({id}) => ids.includes(id))),
  },
});
