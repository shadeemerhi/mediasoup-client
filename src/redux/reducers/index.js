import { combineReducers } from 'redux';

// Reducers
import producers from './producers';

const allReducers = combineReducers({
  producers
});

export default allReducers;

