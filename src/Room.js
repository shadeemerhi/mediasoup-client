import React, { useEffect, useRef } from "react";
import { useState } from "react";

import RoomClient from "./RoomClient";
import { useSelector } from "react-redux";

// MUI
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { width } from "@mui/system";

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

    const producers = useSelector(state => state.producers);

    const producersArray = Object.values(producers);
    const videoProducer = producersArray.find(producer => producer?._track?.kind === 'video');
    const audioProducer = producersArray.find(producer => producer?._track?.kind === 'audio');

    const videoTrack = videoProducer?._track;
    const audioTrack = audioProducer?._track;

    const me = useRef();

    useEffect(() => {
        if (videoTrack) {
            console.log('LOL FUCK', videoTrack);
            const stream = new MediaStream;
            stream.addTrack(videoTrack);
            me.current.srcObject = stream;
        }
        else {
            console.log('ELSE ELSE ELSE');
            me.current.srcObject = null;
        }
    }, [videoTrack]);

    console.log('HERE ARE BOTH THINGS', videoTrack, audioTrack);
    return (
        <div>
            {isProducing && (
                <div>
                    {/* <video
                        playsInline
                        muted
                        autoPlay
                        controls
                        ref={localVideo}
                        width={400}
                    /> */}
                    <div style={{ position: 'relative', width: '100vw', height: '300px', border: '1px solid red' }}>
                        
                        <video
                            playsInline
                            muted
                            autoPlay
                            // controls
                            ref={me}
                            // width={300}
                            style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 0,
                                minWidth: '100%',
                                minHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                backgroundSize: 'cover',
                                overflow: 'hidden'
                            }}
                        />
                    </div>
                    {videoTrack ? <VideocamIcon /> : <VideocamOffIcon />}
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
