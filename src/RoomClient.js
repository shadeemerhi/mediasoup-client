import io from "socket.io-client";
import * as mediasoupClient from 'mediasoup-client';

export default class RoomClient {
    constructor({ roomName, userId, produce, consume }) {

        this._roomName = roomName;

        this._userId = userId;

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
        this._socket.emit('joinRoom', { roomName: this._roomName, isAdmin: this._produce }, async (data) => {
          const routerRtpCapabilities = data.rtpCapabilities;
          await this.loadDevice(routerRtpCapabilities);

          if (this._produce) {
            this._socket.emit('createWebRtcTransport', { consumer: this._consume }, ({ params }) => {

              if (params.error) {
                console.log(params.error);
                throw new Error(params.error);
              }

              this._sendTransport = this._mediasoupDevice.createSendTransport(params);

              // Send transport event listeners
              this._sendTransport.on('connect', async ({ dtlsParameters}, callback, errback) => {
                this._socket.emit('transport-connect', {
                  dtlsParameters
                }, () => {
                  console.log('TRANSPORT CONNECTED');
                  callback();
                });
              });

              this._sendTransport.on('produce', async (parameters, callback, errback) => {
                const { kind, rtpParameters, appData } = parameters;

                this._socket.emit('transport-produce', { kind, rtpParameters, appData }, ({ id, producersExist }) => {
                  /**
                   * Tell the transport that parameters were transmitted and provide with the
                   * server-side producer's id
                   */
                  callback({ id });
                });
              })
            })
          }
        })
      } catch (error) {
        console.log('initializeRoom() error');
      }
    }

    async loadDevice(routerRtpCapabilities) {
      await this._mediasoupDevice.load({ routerRtpCapabilities });
    }
}
