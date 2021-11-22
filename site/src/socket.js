import { io } from "/socket.io/socket.io.esm.min.js";
const socket = io.connect(location.href, {reconnect: false});
export default socket;