export const addProducer = (producer) => {
    console.log("INSIDE ACTION CREATOR", producer);
    return {
        type: "ADD_PRODUCER",
        payload: { producer },
    };
};

export const removeProducer = (producerId) => ({
    type: "REMOVE_PRODUCER",
    payload: { producerId },
});

export const pauseProducer = (producerId) => ({
  type: 'PAUSE_PRODUCER',
  payload: { producerId }
});

export const resumeProducer = (producerId) => ({
  type: 'RESUME_PRODUCER',
  payload: { producerId }
});
