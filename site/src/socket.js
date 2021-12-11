import { io } from "socket.io-client";
const socket = io.connect(location.href, {reconnect: false, transports: ['websocket'], upgrade: false});
export default socket;