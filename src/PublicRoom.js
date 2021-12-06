import React, { useEffect } from "react";
import { useParams, useLocation } from "react-router";
import { Link } from "react-router-dom";

import RoomClient from "./RoomClient";

const PublicRoom = ({ roomClient }) => {
    const { room } = useParams();
    const { search } = useLocation();
    const isAdmin = search.includes('admin');

    useEffect(() => {
        if (roomClient.current) {
            console.log("JOINING ROOM", room);
            if (!roomClient.current._socket) {
                roomClient.current._initializePublicRoom(room);
            }
            else {
              /**
               * Socket connection was previously established
               * Go directly to socket room join
               */
              roomClient.current.joinPublicRoom();
            }
        }

        // Might have to add cleanup (state and mediasoup)
        return () => {
          // Admin to stay in public room even when navigating away (i.e. be in both rooms)
          if (roomClient.current && !isAdmin) {
            roomClient.current.leavePublicRoom();
          }
        };
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
