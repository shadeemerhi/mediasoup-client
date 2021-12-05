const initialState = {};

const consumers = (state = initialState, action) => {
    switch (action.type) {
        case "ADD_CONSUMER": {
            const { consumer } = action.payload;
            console.log("INSIDE REDUCER", consumer, consumer._id);

            return {
                ...state,
                [consumer._id]: consumer,
            };
        }
        case "REMOVE_CONSUMER": {
            const { consumerId } = action.payload;
            console.log("REMOVE CONSUMER", consumerId);

            const newState = { ...state };
            delete newState[consumerId];

            return newState;
        }
        // case "PAUSE_PRODUCER": {
        //     const { producerId } = action.payload;
        //     console.log("PAUSE PRODUCER", producerId);

        //     const producer = state[producerId];
        //     const newProducer = { ...producer, _paused: true };
        //     return {
        //         ...state,
        //         [producerId]: newProducer,
        //     };
        // }

        // case "RESUME_PRODUCER": {
        //     const { producerId } = action.payload;
        //     console.log("RESUME PRODUCER", producerId);
        //     const producer = state[producerId];
        //     const newProducer = { ...producer, _paused: false };
        //     return {
        //         ...state,
        //         [producerId]: newProducer,
        //     };
        // }
        default:
            return state;
    }
};

export default consumers;
