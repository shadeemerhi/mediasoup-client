import React, { useContext, useEffect, useState } from 'react';

import io from 'socket.io-client';

export const SocketContext = React.createContext();

const SocketProvider = ({ id, children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // const newSocket = io('http://localhost:4000/mediasoup');
    // setSocket(newSocket);

    // return () => {
    //   newSocket.disconnect();
    //   newSocket.off();
    // }
  }, []);

  const value = {
    socket,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )

}

export default SocketProvider;