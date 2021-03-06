import Stats from './stats.js';
import Lightning from './lightning.js';

class Game {
	constructor(socket) {
		this.socket = socket;
		this.stats = new Stats();
		document.body.appendChild(this.stats.dom);
		this.stats.dom.id = 'stats';
		this.stats.dom.style.cssText = '';

		this.canvas = document.getElementById('container').appendChild(document.createElement('canvas'));
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.style.cssText = `
			width: 100%;
			height: 100vh;
			top: 0;
			left: 0;
			position: fixed;
		`;

		this.ctx = this.canvas.getContext('2d');

		this.mini = document.getElementById('container').appendChild(document.createElement('div')).appendChild(document.createElement('canvas'));
		this.mini.style.cssText = `
			width: 150px;
			height: 150px;
			bottom: 70px;
			right: 30px;
			position: fixed;
			border: 7px solid black;
			background: white;
			z-index: 105;
		`;
		this.mini.width = this.mini.offsetWidth;
		this.mini.height = this.mini.offsetHeight;

		this.mini.ctx = this.mini.getContext('2d');
		this.mini.ctx.fillStyle = 'white';
		this.mini.ctx.fillRect(0, 0, 30, 30);

		const debug = true;
		if (debug) {
			window.addEventListener('keydown', (e) => {
				//if (e.key === 'r' && confirm('reload?')) history.go(0);
			});
		}

		this.startPingPong();

		this.main = [];


		this.static = {};
		this.socket.on('init', (initData) => {
			this.static = initData;
			//this.createNoise();
			$('#username').maxLength = this.static.maxNameLength;

			this.update();
		});

		socket.on('update', (data) => {
			this.main = data;
		});

		socket.on('lightning', this.lightning.bind(this));

		this.bg = new Image();
		this.bg.addEventListener('load', () => {
			this.bgPattern = this.ctx.createPattern(this.bg, 'repeat');
		})
		this.bg.src = location.origin + '/assets/bg.png';


		setInterval(this.fps.bind(this), 1000);
		this.frames = 0;

		window.addEventListener('resize', () => {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		});
		$('#start form').on('submit', (e) => {
			e.preventDefault();
			this.init();
		});

		this.socket.on('disconnect', () => {
			alert('Connection to the server has been lost.');
		});

		$('#wait').style.display = 'none';
	}

	init() {
		//alert('start');
		this.socket.emit('init', {
			name: $('#start form #username').value,
			color: $('#start form #color').value,
		});
		$('#start').style.display = 'none';

		this.socket.on('id', id => {
			this.static.id = id;
		});

		this.angle = 0; // in radians
		window.addEventListener('mousemove', (e) => {
			const dx = e.clientX - window.innerWidth / 2;
			const dy = e.clientY - window.innerHeight / 2;
			this.angle = Math.atan2(dy, dx);
			this.socket.emit('angle', this.angle);
		});
	}

	fps() {
		document.getElementById('fps').innerHTML = this.frames;
		//alert(this.frames);
		this.frames = 0;
	}

	lightning(p1, p2) {
		this.lightnings.push(new Lightinig(p1, p2, { fadeTime: 200 }));
	}

	startPingPong() {
		const pingsPerSecond = 1;
		let lastTime = performance.now();
		const ping = () => {
			lastTime = performance.now();
			this.socket.emit('ping');
		}
		this.socket.on('pong', () => {
			let time = performance.now();
			document.getElementById('ping').innerHTML = Math.round(time - lastTime).toString();
			setTimeout(ping, 1000 / pingsPerSecond);
		});

		ping();
	}

