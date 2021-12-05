import React, { useEffect, useRef } from 'react'

import RoomClient from './RoomClient';

// Admin name
const roomName = window.location.pathname.split("/")[1];

const isProducing = window.location.search.includes("admin");
const isConsuming = !window.location.search.includes("admin");

const PublicRoom = () => {

  const roomClient = useRef();

  useEffect(() => {
      if (!roomClient.current) {

          roomClient.current = new RoomClient({
              roomName,
              userId: "12345",
              produce: isProducing,
              consume: isConsuming,
          });

          roomClient.current.join();
      }
      return () => {
          if (roomClient.current) {
              roomClient.current.close();
          }
      };
  });
  return (
    <div>
      
    </div>
  )
}

export default PublicRoom
