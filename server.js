const fs = require("fs");
const { Pool, Client } = require("pg");
const Koa = require("koa");
const http = require("http");
const axios = require("axios");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

const pool = new Pool({
	connectionString: process.env.GOOD_DATABASE_URL,
	ssl: { rejectUnauthorized: false } // TODO
});

const settings = {
	buttonCD: 300,
	lbCount: 20
}

const remove = name => pool.query(`DELETE FROM leaderboard WHERE username = '${name}'`);

pool.query('SELECT * FROM leaderboard;', (err, res) => {
	let state = {start: 0, scores: res.rows};
	pool.query('SELECT * FROM state;', (err, res) => {
		state.start = res.rows[0].start;

		// main page
		router.get("/", (ctx, next) => {
			console.log("loading main page")
			ctx.type = "html";
			ctx.body = fs.createReadStream("public/index.html");
			next();
		});

		// admin page
		router.get("/admin", (ctx, next) => {
			ctx.type = "html";
			ctx.body = fs.createReadStream("public/admin.html");
			next();
		});

		// js code
		router.get("/button.js", (ctx, next) => {
			ctx.type = "js";
			ctx.body = fs.createReadStream("public/button.js");
			next();
		});

		// css code
		router.get("/style.css", (ctx, next) => {
			ctx.type = "css";
			ctx.body = fs.createReadStream("public/style.css");
			next();
		});

		// API route to get the current state of the game
		router.get("/api/state", (ctx, next) => {
			ctx.body = {start: state.start};
			next();
		});

		// API route to get the current state of the game
		router.get("/api/scores", (ctx, next) => {
			ctx.body = state.scores.sort((a, b) => b.score - a.score);
			next();
		});

		router.get("/api/execute/:query/:pass", async (ctx, next) => {
			if (ctx.params.pass === process.env.adminpass) {
				ctx.body = (await pool.query(ctx.params.query)).rows;
				await next();
				return;
			}

			ctx.body = "wrong password";

			await next();
		});

		// API route to press the button
		router.get("/api/press/:name", (ctx, next) => {
			const name = ctx.params.name;
			console.log(`name input: ${name}`);
			
			if (name.length > 20) {
				return;
			}

			const score = Math.floor(new Date().getTime() / 1000) - state.start;

			if (score < settings.buttonCD) {
				return;
			}

			if (!Boolean(/^[a-z0-9 ]+$/i.exec(name))) {
				return;
			}

			console.log(`${name} pressed the button for ${score} points`);

			// reset timer
			state.start = Math.floor(new Date().getTime() / 1000);
			pool.query(`UPDATE state SET start = ${state.start}`)

			if (!state.scores.find(e => e.username === name)) { // new person
				state.scores.push({username: name, score:score})
				console.log(state);
				pool.query(`INSERT INTO leaderboard VALUES ('${name}', ${score});`);
			} else { // old person
				// to little score, nothing changes
				if (state.scores.find(e => e.username === name).score > score) {
					return;
				}
				state.scores = state.scores.map((e) => e.username === name ? {username: e.username, score: score} : e);
				pool.query(`UPDATE leaderboard SET score = ${score} WHERE username = '${name}'`);
			}
			console.log(`${name} now has ${score} points`);

			ctx.body = "success";
			next();
		});

		// use middleware
		app.use(router.routes());
		app.use(router.allowedMethods());

		console.log("server up");
		// boot server
		http.createServer(app.callback()).listen(process.env.PORT || 3000);

	});
});