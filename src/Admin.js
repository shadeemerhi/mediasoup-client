import React from "react";

import { useSelector } from "react-redux";

import VideoView from "./VideoView";

const Admin = (props) => {
    const { handleMute, handleUnmute, handleVideoDisable, handleVideoEnable } =
        props;
    const producers = useSelector((state) => state.producers);

    const producersArray = Object.values(producers);
    const videoProducer = producersArray.find(
        (producer) => producer?._track?.kind === "video"
    );
    const audioProducer = producersArray.find(
        (producer) => producer?._track?.kind === "audio"
    );

    const videoTrack = videoProducer?._track;
    const audioTrack = audioProducer?._track;

    return (
        <VideoView
            roomClient={props.roomClient}
            videoProducer={videoProducer}
            audioProducer={audioProducer}
            videoTrack={videoTrack}
            audioTrack={audioTrack}
            handleMute={handleMute}
            handleUnmute={handleUnmute}
            handleVideoDisable={handleVideoDisable}
            handleVideoEnable={handleVideoEnable}
        />
    );
};

export default Admin;
