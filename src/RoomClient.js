import io from 'socket.io-client';


export default class RoomClient {
  constructor({
    roomId,
    userId,
    produce,
    consume
  }) {
    this._userId = userId;

    this._produce = produce;

    this._consume = consume;

    this._socket = null;

    this._recvTransport = null;

    this._sendTransport = null;

    this._webcamProducer = null;

    this._consumers = new Map();

  }

  close() {
    console.log('CLOSING CONNECTIONS');
    // close socket connections and transports
    this._socket.disconnect();
    this._socket.off();
  }

  async join() {
    console.log('JOIN METHOD BEING CALLED');
    const socketConnection = io('http://localhost:4000/mediasoup');
    this._socket = socketConnection;

    this._socket.on('connection-success', ({ socketId }) => {
      console.log('SUCCESSFUL SOCKET CONNECTION', socketId);
    });

    console.log('HERE IS THIS', this);
  }
}