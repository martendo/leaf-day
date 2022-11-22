"use strict";

const FPS = 30;
const TIMESTEP = 1000 / FPS;

const BORDER_SIZE = 20;
const LEAF_COUNT = 300;
const RAKE_DISTANCE_LENGTH = 10;

const GROUND_COLOR = "#8ab847";
const PILE_COLOR = "#a67b1a";
const PILE_BORDER_COLOR = "#846011";

let tryNum = 0;
let isTextboxOpen = false;
const text = [
	[2, "<strong><em>Leaf Day</em></strong><br><br>Click this box to advance text."],
	[0, "“Hey. It’s Leaf Day.”"],
	[1, "“Leaf Day?”"],
	[0, "“Time to rake the leaves, silly.<br>Look at them, they’re all over the place.”"],
	[1, "“Ugh, really? Raking leaves? Why do I have to do that?”"],
	[0, "“Who else is gonna beat my record?”"],
	[1, "“…Record?”"],
	[2, "Rake the leaves into a pile inside of the top-left circle!<br>Click and drag to use your rake."],
	[2, "Avoid raking away the flowers!"],
	null,
	[0, "“You call that fast?”"],
	[1, "“Was it supposed to be?”"],
	[0, "“Of course! You’re not gonna beat my record like <em>that</em>!<br>Try it again. You’ll get there.”"],
	reset,
	[1, "“Where’d these leaves come from? I thought I just got rid of them all!”"],
	[0, "“No, you never get rid of them.<br>They come back all the time."],
	[0, "“They’re natural, you know.<br>You need to learn how to live with them."],
	[0, "“We’re just moving them into the same spot, where they’ll be more organized. That’s all."],
	[0, "“It’s better for them because they won’t have to be all over the place on our grass."],
	[0, "“Alright now, go ahead, I don’t have all day.”"],
	null,
	[0, "“Hmm…”"],
	[1, "“Ha! Beat your record!”"],
	[0, "“Well, it, uh… looks like…”"],
	newSpot,
	[0, "“…you missed a spot!”"],
	[1, "“Hey, I got that spot! What are you talking about?!”"],
	[0, "“Nope. Missed it. Disqualified.<br>Good job though, with the leaves and all."],
	[0, "“Wanna do the back too?”"],
	[1, "“Not really…”"],
	[0, "“Great! Let’s go.”"],
	reset,
	[1, "“Do you not like normal-shaped piles of leaves?”"],
	[0, "“What’s normal for a pile of leaves?”"],
	[1, "“Well I dunno, the first one was alright.”"],
	[0, "“Why are you always so picky? They’re leaves.<br>You know what kind of pile I found your clothes in the other day?"],
	[0, "“Leaves. Just get them to the same spot.”"],
	null,
	[0, "“That was pretty good, actually.”"],
	[1, "“Just pretty good? I must’ve beaten your record.”"],
	[0, "“Yeah, alright, you did. You’re the champion of leaf-raking now, I guess.”"],
	[1, "“Yeah!!”"],
	[0, "“They’re just leaves, you know.”"],
	[1, "“Then why’d you make such a big deal out of them?”"],
	[0, "“Got you to do all my yard work. Thanks!”"],
	[2, "The End"],
	reset
];
const rakedFlowerText = [
	[0, "“Hey, watch where you’re raking! That was a nice flower!"],
	[0, "“If you like raking so much, I’ve got some more leaves for you!”"],
	moreLeaves
];

let running = true;
let delta = 0;
let lastFrame = 0;
let isPointerDown = false;
const pointerPoints = [];

const timer = document.getElementById("timer");
let timerInterval;
let time = 0;

const leafImgs = document.getElementsByClassName("leaf");
const flowerImgs = document.getElementsByClassName("flower");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const textbox = document.getElementById("textbox");

class Flower {
	constructor() {
		do {
			this.x = Math.floor(Math.random() * (canvas.width - BORDER_SIZE * 2)) + BORDER_SIZE;
			this.y = Math.floor(Math.random() * (canvas.height - BORDER_SIZE * 2)) + BORDER_SIZE;
		} while (ctx.isPointInPath(pile, this.x, this.y));
		this.img = flowerImgs[Math.floor(Math.random() * flowerImgs.length)];
		this.circle = new Path2D();
		this.circle.arc(this.x, this.y, 75, 0, 2 * Math.PI);
	}

	draw(ctx) {
		ctx.drawImage(this.img, this.x - this.img.width / 2, this.y - this.img.height / 2);
	}
}

