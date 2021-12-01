import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

export default class RoomClient {
    constructor({ roomName, userId, produce, consume, localVideo, remoteVideo }) {
        this._roomName = roomName;

        this._userId = userId;

        this._localVideo = localVideo;

        this._remoteVideo = remoteVideo;

        this._produce = produce;

        this._consume = consume;

        this._socket = null;

        // Media Soup parameters
        this._mediasoupDevice = null;

        this._recvTransport = null;

        this._sendTransport = null;

        this._webcamProducer = null;

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


        this._socket.on('new-consumer', () => {
            console.log('NEW CONSUMER!!!');
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
                      console.log('INSIDE CONNECT EVENT');
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
                        console.log('INSIDE PRODUCE EVENT');

                        this._socket.emit(
                            "transport-produce",
                            { kind, rtpParameters, appData },
                            ({ id, producersExist }) => {
                                console.log('HERE IS PRODUCER ID', id);
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

                this.consumeHost();
                // this.getProducers();
                console.log('EVERYTHING WORKS', this);
            }
        );
    }

    async getProducers() {
        this._socket.emit('getProducers', (producerIds) => {
            console.log('HERE ARE PRODUCER IDS', producerIds);
        })
    }

    async consumeHost() {
        console.log('INSIDE COMSUME HOST');
        this._socket.emit("consumeHost", {
            rtpCapabilities: this._mediasoupDevice.rtpCapabilities,
            transportId: this._recvTransport.id,
        }, async ({ params }) => {
          if (params.error) {
            console.log('Cannot consume', params.error);
            return;
          }

          console.log('AFTER SERVER SIDE', params);

          const { id, producerId, kind, rtpParameters, serverConsumerId } = params;

          const consumer = await this._recvTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters
          });

          const { track } = consumer;
          console.log('HERE IS TRACK', track);

          this._remoteVideo.current.srcObject = new MediaStream([track]);
          this._remoteVideo.current.style.border = "2px solid red";

          /**
           * Issue here are consumer cannot be found on the server as I don't think it's
           * currently being added right
           */
          this._socket.emit('consumer-resume', {
            serverConsumerId
          });
        });
    }

    async enableVideo() {
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
            audio: false,
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

    async loadDevice(routerRtpCapabilities) {
        await this._mediasoupDevice.load({ routerRtpCapabilities });
    }
}
