const prompt = require("prompt-sync")();

const jsonbinioapi = require("jsonbin-io-api");
const api = new jsonbinioapi('$2b$10$QLT4jsyLtuPi4gua3QeR2e88eXu7SQHXDuhzZDlyEyrs04FNF9koa');

// start 
const start = async () => {
	while (true) {
		let command = prompt(">> ");

		if (command.split(" ")[0] == "del") {
			command = command.split(" ")
			command.shift();
			command = command.join(" ")

			await remove(command);
		}

		if (command.split(" ")[0] == "set") {
			command = command.split(" ")
			command.shift();
			amount = command.pop();
			command.join(" ");
			await set(command, parseInt(amount));
		}

		if (command == "list")
			await list()

		if (command == "exit")
			break;

		console.log("");
	}
};

const list = async () => {
	await api.readBin({
		id: "5f630d16302a837e9567ebf6",
		version: "latest"
	}).then(data => console.log(data));
};

// update score
const set = async (name, amount) => {
	data = await api.readBin({
		id: "5f630d16302a837e9567ebf6",
		version: "latest"
	});

	if (data.scores[name]) {
		data.scores[name] = amount;
		await api.updateBin({
			id: "5f630d16302a837e9567ebf6",
			data: data,
			versioning: false
		});
	} else {
		console.log(`there is no person with the name '${name}'`);
		return
	}
}

// delete score
const remove = async (name) => {
	data = await api.readBin({
		id: "5f630d16302a837e9567ebf6",
		version: "latest"
	});

	if (data.scores[name]) {
		delete data.scores[name];
		await api.updateBin({
			id: "5f630d16302a837e9567ebf6",
			data: data,
			versioning: false
		});
	} else {
		console.log(`there is no person with the name '${name}'`);
		return
	}
};

start();
