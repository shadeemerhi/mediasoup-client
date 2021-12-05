import React from "react";

import { useSelector } from "react-redux";

import VideoView from "./VideoView";

const Peer = (props) => {

    const consumers = useSelector(state => state.consumers);

    const consumersArray = Object.values(consumers);
    const videoConsumer = consumersArray.find(consumer => consumer?._track?.kind === 'video');
    const audioConsumer = consumersArray.find(consumer => consumer?._track?.kind === 'audio');

    return (
        <VideoView
            roomClient={props.roomClient}
            videoConsumer={videoConsumer}
            audioConsumer={audioConsumer}
            videoTrack={videoConsumer ? videoConsumer._track : null}
            audioTrack={audioConsumer ? audioConsumer._track : null}
        />
    );
};

export default Peer;
