import io, { connect } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

export default class RoomClient {
    constructor({
        roomName,
        userId,
        produce,
        consume,
        localVideo,
        remoteVideo,
        audioElem
    }) {
        this._roomName = roomName;

        this._userId = userId;

        this._localVideo = localVideo;

        this._remoteVideo = remoteVideo;

        this._audioElem = audioElem;

        this._produce = produce;

        this._consume = consume;

        this._socket = null;

        // Media Soup parameters
        this._mediasoupDevice = null;

        this._recvTransport = null;

        this._sendTransport = null;

        this._webcamProducer = null;

        this._micProducer = null;

        this._consumers = new Map();
    }

    close() {
        console.log("CLOSING CONNECTIONS");
        // close socket connections and transports
        this._socket.disconnect();
        this._socket.off();
    }

    async join() {
        console.log("JOIN METHOD BEING CALLED");
        const socketConnection = io("http://localhost:4000/mediasoup");
        this._socket = socketConnection;

        this._socket.on("connection-success", ({ socketId }) => {
            console.log("SUCCESSFUL SOCKET CONNECTION", socketId);
            this._initializeRoom();
        });

        this._socket.on("new-consumer", () => {
            console.log("NEW CONSUMER!!!");
        });

        this._socket.on('new-producer', ({ producerId }) => {
            console.log('NEW PRODUCER', producerId);
            this.connectRecvTransport(producerId);
        });

        this._socket.on('producer-closed', ({ remoteProducerId }) => {
            console.log('THIS PRODUCER CLOSED', remoteProducerId);
            this._remoteVideo.current.srcObject = null;
        })

        // Close mediasoup Transports.
        if (this._sendTransport) {
            this._sendTransport.close();
            this._sendTransport = null;
        }

        if (this._recvTransport) {
            this._recvTransport.close();
            this._recvTransport = null;
        }
    }

    async _initializeRoom() {
        try {
            this._mediasoupDevice = new mediasoupClient.Device();

            // Get routerRtpCapabilities from the server
            this._socket.emit(
                "joinRoom",
                { roomName: this._roomName, isAdmin: this._produce },
                async (data) => {
                    const routerRtpCapabilities = data.rtpCapabilities;
                    await this.loadDevice(routerRtpCapabilities);

                    // Create transports depending on user type
                    if (this._produce) {
                        this.createSendTransport();
                    }

                    if (this._consume) {
                        this.createRecvTransport();
                    }
                }
            );
        } catch (error) {
            console.log("initializeRoom() error");
        }
    }

    async createSendTransport() {
        this._socket.emit(
            "createWebRtcTransport",
            { consumer: this._consume },
            ({ params }) => {
                if (params.error) {
                    console.log(params.error);
                    throw new Error(params.error);
                }

                this._sendTransport =
                    this._mediasoupDevice.createSendTransport(params);

                // Send transport event listeners
                this._sendTransport.on(
                    "connect",
                    async ({ dtlsParameters }, callback, errback) => {
                        console.log("INSIDE CONNECT EVENT");
                        this._socket.emit(
                            "transport-connect",
                            {
                                dtlsParameters,
                            },
                            () => {
                                console.log("TRANSPORT CONNECTED");
                                callback();
                            }
                        );
                    }
                );

                this._sendTransport.on(
                    "produce",
                    async (parameters, callback, errback) => {
                        // Wrap in tr
                        const { kind, rtpParameters, appData } = parameters;
                        console.log("INSIDE PRODUCE EVENT", kind);

                        this._socket.emit(
                            "transport-produce",
                            { kind, rtpParameters, appData },
                            ({ id, producersExist }) => {
                                console.log("HERE IS PRODUCER ID", id);
                                /**
                                 * Tell the transport that parameters were transmitted and provide with the
                                 * server-side producer's id
                                 */
                                callback({ id });
                            }
                        );
                    }
                );

                this.enableVideo();
                this.enableMic();
            }
        );
    }

