'use strict';
const Discord = require('discord.js');	//подключаем библиотеку для создания ботов дискорд
const Bot = new Discord.Client(); //подключаем бота
let config = require('./config.json'); //подключаем конфиг бота
let token = config.token;	//подключаем токен из конфига бота
let prefix = config.prefix;	//подключаем префикс из конфига бота
const ytdl = require('ytdl-core');
const Gamedig = require('gamedig');
const streamOptions={seek:0,volume:1};
var songs = {};
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
                message.member.voice.channel.join().
                    then(function(connection){
                        message.channel.send(`Понеслась!`);
                        play(connection, message);                    
                    });
            }
            break;
        // case 'play+':
        //     var song = songs[message.guild.id];
        //     try {
        //         song.queue.push(args[1]);
        //         message.channel.send('Ваш трэк добавлен в очередь.');
        //     } catch(err){
        //         console.log("Play+ error: "+err);
        //       }
        //     break;

        // case 'skip':
        //         var song = songs[message.guild.id];
        //         try{
        //             if(song.dispatcher) song.dispatcher.end();
        //                 console.log("Track skipped!");
        //                 console.log(`Tracks: ${args.length}`);
        //                 play(connection,message);
        //         } catch(err){
        //             console.log("Skip error: "+err);
        //         }
        //     break;

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
                    if(message.guild.voice.channel) message.guild.voiceConnection.disconnect();
                }
            } catch(err){
                console.log("Skip error: "+err);
              }           
          break;
        case 'привет':
            message.reply("Здаров!");
            break;
        case 'пока':
            message.reply("Ага, бывай!");
            break;
     }
});
Bot.on('message', msg =>{
    if (msg.author.bot) return;
    let args = msg.content.substring(prefix.length).split(" ");
      if(msg.content.startsWith(prefix+'game')){
          if(!args[1]|| ! args[2]){
              console.log();
              msg.channel.send
            ('Напишите через пробел название игры и сервер,который вам нужен, а также, если есть необходимость, третьим укажите порт');
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