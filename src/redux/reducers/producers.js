const initialState = {};

const producers = (state = initialState, action) => {
    switch (action.type) {
        case "ADD_PRODUCER": {
            const { producer } = action.payload;
            console.log('INSIDE REDUCER', producer, producer._id);

            return {
                ...state,
                [producer._id]: producer,
            };
        }
        case "REMOVE_PRODUCER": {
            const { producerId } = action.payload;
            console.log('REMOVE PRODUCER', producerId);

            const newState = { ...state };
            delete newState[producerId];

            return newState;
        }
        default:
            return state;
    }
};

export default producers;