    async createRecvTransport() {
        this._socket.emit(
            "createWebRtcTransport",
            { consumer: this._consume },
            ({ params }) => {
                // Still figuring out error handling
                if (params.error) {
                    console.log(params.error);
                    // throw new Error(params.error);
                    return;
                }

                this._recvTransport =
                    this._mediasoupDevice.createRecvTransport(params);

                this._recvTransport.on(
                    "connect",
                    async ({ dtlsParameters }, callback, errback) => {
                        try {
                            // Signal dtlsParameters to the server-side transport
                            // Will change connection events for both transports to be a single event ('connectWebRtcTransport')
                            this._socket.emit("transport-recv-connect", {
                                serverConsumerTransportId:
                                    this._recvTransport.id,
                                dtlsParameters,
                            });

                            // Tell the transport that parameters were transmitted - move to callback?
                            callback();
                        } catch (error) {
                            errback(error);
                        }
                    }
                );

                // this.consumeHost();
                this.getProducers();
                console.log("EVERYTHING WORKS", this);
            }
        );
    }

    async getProducers() {
        this._socket.emit("getProducers", (producerIds) => {
            console.log("HERE ARE PRODUCER IDS", producerIds);
            producerIds.forEach(id => this.connectRecvTransport(id));
            // this.connectRecvTransport(producerIds[1])
        });
    }

    async consumeHost() {
        console.log("INSIDE CONSUME HOST");
        this._socket.emit(
            "consumeHost",
            {
                rtpCapabilities: this._mediasoupDevice.rtpCapabilities,
                transportId: this._recvTransport.id,
            },
            async ({ params }) => {
                if (params.error) {
                    console.log("Cannot consume", params.error);
                    return;
                }

                console.log("AFTER SERVER SIDE", params);

                const {
                    id,
                    producerId,
                    kind,
                    rtpParameters,
                    serverConsumerId,
                } = params;

                const consumer = await this._recvTransport.consume({
                    id,
                    producerId,
                    kind,
                    rtpParameters,
                });

                const { track } = consumer;
                console.log("HERE IS TRACK", track);

           

                this._remoteVideo.current.srcObject = new MediaStream([track]);
                this._remoteVideo.current.style.border = "2px solid red";

                console.log("HERE IS THIS", this);

                /**
                 * Issue here are consumer cannot be found on the server as I don't think it's
                 * currently being added right
                 */
                this._socket.emit("consumer-resume", {
                    serverConsumerId,
                });
            }
        );
    }

