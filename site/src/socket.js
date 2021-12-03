import { io } from "/socket.io/socket.io.esm.min.js";
const socket = io.connect(location.href, {reconnect: false, transport: ['websocket'], upgrade: false});
export default socket;