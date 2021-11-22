const socketio = require('socket.io');
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 2000;
const server = app.listen(port);
app.use(express.static(path.join(__dirname, 'site')));

const io = socketio(server);

let players = [];

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
    	result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

io.on('connection', (socket) => {
	const id = makeid(10);
	io.to(socket.id).emit('id', id);
	console.log('Person Joined: ' + id);

	const player = game.addPlayer(id);
	socket.on('disconnect', () => {
		console.log('Person Disconnected: ' + id);
		game.removePlayer(id);
	});

	socket.on('ping', () => {
		io.to(socket.id).emit('pong');
	});

	socket.on('angle', (angle) => {
		player.angle = angle;
	});
});

class Game {
	constructor () {
		this.players = [];
		this.boardSize = 4000; // px i guess
		this.fps = 60;
		this.gameLoop = setInterval(this.update.bind(this), 1000 / this.fps);
	}

	addPlayer(id) {
		const player = new Player(id, this);
		this.players.push(player);
		return player;
	}

	removePlayer(id) {
		const i = this.getPlayerById(id, true);
		if (i == null) {
			return false;
		}

		io.emit('kill', id, true);
		this.players.splice(i, 1);

		return true;
	}

	getPlayerById(id, index = false) {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].id === id) {
				return index ? i : this.players[i];
			}
		}
		return null;
	}

	update () {
		const data = this.players.map(player => player.getData())
		io.emit('update', data);
	}
}

class Player {
	constructor (id, game) {
		this.id = id;
		this.angle = 0;
		this.position = new Point(Math.random() * game.boardSize - game.boardSize / 2, Math.random() * game.boardSize - game.boardSize / 2);
		this.game = game;
		this.color = '#' + Math.floor(Math.random()*16777215).toString(16);
    this.health = 10;
	}

	getData () {
		return {pos: this.position.get(), angle: this.angle, color: this.color};
	}

	update () {
		
	}
}

class Point {
	constructor (x, y) {
		if (x && y) {
			this.x = x;
			this.y = y;
		} else {
			this.x = 0;
			this.y = 0;
		}
	}
	get() {
		return {x: this.x, y: this.y};
	}
}

const game = new Game();