	update() {
		try {
			this.ctx.fillStyle = 'white';
			this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
			if (this.initData === {}) {
				return requestAninimationFrame(this.update.bind(this));
			}
			let pos;
			for (let p of this.main) {
				if (p.id === this.static.id) {
					pos = p.pos;
					break;
				}
			}
			if (!pos) {
				pos = { x: 0, y: 0 };
			}

			this.pos = pos;
			//if (location.href.includes('tase')) alert(JSON.stringify(this.main));
			this.ctx.fillStyle = this.bgPattern || 'white';
			//this.ctx.fillRect(window.innerWidth / 2 + (-this.static.boardSize / 2 - pos.x), window.innerHeight / 2 +(-this.static.boardSize / 2 - pos.y), this.static.boardSize, this.static.boardSize);
			this.ctx.save();
			this.ctx.translate(window.innerWidth / 2 + (0 - pos.x), window.innerHeight / 2 + (0 - pos.y));
			this.ctx.fillRect(pos.x - window.innerWidth / 2, pos.y - window.innerHeight / 2, window.innerWidth, window.innerHeight);
			this.ctx.restore();


			this.ctx.lineWidth = 10;
			this.ctx.strokeStyle = 'black';
			this.ctx.strokeRect(window.innerWidth / 2 + (-this.static.boardSize / 2 - pos.x), window.innerHeight / 2 + (-this.static.boardSize / 2 - pos.y), this.static.boardSize, this.static.boardSize);


			for (let player of this.main) {
				this.ctx.save();
				//if (player.pos.x === pos.x && player.pos.y === pos.y) alert(JSON.stringify({x: -pos.x + window.innerWidth / 2 -(player.pos.x - pos.x), y: -pos.y + window.innerHeight / 2 - (player.pos.x - pos.x)}));
				this.ctx.translate(window.innerWidth / 2 + (player.pos.x - pos.x), window.innerHeight / 2 + (player.pos.y - pos.y));
				this.ctx.rotate(player.angle - Math.PI / 2);
				this.drawPlayer(player.color, player.radius, -player.angle + Math.PI / 2, player.name);
				this.ctx.restore();

				if (player.id === this.static.id) {
					this.mini.ctx.clearRect(0, 0, this.mini.width, this.mini.height)
					this.mini.ctx.fillStyle = player.color;
					this.mini.ctx.beginPath();
					this.mini.ctx.arc((player.pos.x + this.static.boardSize / 2) / (this.static.boardSize / this.mini.width), (player.pos.y + this.static.boardSize / 2) / (this.static.boardSize / this.mini.height), this.mini.width / 20, 0, Math.PI * 2);
					this.mini.ctx.fill();
				}
			}


			requestAnimationFrame(this.update.bind(this));
			this.frames += 1;

			this.stats.update();
		} catch (e) {
			alert(e.stack || e.message);
		}
	}

	drawPlayer(color, radius = 20, angle = 0, name = 'player', health = 10, type = false) {
		this.ctx.lineWidth = 2 * radius / 50;
		this.ctx.fillStyle = color;
		this.ctx.strokeStyle = 'black';
		this.ctx.beginPath();
		this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
		this.ctx.fill();
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.arc(radius * 1.3, radius * 1.3, radius / 2.5, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.arc(-radius * 1.3, radius * 1.3, radius / 2.5, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.stroke();

		if (type === 'shield') {
			this.ctx.beginPath();
			this.ctx.moveTo(-radius * 1.2, radius * 1.2);
			this.ctx.lineTo(0, radius * 1.8);
			this.ctx.lineTo(radius * 1.2, radius * 1.2);
			this.ctx.lineWidth = 6 * radius / 50;
			this.ctx.stroke();
		}

		this.ctx.rotate(angle);
		this.ctx.font = '20px Arial';
		this.ctx.textAlign = 'center';
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(name.toString(), 0, -radius * 1.3 - radius / 2.5 - 50);
		if (health < 100) {
			this.drawHealthBar(health, -radius * 1.3 - radius / 2.5 - 40);
		}
	}

	drawHealthBar(health, top) {
		const height = 20, width = 80, margin = 3;
		this.ctx.fillStyle = 'grey';
		this.ctx.fillRect(-width / 2, top, width, height);
		this.ctx.fillStyle = health > 60 ? '#00ff00' : health > 20 ? '#ffff00' : '#ff0000';
		this.ctx.fillRect(-width / 2 + margin, top + margin, (width - margin * 2) * (health / 100), height - margin * 2);
	}
}

export default Game;