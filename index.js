const socketio = require('socket.io');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 2000;
const server = app.listen(port);
app.use(express.static(path.join(__dirname, 'site')));

const io = socketio(server, { transports: ['websocket'] });

console.clear();

function makeid(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

	return str;
}

function createIoSever() {
	io.on('connection', (socket) => {
		io.to(socket.id).emit('init', {
			boardSize: game.boardSize,
			playerRadius: game.playerRadius,
			maxNameLength: game.maxNameLength,
		});
		socket.on('init', (initData) => {
			const id = makeid(15);
			const name = initData.name.substring(0, game.maxNameLength);
			const color = initData.color;
			io.to(socket.id).emit('id', id);
			const player = game.addPlayer(id, name, color);
			socket.on('disconnect', () => {
				console.log('Person left: ' + name + ', ' + color + ', ' + id + ' at ' + getFormattedDate());
				game.removePlayer(id);
			});

			socket.on('angle', (angle) => {
				player.angle = angle;
			});
			console.log('Person joined: ' + name + ', ' + color + ', ' + id + ' at ' + getFormattedDate());
		});

		socket.on('ping', () => {
			io.to(socket.id).emit('pong');
		});

		io.to(socket.id).emit("session", {
			sessionID: socket.sessionID,
			userID: socket.userID,
		});
	});
}

class Game {
	constructor() {
		this.players = [];
		this.boardSize = 8000; // px i guess
		this.fps = 60;
		this.gameLoop = setInterval(this.update.bind(this), 1000 / this.fps);
		this.playerRadius = 20;
		this.friction = 1;
		this.maxNameLength = 15;
		this.playerStartHealth = 300;
	}

	addPlayer(id, name, color) {
		const player = new Player(id, this, name, color);
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

	update() {
		this.players.forEach(player => player.update());


		// send data
		const data = this.players.map(player => player.getData());
		io.emit('update', data);
	}
	
	collisionCircleLine(circle,line) { // from https://stackoverflow.com/a/55016278

		var side1 = Math.sqrt(Math.pow(circle.x - line.p1.x,2) + Math.pow(circle.y - line.p1.y,2)); // Thats the pythagoras theoram If I can spell it right

		var side2 = Math.sqrt(Math.pow(circle.x - line.p2.x,2) + Math.pow(circle.y - line.p2.y,2));

		var base = Math.sqrt(Math.pow(line.p2.x - line.p1.x,2) + Math.pow(line.p2.y - line.p1.y,2));

		if(circle.radius > side1 || circle.radius > side2)
			return true;

		var angle1 = Math.atan2( line.p2.x - line.p1.x, line.p2.y - line.p1.y ) - Math.atan2( circle.x - line.p1.x, circle.y - line.p1.y ); // Some complicated Math

		var angle2 = Math.atan2( line.p1.x - line.p2.x, line.p1.y - line.p2.y ) - Math.atan2( circle.x - line.p2.x, circle.y - line.p2.y ); // Some complicated Math again

		if(angle1 > Math.PI / 2 || angle2 > Math.PI / 2) // Making sure if any angle is an obtuse one and Math.PI / 2 = 90 deg
			return false;


			// Now if none are true then

			var semiperimeter = (side1 + side2 + base) / 2;

			var areaOfTriangle = Math.sqrt( semiperimeter * (semiperimeter - side1) * (semiperimeter - side2) * (semiperimeter - base) ); // Heron's formula for the area

			var height = 2*areaOfTriangle/base;

			if( height < circle.radius )
				return true;
			else
				return false;

	}
}


class Vector {
	constructor(x, y) {
		if (x && y) {
			this.x = x;
			this.y = y;
		} else {
			this.x = 0;
			this.y = 0;
		}
	}
	get() {
		return { x: this.x, y: this.y };
	}

	reset() {
		this.x = 0;
		this.y = 0;
	}
}

class Player extends Vector {
	constructor(id, game, name, color) {
		super(Math.random() * game.boardSize - game.boardSize / 2, Math.random() * game.boardSize - game.boardSize / 2);
		this.id = id;
		this.name = name;
		this.angle = 0;
		this.game = game;
		this.color = color || '#' + Math.floor(Math.random() * 16777215).toString(16);
		this.maxHealth = game.playerStartHealth;
		this.health = this.maxHealth;
		this.velocity = new Vector();
		this.radius = this.game.playerRadius;
		this.friction = this.game.friction;
		this.maxVelocity = 10;

		this.taseCharge = 0;
		this.maxTaseCharge = 100;
		this.taseChargeSpeed = .3;

	}

	getData() {
		return { pos: this.get(), angle: this.angle, color: this.color, id: this.id, radius: this.radius, name: this.name };
	}

	update() {
		this.velocity.x += Math.cos(this.angle) * this.friction;
		this.velocity.y += Math.sin(this.angle) * this.friction;
		const velocity = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
		if (velocity > this.maxVelocity) {
			const factor = this.maxVelocity / velocity;
			this.velocity.x *= factor;
			this.velocity.y *= factor;
		}
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		if (this.x < -this.game.boardSize / 2) {
			this.x = -this.game.boardSize / 2;
			this.velocity.x = 0;
		}
		if (this.y < -this.game.boardSize / 2) {
			this.y = -this.game.boardSize / 2;
			this.velocity.y = 0;
		}
		if (this.x > this.game.boardSize / 2) {
			this.x = this.game.boardSize / 2;
			this.velocity.x = 0;
		}
		if (this.y > this.game.boardSize / 2) {
			this.y = this.game.boardSize / 2;
			this.velocity.y = 0;
		}
	}
	
}

const game = new Game();

createIoSever();