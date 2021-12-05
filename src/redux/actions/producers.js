export const addProducer = (producer) => {

  console.log('INSIDE ACTION CREATOR', producer);
  return {
    type: 'ADD_PRODUCER',
    payload: { producer }
  }
};

export const removeProducer = (producerId) => {
  console.log('INSIDE ACTION', producerId);
  return {
    type: 'REMOVE_PRODUCER',
    payload: { producerId }
  }
}