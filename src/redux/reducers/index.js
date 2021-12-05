import { combineReducers } from 'redux';

// Reducers
import producers from './producers';
import consumers from './consumers';

const allReducers = combineReducers({
  producers,
  consumers
});

export default allReducers;

