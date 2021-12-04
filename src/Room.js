import React, { useEffect, useRef } from "react";
import { useState } from "react";

import RoomClient from "./RoomClient";

const mediasoupClient = require("mediasoup-client");

const roomName = window.location.pathname.split("/")[1];
console.log("HERE IS THE ROOMNAME", roomName);

const isProducing = window.location.search.includes("admin");
const isConsuming = !window.location.search.includes("admin");

const RoomWrapper = () => {
    const localVideo = useRef();
    const remoteVideo = useRef();
    const audioElem = useRef();

    const roomClient = useRef();

    useEffect(() => {
        if (!roomClient.current) {
            roomClient.current = new RoomClient({
                roomName,
                userId: "12345",
                produce: isProducing,
                consume: isConsuming,
                localVideo: localVideo,
                remoteVideo: remoteVideo,
                audioElem,
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
            roomClient={roomClient.current}
            localVideo={localVideo}
            remoteVideo={remoteVideo}
            audioElem={audioElem}
            handleMute={handleMute}
            handleUnmute={handleUnmute}
            handleVideoDisable={handleVideoDisable}
            handleVideoEnable={handleVideoEnable}
        />
    );
};

const Room = ({
    roomClient,
    localVideo,
    remoteVideo,
    audioElem,
    handleMute,
    handleUnmute,
    handleVideoDisable,
    handleVideoEnable,
}) => {
    return (
        <div>
            {isProducing && (
                <div>
                    <video
                        playsInline
                        muted
                        autoPlay
                        controls
                        ref={localVideo}
                        width={400}
                    />
                    <button onClick={handleMute}>Mute</button>
                    <button onClick={handleUnmute}>Unmute</button>
                    <button onClick={handleVideoDisable}>Disable Video</button>
                    <button onClick={handleVideoEnable}>Enable Video</button>
                </div>
            )}
            {!isProducing && (
                <video
                    playsInline
                    controls
                    muted
                    autoPlay
                    ref={remoteVideo}
                    width={400}
                />
            )}
            <audio autoPlay playsInline muted controls ref={audioElem} />
        </div>
    );
};

export default RoomWrapper;
