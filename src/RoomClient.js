import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

// Redux
import store from "./redux/store";
import * as mediasoupActions from "./redux/actions/mediasoup";

export default class RoomClient {
    constructor({ publicRoom, userId, produce, consume }) {
        // Private room id - to be renamed to uuid or something
        this._roomName = null;

        // Public room id - will be admin username
        this._publicRoomName = publicRoom;

        this._userId = userId;

        this._produce = null;

        this._consume = null;

        this._socket = null;

        // Media Soup parameters
        this._mediasoupDevice = null;

        this._recvTransport = null;

        this._sendTransport = null;

        this._webcamProducer = null;

        this._micProducer = null;

        this._consumers = new Map();
    }
    // WILL BE RESPONSIBLE FOR ESTABLISHING SOCKET CONNECTION - PUBLIC ROOM EVENTS
    _initializePublicRoom(publicRoomName) {
        this._publicRoomName = publicRoomName;
        console.log("JOINING PUBLIC ROOM", this._publicRoomName);
        const socketConnection = io("http://localhost:4000/mediasoup");
        this._socket = socketConnection;

        // Should handle refresh case
        if (this._roomName) {
            console.log("THIS SHOULD NOT BE HAPPENING");
            this.join();
        }

        // emit join public room event
        this._socket.on("connection-success", ({ socketId }) => {
            console.log("SUCCESSFUL SOCKET CONNECTION", socketId);
            this.joinPublicRoom();
        });

        this._socket.on("joined-public-room", ({ userId }) => {
            console.log(`USER ${userId} JOINED!`);
        });
        
        this._socket.on('left-public-room', ({ userId }) => {
            console.log(`USER ${userId} LEFT`);
        });

        this._socket.on('joined-private-room', () => {
            console.log('BUDDY JOINED THE PRIVATE ROOM!');
        });

        this._socket.on('left-private-room', () => {
            console.log('BUDDY LEFT THE PRIVATE ROOM');
        });
    }

    joinPublicRoom() {
        this._socket.emit("join-public-room", {
            userId: "someRandomId",
            roomName: this._publicRoomName,
        });
    }

    leavePublicRoom() {
        this._socket.emit("leave-public-room", {
            userId: 'someRandomId',
            roomName: this._publicRoomName,
        });
    }

    // WILL BE RESPONSIBLE FOR MEDIA SOUP SOCKET EVENTS
    async join(
        publicRoomId = this._publicRoomName,
        privateRoomId = this._roomName,
        produce = this._produce,
        consume = this._consume
    ) {
        this._publicRoomName = publicRoomId;
        this._roomName = privateRoomId;
        this._produce = produce;
        this._consume = consume;

        /**
         * if there is a socket connection (which there should be) - will handle case if there isnt
         * Not totally sure what this will look like yet
         */
        if (this._socket) {
            // Join private room
            this._initializePrivateRoom();
        } else {
            this._initializePublicRoom(publicRoomId);
        }

        this._socket.on("new-consumer", () => {
            console.log("NEW CONSUMER!!!");
        });

        this._socket.on("new-producer", ({ producerId }) => {
            console.log("NEW PRODUCER", producerId);
            this.connectRecvTransport(producerId);
        });

        this._socket.on(
            "producer-closed",
            ({ consumerId, remoteProducerId }) => {
                console.log(
                    "THIS PRODUCER CLOSED",
                    remoteProducerId,
                    consumerId
                );

                // TODO - Dispatch to remove consumer from state as well
                store.dispatch(mediasoupActions.removeConsumer(consumerId));
            }
        );

        this._socket.on("consumer-paused", ({ consumerId }) => {
            store.dispatch(mediasoupActions.pauseConsumer(consumerId));
        });

        this._socket.on("consumer-resumed", ({ consumerId }) => {
            store.dispatch(mediasoupActions.resumeConsumer(consumerId));
        });

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

    // INITIALIZING PRIVATE ROOM - WILL LIKELY RENAME METHOD
    async _initializePrivateRoom() {
        try {
            this._mediasoupDevice = new mediasoupClient.Device();

            // Get routerRtpCapabilities from the server
            // JOINING PRIVATE ROOM
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

                this.getProducers();
                console.log("EVERYTHING WORKS", this);
            }
        );
    }

    async getProducers() {
        this._socket.emit("getProducers", (producerIds) => {
            console.log("HERE ARE PRODUCER IDS", producerIds);
            producerIds.forEach((id) => this.connectRecvTransport(id));
        });
    }

    async enableVideo() {
        console.log("enableVideo()");
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

        const track = stream.getVideoTracks()[0];

        params = {
            track,
            params,
        };

        this._webcamProducer = await this._sendTransport.produce(params);
        console.log("HERE IS WEBCAM PRODCUER", this._webcamProducer.id);

        // Add producer to state
        store.dispatch(
            mediasoupActions.addProducer({ ...this._webcamProducer })
        );

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
        console.log("disableVideo()");
        console.log("HERE IS THIS", this);

        if (!this._webcamProducer) return;

        this._webcamProducer.close();

        // Remove producer from state
        console.log("BEFORE REMOVAL", this._webcamProducer.id);
        store.dispatch(
            mediasoupActions.removeProducer(this._webcamProducer.id)
        );

        try {
            // Add callback to handle error
            this._socket.emit(
                "closeProducer",
                { producerId: this._webcamProducer.id },
                ({ error }) => {
                    if (error) throw new Error(error);
                }
            );
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

        // Add producer to state
        store.dispatch(mediasoupActions.addProducer({ ...this._micProducer }));

        this._micProducer.on("transportclose", () => {
            this._micProducer = null;
        });

        this._micProducer.on("trackended", () => {
            this.disableMic();
        });

        console.log("HERE IS THIS", this);
    }

    muteMic() {
        console.log("muteMic()");
        this._micProducer.pause();

        try {
            this._socket.emit(
                "pauseProducer",
                { producerId: this._micProducer.id },
                () => {
                    store.dispatch(
                        mediasoupActions.pauseProducer(this._micProducer.id)
                    );
                }
            );
        } catch (error) {
            console.log("muteMic() error");
        }
    }

    unmuteMic() {
        console.log("unmuteMic()");
        this._socket.emit(
            "resumeProducer",
            { producerId: this._micProducer.id },
            () => {
                store.dispatch(
                    mediasoupActions.resumeProducer(this._micProducer.id)
                );
            }
        );
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

                console.log(`Consumer Params`, params);
                // then consume with the local consumer transport
                // which creates a consumer
                const consumer = await this._recvTransport.consume({
                    id: params.id,
                    producerId: params.producerId,
                    kind: params.kind,
                    rtpParameters: params.rtpParameters,
                });

                // Add consumer to state
                store.dispatch(
                    mediasoupActions.addConsumer({
                        ...consumer,
                        _paused: params.producerPaused,
                    })
                );

                // the server consumer started with media paused
                // so we need to inform the server to resume
                this._socket.emit("consumer-resume", {
                    serverConsumerId: params.serverConsumerId,
                });
            }
        );
    }

    // Cleanup methods
    leavePrivateRoom() {
        this._socket.emit("leave-private-room", { roomName: this._roomName });

        // Producer
        this._webcamProducer = null;
        this._micProducer = null;
    }

    close() {
        console.log("CLOSING CONNECTIONS");
        // close socket connections and transports
        this._socket.disconnect();
        this._socket.off();
    }
}
