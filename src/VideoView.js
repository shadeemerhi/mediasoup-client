import React, { useEffect, useRef } from "react";

// MUI
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

const VideoView = (props) => {
    const {
        roomClient,
        videoProducer,
        audioProducer,
        videoTrack,
        audioTrack,
        handleMute,
        handleUnmute,
        handleVideoDisable,
        handleVideoEnable,
    } = props;

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
        if (!audioProducer?._paused && audioTrack) {
          // const stream = new MediaStream();
          // stream.addTrack(audioTrack);
          // audioElem.current.srcObject = stream;
        }
        else {
          audioElem.current.srcObject = null;
        }
    }, [videoTrack, audioProducer, audioTrack]);

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
                }}
            />
            {videoTrack ? (
                <VideocamIcon onClick={handleVideoDisable} fontSize="large" />
            ) : (
                <VideocamOffIcon onClick={handleVideoEnable} fontSize="large" />
            )}
            {!audioProducer?._paused ? (
                <MicIcon onClick={handleMute} fontSize="large" />
            ) : (
                <MicOffIcon onClick={handleUnmute} fontSize="large" />
            )}
            <audio autoPlay playsInline controls ref={audioElem} />
        </div>
    );
};

export default VideoView;
