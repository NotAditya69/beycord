//Required
const Discord = require('discord.js');
const Eris = require("eris-additions")(require("eris"));
const fs = require('fs');
const prefix = ";";
require('dotenv').config();

//Eris CLient
const client = new Eris(process.env.TOKEN, {restMode:true});
client.commands = new (Discord.Collection || Map)();
client.beys = new (Discord.Collection || Map)();
client.parts = new (Discord.Collection || Map)();
client.items = new (Discord.Collection || Map)();
client.spawns = new (Discord.Collection || Map)();

//MongoDB Connect
const { MongoClient } = require("mongodb");
const mongo = new MongoClient(process.env.MONGOURL, {useUnifiedTopology: true})
mongo.connect((err) => {
    if(err) throw err;
    console.log("Connection to MongoDB database established successfully!");
});

//Command Handler
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name || command.help.name, /*command.aliases || command.help.aliases,*/ command);
}

//Spawn Handler
const spawnFiles = fs.readdirSync(`./systems`).filter(file => file.endsWith("js") && file !== "bosssystem.js");
for(const file of spawnFiles){
    const spawn = require(`./systems/${file}`)
    client.spawns.set(spawn.name || spawn.help.name, spawn)
}


//Bey Handler
const beyFiles = fs.readdirSync('./beys').filter(file => file.endsWith(".js") && file !== ".gitignore" && file !== "Beyblade.js");
for (const file of beyFiles) {
    const bey = require(`./beys/${file}`);
    const beyc = new bey("1","1");
    client.beys.set(beyc.name, bey);
}


//Item Handler
const itemFiles = fs.readdirSync('./items').filter(file => file.endsWith(".js") && file !== "Part.js" && file !== "Beyblade.js" && file !== "Quest.js");
for (const file of itemFiles) {
    const item = require(`./items/${file}`);
    client.items.set(item.name || item.help.name, item);
}

//On Message Sent
client.on('messageCreate', async (message) => {
    const db = mongo.db("main");
//RNG
    const testForNumber = Math.floor(Math.random() * 30);
    const available = ["Ace Dragon"]
    if(testForNumber == 0) {
        try {
            client.spawns.get('spawnsystem').run(message, prefix, db, available, client);
    } catch (error) {
        let now = new Date();
  let startembed = new Discord.MessageEmbed()
  .setTitle('Failed to spawn')
  .setDescription(error)
  .setColor("#fa2c2c")
  .setTimestamp()
  message.channel.createMessage({embed:startembed});
  console.log(error);
    }}

//Command Handler Pt.2
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
            message.reply(`something happened while trying to run this command. Try again later?`);
        }
    }
});

//Connect client
client.on('ready', () => {
    console.log('Beycord is online.');
    client.editStatus({name: ";help - beycord.xyz"});
});
client.connect();