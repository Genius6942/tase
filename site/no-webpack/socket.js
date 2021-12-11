import { io } from "/socket.io/socket.io.esm.min.js";
const socket = io.connect(location.origin, {reconnect: false, transports: ['websocket'], upgrade: false});
export default socket;