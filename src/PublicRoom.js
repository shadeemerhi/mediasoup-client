import React, { useEffect } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import RoomClient from "./RoomClient";

const PublicRoom = ({ roomClient }) => {
    const { room } = useParams();

    useEffect(() => {
        if (roomClient.current) {
          console.log('JOINING ROOM', room);
          if (!roomClient.current._socket) {
            roomClient.current.joinPublicRoom(room);
          }
        }

        // Might have to add cleanup (state and mediasoup)
        return () => {
        }
    });
    return (
        <div>
            <h1>WELCOME TO THE PUBLIC ROOM</h1>
            <Link to={`/${room}/9795848`}>Private Room</Link>
            <Link to={`/${room}/9795848?admin`}>Create Private Room</Link>
        </div>
    );
};

export default PublicRoom;
