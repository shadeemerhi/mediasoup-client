import { useContext } from "react";
import "./App.css";
import Room from "./Room";
import SocketProvider from "./SocketProvider";

function App() {
  return (
    <SocketProvider>
      <Room />
    </SocketProvider>
  )
}

export default App;