    async enableVideo() {
        if (this._webcamProducer) return;

        // Will move into config file
        let params = {
            // mediasoup params
            encodings: [
                {
                    rid: "r0",
                    maxBitrate: 100000,
                    scalabilityMode: "S1T3",
                },
                {
                    rid: "r1",
                    maxBitrate: 300000,
                    scalabilityMode: "S1T3",
                },
                {
                    rid: "r2",
                    maxBitrate: 900000,
                    scalabilityMode: "S1T3",
                },
            ],
            // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
            codecOptions: {
                videoGoogleStartBitrate: 1000,
            },
        };
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                width: {
                    min: 640,
                    max: 1920,
                },
                height: {
                    min: 400,
                    max: 1080,
                },
            },
        });

        // Update UI
        this._localVideo.current.srcObject = stream;
        this._localVideo.current.style.border = "2px solid black";

        const track = stream.getVideoTracks()[0];

        params = {
            track,
            params,
        };

        this._webcamProducer = await this._sendTransport.produce(params);

        this._webcamProducer.on("trackended", () => {
            console.log("track ended");
            // Add cleanup
        });

        this._webcamProducer.on("transportclose", () => {
            console.log("transport ended");
            // Add cleanup
        });
    }

    async disableVideo() {
        console.log('disableVideo()');

        if (!this._webcamProducer) return;

        this._webcamProducer.close();

        // Remove producer from state

        try {
            // Add callback to handle error
            this._socket.emit('closeProducer', { producerId: this._webcamProducer.id }, ({ error }) => {
                if (error) throw new Error(error)
            });
        } catch (error) {
            console.log(error);
        }

        this._webcamProducer = null;

    }

    async enableMic() {
        if (this._micProducer) {
            return;
        }

        if (!this._mediasoupDevice.canProduce("audio")) {
            console.log("enableMic() cannot produce audio");
            return;
        }
        console.log("INSIDE ENABLE MIC");
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        const track = stream.getAudioTracks()[0];
        console.log("HERE IS TRACK", track);

        this._micProducer = await this._sendTransport.produce({
            track,
            codecOptions: {
                opusStereo: 1,
                opusDtx: 1,
            },
        });

        this._micProducer.on("transportclose", () => {
            this._micProducer = null;
        });

        this._micProducer.on("trackended", () => {
            this.disableMic();
        });

        console.log("HERE IS THIS", this);
    }

    muteMic() {
        console.log('muteMic()');
        this._micProducer.pause();

        // try {
        //     this._socket.emit('pauseProducer', { producerId: this._micProducer.id })
        // } catch (error) {
        //     console.log('muteMic() error');
        // }
    }

    unmuteMic() {
        console.log('unmuteMic()');
        this._socket.emit('resumeProducer', ({ producerId: this._micProducer.id }))
        try {
            this._micProducer.resume();
        } catch (error) {
            console.log(error);
        }
    }

    async loadDevice(routerRtpCapabilities) {
        await this._mediasoupDevice.load({ routerRtpCapabilities });
    }


    async connectRecvTransport(remoteProducerId) {
        // consumerTransport,

        // serverConsumerTransportId
        console.log("INSIDE FUNCTION THING");
        // for consumer, we need to tell the server first
        // to create a consumer based on the rtpCapabilities and consume
        // if the router can consume, it will send back a set of params as below
        this._socket.emit(
            "consume",
            {
                rtpCapabilities: this._mediasoupDevice.rtpCapabilities,
                remoteProducerId,
                serverConsumerTransportId: this._recvTransport.id,
            },
            async ({ params }) => {
                if (params.error) {
                    console.log("Cannot Consume");
                    return;
                }

                console.log(`Consumer Params ${params}`);
                // then consume with the local consumer transport
                // which creates a consumer
                console.log(
                    "ABOUT TO CALL CLIENT SIDE CONSUME",
                    remoteProducerId,
                    params.producerId
                );
                const consumer = await this._recvTransport.consume({
                    id: params.id,
                    producerId: params.producerId,
                    kind: params.kind,
                    rtpParameters: params.rtpParameters,
                });

                // consumerTransports = [
                //     ...consumerTransports,
                //     {
                //         // consumerTransport,
                //         consumerTransport: recvTransport,
                //         serverConsumerTransportId: params.id,
                //         producerId: remoteProducerId,
                //         consumer,
                //     },
                // ];

                // destructure and retrieve the video track from the producer
                const { track } = consumer;
                console.log('HERE IS TRACK', track);
                if (params.kind === 'audio') {
                    const stream = new MediaStream;
                    stream.addTrack(track)
                    this._audioElem.current.srcObject = stream;

                }

                if (params.kind === 'video') {
                    const stream = new MediaStream;
                    stream.addTrack(track);
                    this._remoteVideo.current.srcObject = stream;

                    // this._remoteVideo.current.play().catch(error => console.log(error));

                    this._remoteVideo.current.onplay = () => {
                        console.log('THIS IS PLAYING LOL');
                        this._audioElem.current.play().catch(error => console.log(error));
                    }
                }


                // if (this._remoteVideo.current.srcObject) {
                //     const newStream = this._remoteVideo.current.srcObject;
                //     newStream.addTrack(track);
                //     this._remoteVideo.current.srcObject = newStream;
                //     console.log('NEW STREAM', newStream);
                // }
                // else {
                // }
                // this._remoteVideo.current.srcObject = new MediaStream([track]);

                this._remoteVideo.current.style.border = "2px solid red";

                // the server consumer started with media paused
                // so we need to inform the server to resume
                this._socket.emit("consumer-resume", {
                    serverConsumerId: params.serverConsumerId,
                });
            }
        );
    }
}
