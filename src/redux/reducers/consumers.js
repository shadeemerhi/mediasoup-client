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
        case "PAUSE_CONSUMER": {
            const { consumerId } = action.payload;
            console.log("PAUSE CONSUMER", consumerId);

            const consumer = state[consumerId];
            const newConsumer = { ...consumer, _paused: true };
            return {
                ...state,
                [consumerId]: newConsumer,
            };
        }

        case "RESUME_CONSUMER": {
            const { consumerId } = action.payload;
            console.log("RESUME CONSUMER", consumerId);

            const consumer = state[consumerId];
            const newConsumer = { ...consumer, _paused: false };

            return {
                ...state,
                [consumerId]: newConsumer,
            };
        }
        default:
            return state;
    }
};

export default consumers;
