import "./App.css";
import PrivateRoom from './PrivateRoom';

import { Provider } from "react-redux";
import store from "./redux/store";

function App() {
    return (
        <Provider store={store}>
            <PrivateRoom />
        </Provider>
    );
}

export default App;
