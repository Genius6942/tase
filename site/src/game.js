class Game {
	constructor (socket) {
		this.socket = socket;

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

		const debug = true;
		if (debug) {
			window.addEventListener('error', (e) => {
				alert(e.stack || e.message);
			});
			window.addEventListener('keydown', (e) => {
				//if (e.key === 'r' && confirm('reload?')) history.go(0);
			});
		}

		this.startPingPong();

		this.main = [];

		
		this.static = {};
		this.socket.on('init', (initData) => {
			this.static = initData;
		});


		this.angle = 0; // in radians!
		window.addEventListener('mousemove', (e) => {
			const dx = e.clientX - window.innerWidth / 2;
			const dy = e.clientY - window.innerHeight / 2;
			this.angle = Math.atan2(dy, dx) - Math.PI / 2;
			this.socket.emit('angle', this.angle);
/*
			this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
			this.ctx.save();
			this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
			this.ctx.rotate(this.angle);
			this.drawPlayer('red');
			this.ctx.restore();*/
		});

		socket.on('update', (data) => {
			this.main = data;
		});

		window.addEventListener('mousemove', (e) => {
			const dx = e.clientX - window.innerWidth / 2;
			const dy = e.clientY - window.innerHeight / 2;
			this.angle = Math.atan2(dy, dx) - Math.PI / 2;
			this.socket.emit('angle', this.angle);

			/*
			this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
			this.ctx.save();
			this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
			this.ctx.rotate(this.angle);
			this.drawPlayer('red');
			this.ctx.restore();*/
		});

		socket.on('update', (data) => {
			this.main = data;
		});

		this.update();
		
		this.ctx.save();
		this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
		this.ctx.rotate(Math.PI / 2);
		this.drawPlayer('red');
		this.ctx.restore();

	}

	startPingPong() {
		const pingsPerSecond = 2;
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
				if (p.id === this.id) {
					pos = p.pos;
					break;
				}
			}
			if (!pos) {
				pos = {x: 0, y: 0};
			}
			
			//if (location.href.includes('tase')) alert(JSON.stringify(this.main));
			for (let player of this.main) {
				this.ctx.save();
				//if (player.pos.x === pos.x && player.pos.y === pos.y) alert(JSON.stringify({x: -pos.x + window.innerWidth / 2 -(player.pos.x - pos.x), y: -pos.y + window.innerHeight / 2 - (player.pos.x - pos.x)}));
				this.ctx.translate(window.innerWidth / 2 -(player.pos.x - pos.x), window.innerHeight / 2 - (player.pos.x - pos.x));
				this.ctx.rotate(player.angle);
				this.drawPlayer(player.color);
				this.ctx.restore();
			}

			requestAnimationFrame(this.update.bind(this));
		} catch (e) {
			alert(e.stack || e.message);
		}
	}

	drawPlayer(color) {
		const radius = 20;
		this.ctx.lineWidth = 2 * radius / 50;
		this.ctx.fillStyle = color;
		this.ctx.strokeStyle = 'black';
		this.ctx.beginPath();
		this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        this.ctx.fill();
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.arc(radius * 1.2, radius * 1.2, radius / 3, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.arc(-radius * 1.2, radius * 1.2, radius / 3, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.moveTo(-radius * 1.2, radius * 1.2);
		this.ctx.lineTo(0, radius * 1.8);
		this.ctx.lineTo(radius * 1.2, radius * 1.2);
		this.ctx.lineWidth = 6 * radius / 50;
		this.ctx.stroke();

	}
}

export default Game;