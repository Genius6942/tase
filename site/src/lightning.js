class Vector {
	constructor(x, y) {
		if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y
		}
		else {
			this.x = x || 0;
			this.y = y || 0;
		}
	}

	distanceTo(vector) {
		return Math.sqrt((vector.x - this.x) ** 2 + (vector.y - this.y) ** 2);
	}
	
	angle(vector) {
		return Math.atan2(vector.y - this.y, vector.x - this.x);
	}

	clone() {
		return new Vector(this.x, this.y);
	}
}

class Lightning {
	constructor ( p1, p2, thickness ) {
		this.dx = p2.x - p1.x;
		this.dy = p2.y - p1.y;
		this.start = new Vector(p1);
		this.end = new Vector(p2);
		this.points = []
		this.thickness = thickness || 4;
		this.times = 0;
		this.angle = this.start.angle(this.end);
		//this.gen();
		this.newGen();
		this.draw(ctx);
	}

	newGen() {
		const range = 50, distance = this.start.distanceTo(this.end), stepLength = 3, changeRange = 4;
		let pos = new Vector();
		for (let i = 0; i < Math.abs(distance) / stepLength; i++) {
			pos.x += Math.random() * changeRange * 2 - changeRange;
			const nowRange = 50 - Math.abs((Math.abs(distance) / stepLength / 2 - i) / (Math.abs(distance) / stepLength / 2) * range);
			if (pos.x < -nowRange) {
				pos.x = -nowRange;
			} else if (pos.x > nowRange) {
				pos.x = nowRange;
			}
			pos.y += stepLength;
			this.points.push(pos.clone());
		}
		this.points.push(new Vector(0, distance));
	}

	draw(ctx, noTrans = false) {
		ctx.fillStyle = 'red';
		ctx.shadowBlur = 0;
		ctx.beginPath();
		ctx.arc(this.start.x, this.start.y, 20, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(this.end.x, this.end.y, 20, 0, Math.PI * 2);
		ctx.fill();


		ctx.save();
		if (!noTrans) ctx.translate(this.start.x, this.start.y);
		ctx.rotate(this.angle - Math.PI / 2);
		ctx.strokeStyle = 'white';
		ctx.lineWidth = this.thickness;
		ctx.shadowBlur = 50;
		ctx.shadowColor = "#ffffff";
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for (let point of this.points) {
			ctx.lineTo(point.x, point.y);
		}
		ctx.stroke();
		ctx.restore();
		return this
	}
	async gen() {
		this.times++;
		let lastPoint = this.start;
		const stepLength = 3;
		const angle = Math.atan2(this.dy, this.dx)
		const oppositeAngle = angle + Math.PI / 2;
		const cx = Math.cos(angle) * stepLength;
		const cy = Math.sin(angle) * stepLength;
		const ocx = Math.cos(oppositeAngle);
		const ocy = Math.sin(oppositeAngle);
		const range = 40;
		let steps = 0;
		while (steps < 30000) {
			steps++;
			const rand = Math.random() * 2 * range / 4 - range / 4;
			lastPoint.x += cx;
			lastPoint.y += cy;
			lastPoint.x += ocx * rand;
			lastPoint.x += ocy * rand;
			if (lastPoint.distanceTo(new Vector(this.start.x + cx * steps, this.start.y + cy * steps)) > range) {
				lastPoint = new Vector(this.start.x + steps * cx, this.start.x + steps * cy);
			}
			this.points.push(new Vector(lastPoint.x, lastPoint.y));
			ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
			ctx.fillStyle = 'rgb(14, 9, 22)';
			ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
			this.draw(ctx);
			await new Promise(r=>setTimeout(r, 0));
			if (steps * stepLength > Math.sqrt(this.dx ** 2 + this.dy ** 2)) {
				//try {if (lastPoint.distanceTo(this.end) > 40) this.gen()} catch (e) {}
				this.points.push(this.end);
				break;
			}
		}
	}
}

export default Lightning;
export { Vector };