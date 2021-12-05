import { useEffect, useState } from "react";
import "./App.css";
import Room from "./Room";

import { Provider } from "react-redux";
import store from "./redux/store";

function App() {
    return (
        <Provider store={store}>
            <Room />
        </Provider>
    );
}

export default App;
