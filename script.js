"use strict";

const FPS = 30;
const TIMESTEP = 1000 / FPS;

const LEAF_COUNT = 300;
const RAKE_DISTANCE_LENGTH = 3;

const GROUND_COLOR = "#8ab847";

let running = true;
let delta = 0;
let lastFrame = 0;
const pointerPoints = [];

const leafImgs = document.getElementsByClassName("leaf");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

class Leaf {
	constructor() {
		this.x = Math.floor(Math.random() * canvas.width);
		this.y = Math.floor(Math.random() * canvas.height);
		this.rotation = Math.random() * 2 * Math.PI;
		this.img = leafImgs[Math.floor(Math.random() * leafImgs.length)];
	}

	draw(ctx) {
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotation);
		ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
		ctx.resetTransform();
	}
}

const leaves = new Set();
let p = 0;

window.addEventListener("resize", updateCanvasSize);
canvas.addEventListener("pointermove", (event) => {
	pointerPoints.push([event.x, event.y]);
	while (pointerPoints.length > RAKE_DISTANCE_LENGTH) {
		pointerPoints.shift();
	}
	update()
});
window.addEventListener("load", () => {
	updateCanvasSize();
	for (let i = 0; i < LEAF_COUNT; i++) {
		leaves.add(new Leaf());
	}
	update();
});

function update() {
	ctx.fillStyle = GROUND_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	let path;
	if (pointerPoints.length >= 2) {
		path = new Path2D();
		path.moveTo(pointerPoints[0][0], pointerPoints[0][1]);
		for (let i = 1; i < pointerPoints.length; i++) {
			path.lineTo(pointerPoints[i][0], pointerPoints[i][1]);
		}
		ctx.lineWidth = 100;
		ctx.lineJoin = "round";
	}

	let pointer;
	let lastPointer;
	let thetap;
	if (path) {
		pointer = pointerPoints[pointerPoints.length - 1];
		lastPointer = pointerPoints[pointerPoints.length - 2];
		thetap = Math.atan2(pointer[0] - lastPointer[0], pointer[1] - lastPointer[1]);
		ctx.fillStyle = "#0000ff";
		ctx.translate(pointer[0], pointer[1]);
		ctx.rotate(-thetap);
		ctx.fillRect(-50, -5, 100, 10);
	}
	ctx.resetTransform();
	for (const leaf of leaves) {
		if (path && ctx.isPointInStroke(path, leaf.x, leaf.y)) {
			const thetalp = Math.atan2(pointer[0] - leaf.x, pointer[1] - leaf.y);
			const dlp = Math.hypot(pointer[0] - leaf.x, pointer[1] - leaf.y);
			const dl = Math.cos(thetalp - thetap) * dlp;
			leaf.x += Math.sin(thetap) * dl;
			leaf.y += Math.cos(thetap) * dl;
		}
		leaf.draw(ctx);
	}
}

function updateCanvasSize() {
	const rect = document.documentElement.getBoundingClientRect();
	canvas.width = rect.width;
	canvas.height = rect.height;
}
