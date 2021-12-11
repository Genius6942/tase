import socket from './socket.js';
import Game from '/src/game.js';

window.socket = socket;
socket.on('connect', () => {
	console.log('connected to server');
	window.game = new Game(socket);
});