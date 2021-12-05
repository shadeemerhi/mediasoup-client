import React, { useEffect, useRef } from "react";

import RoomClient from "./RoomClient";

import Admin from "./Admin";
import Peer from "./Peer";

const roomName = window.location.pathname.split("/")[1];

const isProducing = window.location.search.includes("admin");
const isConsuming = !window.location.search.includes("admin");

const PrivateRoom = () => {

    const roomClient = useRef();

    useEffect(() => {}, []);

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
        <Room
            roomClient={roomClient}
            handleMute={handleMute}
            handleUnmute={handleUnmute}
            handleVideoDisable={handleVideoDisable}
            handleVideoEnable={handleVideoEnable}
        />
    );
};

const Room = ({
    roomClient,
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
