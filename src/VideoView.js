import React, { useEffect, useRef, useState } from "react";

// Components
import AcceptAudioModal from "./AcceptAudioModal";

// MUI
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import Avatar from '@mui/material/Avatar'

const VideoView = (props) => {
    const {
        roomClient,
        videoProducer,
        audioProducer,
        videoConsumer,
        audioConsumer,
        videoTrack,
        audioTrack,
        handleMute,
        handleUnmute,
        handleVideoDisable,
        handleVideoEnable,
    } = props;

    const [acceptAudio, setAcceptAudio] = useState(false);

    const videoElem = useRef();
    const audioElem = useRef();

    useEffect(() => {
        if (videoTrack) {
            console.log("LOL FUCK", videoTrack);
            const stream = new MediaStream();
            stream.addTrack(videoTrack);
            videoElem.current.srcObject = stream;
        } else {
            console.log("ELSE ELSE ELSE");
            videoElem.current.srcObject = null;
        }

        // Need to add something so we don't hear our own audio
        if (audioConsumer && audioTrack && !audioConsumer?._paused) {
            const stream = new MediaStream();
            stream.addTrack(audioTrack);
            audioElem.current.srcObject = stream;
            // audioElem.current.play().catch(err => console.log(err));
        } else {
            audioElem.current.srcObject = null;
        }
    }, [videoTrack, audioProducer, audioTrack, audioConsumer]);

    return (
        <div>
            <video
                playsInline
                muted
                autoPlay
                controls
                ref={videoElem}
                width={300}
                style={{
                    width: "100vw",
                    height: "300px",
                    display: `${!videoTrack ? "none" : ""}`,
                }}
            />
            {!videoTrack && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "300px",
                        width: "100vw",
                        border: "1px solid grey",
                    }}
                >
                    <Avatar sx={{ width: 100, height: 100 }}>S</Avatar>
                </div>
            )}
            {videoTrack ? (
                <VideocamIcon onClick={handleVideoDisable} fontSize="large" />
            ) : (
                <VideocamOffIcon onClick={handleVideoEnable} fontSize="large" />
            )}
            {audioProducer?._paused || audioConsumer?._paused ? (
                <MicOffIcon onClick={handleUnmute} fontSize="large" />
            ) : (
                <MicIcon onClick={handleMute} fontSize="large" />
            )}
            <audio autoPlay playsInline ref={audioElem} />
            {audioConsumer && !acceptAudio && (
                <AcceptAudioModal
                    audioElem={audioElem}
                    setAcceptAudio={setAcceptAudio}
                />
            )}
        </div>
    );
};

export default VideoView;