class Leaf {
	constructor(xmin = null, xmax = null, ymin = null, ymax = null) {
		xmin = xmin || BORDER_SIZE;
		xmax = xmax || canvas.width - BORDER_SIZE;
		ymin = ymin || BORDER_SIZE;
		ymax = ymax || canvas.height - BORDER_SIZE;
		do {
			this.x = Math.floor(Math.random() * (xmax - xmin)) + xmin;
			this.y = Math.floor(Math.random() * (ymax - ymin)) + ymin;
		} while (ctx.isPointInPath(pile, this.x, this.y) || Array.from(flowers).some((flower) => ctx.isPointInPath(flower.circle, this.x, this.y)));
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
const flowers = new Set();
let pile = new Path2D();
pile.arc(200, 200, 100, 0, 2 * Math.PI);

function initLeaves(clear = true) {
	if (clear) {
		flowers.clear();
		for (let i = 0; i < tryNum * 2 + 3; i++) {
			flowers.add(new Flower());
		}
		leaves.clear();
	}
	for (let i = 0; i < LEAF_COUNT; i++) {
		leaves.add(new Leaf());
	}
}

window.addEventListener("resize", () => {
	updateCanvasSize();
	update();
});
canvas.addEventListener("pointermove", pointermove);
canvas.addEventListener("pointerdown", (event) => {
	isPointerDown = true;
	pointermove(event);
});
canvas.addEventListener("pointerup", () => {
	isPointerDown = false;
	pointerPoints.length = 0;
	purgeLostLeaves();
	update();
});
textbox.addEventListener("click", textboxNext);
window.addEventListener("load", () => {
	updateCanvasSize();
	initLeaves();
	update();
	updateTimer();
	textboxNext();
});

function pointermove(event) {
	if (isPointerDown) {
		pointerPoints.push([event.x, event.y]);
		while (pointerPoints.length > RAKE_DISTANCE_LENGTH) {
			pointerPoints.shift();
		}
	}
	update();
}

function update() {
	ctx.fillStyle = GROUND_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = PILE_COLOR;
	ctx.fill(pile);
	ctx.strokeStyle = PILE_BORDER_COLOR;
	ctx.lineWidth = 5;
	ctx.stroke(pile);

	let path;
	if (!isTextboxOpen && pointerPoints.length >= 2) {
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
		let i = 2;
		do {
			lastPointer = pointerPoints[pointerPoints.length - i];
		} while (i++ < pointerPoints.length && (Math.abs(pointer[0] - lastPointer[0]) < 5 || Math.abs(pointer[1] - lastPointer[1]) < 5));
		thetap = Math.atan2(pointer[0] - lastPointer[0], pointer[1] - lastPointer[1]);
		ctx.fillStyle = "#0000ff";
		ctx.translate(pointer[0], pointer[1]);
		ctx.rotate(-thetap);
		ctx.fillRect(-50, -5, 100, 10);
	}
	let isAnyOutside = isTextboxOpen;
	ctx.resetTransform();
	for (const leaf of leaves) {
		if (path && ctx.isPointInStroke(path, leaf.x, leaf.y)) {
			const thetalp = Math.atan2(pointer[0] - leaf.x, pointer[1] - leaf.y);
			const dlp = Math.hypot(pointer[0] - leaf.x, pointer[1] - leaf.y);
			const dl = Math.cos(thetalp - thetap) * dlp;
			leaf.x += Math.sin(thetap) * dl;
			leaf.y += Math.cos(thetap) * dl;
		}
		if (!isAnyOutside && !ctx.isPointInPath(pile, leaf.x, leaf.y)) {
			isAnyOutside = true;
		}
		leaf.draw(ctx);
	}
	for (const flower of flowers) {
		if (path && ctx.isPointInStroke(path, flower.x, flower.y)) {
			flowers.delete(flower);
			text.unshift(...rakedFlowerText);
			isAnyOutside = false;
			continue;
		}
		flower.draw(ctx);
	}

	if (tryNum < 3 && !isAnyOutside) {
		textboxNext();
	}
}

function purgeLostLeaves() {
	for (const leaf of leaves) {
		if (leaf.x < -5 || leaf.x >= canvas.width + 5 || leaf.y < -5 || leaf.y >= canvas.height + 5) {
			leaves.delete(leaf);
		}
	}
}

function reset() {
	pile = new Path2D();
	if (tryNum == 0) {
		pile.rect(100, 100, 75, 75);
	} else if (tryNum == 1) {
		pile.moveTo(200, 100);
		pile.lineTo(240, 80);
		pile.lineTo(230, 110);
		pile.lineTo(260, 120);
		pile.lineTo(230, 130);
		pile.lineTo(220, 170);
		pile.closePath();
	}
	tryNum++;
	initLeaves();
	update();
	time = 0;
	updateTimer();
	textboxNext();
}

function newSpot() {
	for (let i = 0; i < 25; i++) {
		leaves.add(new Leaf(300, 500, 300, 500));
	}
	update();
	textboxNext();
}

function moreLeaves() {
	initLeaves(false);
	update();
}

function updateCanvasSize() {
	const rect = document.documentElement.getBoundingClientRect();
	canvas.width = rect.width;
	canvas.height = rect.height;
}

function textboxNext() {
	const newText = text.shift();
	if (newText && typeof newText !== "function") {
		isTextboxOpen = true;
		textbox.style.display = "";
		textbox.style.color = "";
		if (newText[0] == 0) {
			textbox.style.textAlign = "";
		} else if (newText[0] == 1) {
			textbox.style.textAlign = "right";
		} else {
			textbox.style.textAlign = "center";
			textbox.style.color = "#707070";
		}
		textbox.innerHTML = newText[1];
		clearInterval(timerInterval);
	} else {
		isTextboxOpen = false;
		textbox.style.display = "none";
		if (newText) {
			newText();
		} else {
			timerInterval = setInterval(() => {
				time++;
				updateTimer();
			}, 1000);
		}
	}
}

function updateTimer() {
	let seconds = time % 60;
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	timer.textContent = Math.floor(time / 60) + ":" + seconds;
}
