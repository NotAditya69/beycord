//Assigning Variables / Require
const Discord = require('discord.js');
const Eris = require("eris-additions")(require("eris"));
const fs = require('fs');
const { prefix } = require('dotenv').config();
require('dotenv').config();

//Eris CLient
const client = new Eris(process.env.TOKEN);
client.commands = new (Discord.Collection || Map)();
client.beys = new (Discord.Collection || Map)();
client.parts = new (Discord.Collection || Map)();
client.items = new (Discord.Collection || Map)();

//MongoDB Variables
const { MongoClient } = require("mongodb");
const mongo = new MongoClient(process.env.MONGOURL);

//Mongo Connect
mongo.connect((err) => {
	if(err) throw err;
	console.log("Connection to MongoDB database established successfully!");
});

//commandFiles
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name || command.help.name, command);
}

const db = mongo.db("main");

//async create message
client.on('messageCreate', async (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	
	message.reply = content => {
		client.createMessage(message.channel.id, `<@${message.author.id}>, ${content}`);
	}
	
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
	
	if(client.commands.has(command)) {
		try {
	   		let cmd = client.commands.get(command);
			cmd.run(client, message, args, prefix, {}, db);
		} catch (error) {
			console.error(error);
			message.reply('Something happened while trying to run this command :/');
		}
	}
});

//Connect client
client.on('ready', () => {
	console.log('Beycord is online!');
});

client.connect();
