'use strict';
const Discord = require('discord.js');	//подключаем библиотеку для создания ботов дискорд
const Bot = new Discord.Client(); //подключаем бота
let config = require('./config.json'); //подключаем конфиг бота
let token = config.token;	//подключаем токен из конфига бота
let prefix = config.prefix;	//подключаем префикс из конфига бота
const Gamedig = require('gamedig');
Bot.on('ready', () => {
	console.log('Бот запущен:');
	Bot.generateInvite(["ADMINISTRATOR"]).then(link => {
		console.log(`${new Date()}`);
	});
}); //сообзение, выкидываемое на консоль, при запуске и входе бота на сервер дискорда
Bot.on('reconnecting', () => {
	    console.log('Reconnect!');
	});//сообщение, выкидываемое на консоль при при переподключении бота
Bot.on('disconnect', () => {
	console.log('Disconnect!');
});//сообщение, выкидываемое на консоль при отключении бота
Bot.on('message', msg =>{
  if (msg.author.bot) return;
  let args = msg.content.substring(prefix.length).split(" ");
    if(msg.content.startsWith(prefix+'game')){
        if(!args[1]|| ! args[2]){
            console.log();
            msg.channel.send
            ('Напишите через пробел название игры и сервер,который вам нужен, а если есть необходимость, третьим укажите порт');
        }
        
        var gameName = args[1],
            serverName = args[2],
            serverPort = null;
        if(args[3]){
            serverPort = args[3];
        }
        var gameState = Gamedig.query({
            type: gameName,
            host: serverName,
            port: serverPort
        });
        gameState.then((state) => {
            var gameInfo = state;

            var usefulInfo = {
                name: gameInfo.name,
                map: gameInfo.map,
                maxplayers: gameInfo.maxplayers,
                playersOnline: gameInfo.players.length,
                connect: gameInfo.connect,
                ping: gameInfo.ping
            };
            
            var stringGameInfo = JSON.stringify(usefulInfo);
            var responseText = '';
              for(var key=0;key<6;key++){
                responseText+=stringGameInfo.split(',')[key].concat('\n');
              }
              console.log(responseText);
              msg.channel.send(`${responseText}`);
        }).catch((error) => {
            console.log("Server is offline"+ error);
        });
        return;
    }
});
Bot.login(token);