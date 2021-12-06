import React, { useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router";

import RoomClient from "./RoomClient";

// Components
import Admin from "./Admin";
import Peer from "./Peer";

// Redux
import store from "./redux/store";
import { emptyProducers, emptyConsumers } from './redux/actions/mediasoup';

const PrivateRoom = ({ roomClient }) => {

    const { room, privateId } = useParams();
    const { search } = useLocation();
    console.log('HERE ARE ROOM PARAMS', room, privateId, search);
    const isProducing = search.includes('admin');
    const isConsuming = !isProducing;

    useEffect(() => {
        console.log('INSIDE UE PRIVATE', roomClient.current);

        // For refresh case
        if (!roomClient.current) {
            roomClient.current = new RoomClient({
                publicRoom: room,
                userId: "12345"
            });
            roomClient.current.join(room, privateId, isProducing, isConsuming);
        }
        else {
            roomClient.current.join(room, privateId, isProducing, isConsuming);
        }
        // Might have to add cleanup
        return () => {
            // Need to also emit this on tab close
            roomClient.current.leavePrivateRoom();

            // Maybe check if existing first
            store.dispatch(emptyProducers());
            store.dispatch(emptyConsumers());
        };
    }, [room, privateId, roomClient]);

    
    // Doesn't seem to be working
    window.addEventListener('beforeunload', () => {
        roomClient.current.leavePrivateRoom();
    })

    const handleMute = () => {
        roomClient.current.muteMic();
    };

    const handleUnmute = () => {
        roomClient.current.unmuteMic();
    };

    const handleVideoDisable = () => {
        roomClient.current.disableVideo();
    };

    const handleVideoEnable = () => {
        roomClient.current.enableVideo();
    };

    return (
        // <p>Lol private</p>
        <Room
            roomClient={roomClient}
            isProducing={isProducing}
            handleMute={handleMute}
            handleUnmute={handleUnmute}
            handleVideoDisable={handleVideoDisable}
            handleVideoEnable={handleVideoEnable}
        />
    );
};

const Room = ({
    roomClient,
    isProducing,
    handleMute,
    handleUnmute,
    handleVideoDisable,
    handleVideoEnable,
}) => {
    return (
        <div>
            {isProducing ? (
                <Admin
                    roomClient={roomClient}
                    handleMute={handleMute}
                    handleUnmute={handleUnmute}
                    handleVideoDisable={handleVideoDisable}
                    handleVideoEnable={handleVideoEnable}
                />
            ) : <Peer roomClient={roomClient} />}
        </div>
    );
};

export default PrivateRoom;
