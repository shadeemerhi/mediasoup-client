// Producers
export const addProducer = (producer) => {
    console.log("INSIDE ACTION CREATORE");
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
    type: "PAUSE_PRODUCER",
    payload: { producerId },
});

export const resumeProducer = (producerId) => ({
    type: "RESUME_PRODUCER",
    payload: { producerId },
});

// Consumers
export const addConsumer = (consumer) => ({
    type: "ADD_CONSUMER",
    payload: { consumer },
});

export const removeConsumer = (consumerId) => ({
    type: "REMOVE_CONSUMER",
    payload: { consumerId },
});

export const pauseConsumer = (consumerId) => ({
  type: 'PAUSE_CONSUMER',
  payload: { consumerId }
});

export const resumeConsumer = (consumerId) => ({
  type: 'RESUME_CONSUMER',
  payload: { consumerId }
})