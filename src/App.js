import { useEffect, useState } from "react";
import "./App.css";
import Room from "./Room";

import { Provider } from "react-redux";
import store from "./redux/store";

function App() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(true);
    }, []);
    return <Provider store={store}>{ready ? <Room /> : <></>}</Provider>;
}

export default App;
