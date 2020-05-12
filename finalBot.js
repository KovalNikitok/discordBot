'use strict';
const Discord = require('discord.js');	//подключаем библиотеку для создания ботов дискорд
const Bot = new Discord.Client(); //подключаем бота
const config = require('./config.json');//подключаем конфиг бота с префиксом и токеном
const prefix = config.prefix;
const token = config.token;//токен прописать в конфиг
const ytdl = require('ytdl-core');//подключаем ytdl библиотеку, для работы с youtube 
const Gamedig = require('gamedig');//подклбчаем gamedig библиотеку, для парсинга информации с игровых серверов

const streamOptions={seek:0,volume:1};//устанавливаем настройки для звука при проигрывании аудио
var songs = {};//здесь храним список песен, которые "заказывают"

Bot.on('ready', () => {
	console.log('Бот запущен:');
	Bot.generateInvite(["ADMINISTRATOR"]).then(link => {
		console.log(`${new Date()}`);
	});
}); //сообщение, выкидываемое на консоль, при запуске и входе бота на сервер дискорда
Bot.on('reconnecting', () => {
	    console.log('Reconnect!');
	});//сообщение, выкидываемое на консоль при переподключении бота
Bot.on('disconnect', () => {
	console.log('Disconnect!');
});//сообщение, выкидываемое на консоль при отключении бота

Bot.on('message',async message => {

   if (message.author.bot) return;
   let args = message.content.substring(prefix.length).split(" ");
   
     switch (args[0]) {
        case 'play':
            async function play(connection, message){
                var song = songs[message.guild.id];
                var stream = ytdl(song.queue[0],{filter:"audioonly"});

                song.dispatcher = connection.play(stream,streamOptions);
                song.queue.shift();
                song.dispatcher.on("end", function(){
                    if(songs.queue[0]){
                        message.channel.send(`Трэк ${names} добавлен!`);
                        play(connection, message);
                    } else{
                        connection.disconnect();
                    }
                }).on("error", err =>{
                     console.log('Error of play stream: '+ error);
                     play(connection,message);
                     return;
                   });    
            }

            if(!message.member.voice.channel){
                message.channel.send('Нужно находиться в голосовом канале!');
                return;
            }

            if(!args[1] || !args[1].startsWith("https://www.youtube.com/watch?v=")){
                message.channel.send('Нужна youtube - ссылка!');
                return;
            }

            if(!songs[message.guild.id]) songs[message.guild.id] ={
                queue: []
            }

            var song = songs[message.guild.id];
            
            song.queue.push(args[1]);
            
            if (!message.guild.voiceConnection){
                try{
                message.member.voice.channel.join().
                    then(function(connection){
                        message.channel.send(`Понеслась!`);
                        play(connection, message);                    
                    });
                }catch(err){
                    console.log("Error of trying to play: "+err);
                }
            }
            break;
			
        case 'stop':
            var song = songs[message.guild.id];
            try{
                if(song.dispatcher){
                    for (var i=song.queue.length-1; i>=0; i--){
                        song.queue.splice(i, 1);
                    }
                    song.dispatcher.end();
                    console.log("Music stopped!");
                    message.channel.send("Работа остановлена!");
                    if(message.guild.voice.channel) message.guild.voice.connection.disconnect();
                }
            } catch(err){
                console.log("Skip error: "+err);
                return;
              }           
          break;

        case 'game':
            if(!args[1]|| ! args[2]){
                console.log();
                message.channel.send
                ('Напишите через пробел название игры и сервер,который вам нужен, а также, если есть необходимость, третьим укажите порт');
                return;
            }     
            var gameName = args[1];
		    var serverName = args[2];
		    var serverPort = null;

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
                responseText=responseText.substring(1,responseText.length-2);
                message.channel.send(`${responseText}`);
                console.log(responseText);

            }).catch((error) => {
                console.log("Error: "+ error);
                return;
            });
        break;
        		  
        case 'привет':
            message.reply("Здаров!");
            break;
			
        case 'пока':
            message.reply("Ага, бывай!");
            break;
     }
});
Bot.login(token);   