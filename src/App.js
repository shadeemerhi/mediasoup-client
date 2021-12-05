import { useEffect, useRef } from 'react';

import "./App.css";

// Components
import Home from "./Home";
import PublicRoom from "./PublicRoom";
import PrivateRoom from "./PrivateRoom";

// Router
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";

// Redux
import { Provider } from "react-redux";
import store from "./redux/store";

import RoomClient from "./RoomClient";

function App() {
    
    const roomClient = useRef();

    useEffect(() => {
        if (!roomClient.current) {
            roomClient.current = new RoomClient({
                userId: "12345",
            });
        }
        return () => {
            if (roomClient.current) {
                roomClient.current.close();
            }
        };
    });
    return (
        <Router>
            <Provider store={store}>
                <Routes>
                    <Route exact path="/:room" element={<PublicRoom roomClient={roomClient} />} />
                    <Route exact path="/:room/:privateId" element={<PrivateRoom roomClient={roomClient} />} />
                    <Route path="/" element={<Home />}/> 
                </Routes>
            </Provider>
        </Router>
    );
}

export default App;
