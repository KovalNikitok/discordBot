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
    //бот ожидает сообщение для запуска функции

   if (message.author.bot) return; 
   // если бот читает своё же сообщение, или от другого бота, то функция не выполнится
   let args = message.content.substring(prefix.length).split(" ");
   //разделяем сообщение на вид: "сообщение без префикса" + другие команды через пробел
   
     switch (args[0]) {//по первому слову после префикса
        case 'play':
            async function play(connection, message){//позволяет выполнять функцию play асинхронно(для добавления в список)
                var song = songs[message.guild.id];//добавляем в список аудио новый элемент
                var stream = ytdl(song.queue[0],{filter:"audioonly"});//получаем доступ на youtube по объекту

                song.dispatcher = connection.play(stream,streamOptions);//запускаем поток для проигрывания аудио
                song.queue.shift(); //выкидываем нынешнюю песню из списка
                song.dispatcher.on("end", function(){//при завершении аудио входим в эту функцию
                    if(songs.queue[0]){ //если в списке аудио есть элемент
                        message.channel.send(`Трэк ${names} добавлен!`); //сообщение в канал дискорда
                        play(connection, message);//вызываем рекурсию
                    } else{
                        voice.connection.disconnect();//если в списке ничего нет, то выбрасываем бота с канала
                    }
                }).on("error", err =>{//при ошибке
                    message.channel.send('Не вышло добавить трэк!');
                    console.log('Error of play stream: '+ error);
                    return;
                });    
            }

            if(!message.member.voice.channel){//если выдавший запрос в чате не в голосовом канале
                message.channel.send('Нужно находиться в голосовом канале!');
                return;
            }

            if(!args[1] || !args[1].startsWith("https://www.youtube.com/watch?v=")){
                message.channel.send('Нужна youtube - ссылка!');
                return;
            }//если сообщение не содержит ничего или не начинается с ссылки на youtube

            if(!songs[message.guild.id]) songs[message.guild.id] ={
                queue: []
            }//если ещё на задан список песен-создаём(преимущественно на первой итерации)

            var song = songs[message.guild.id];//создаём переменную и передаём список ^
            song.queue.push(args[1]); //забиваем аудио в список
            
            if (!message.guild.voice.connection){//если бот не в голосовом чате
                try{
                message.member.voice.channel.join().
                    then(function(connection){
                        message.channel.send(`Понеслась!`);
                        play(connection, message);                    
                    });//бот заходит в голосовой чат и запускает функцию play
                }catch(err){
                    console.log("Error of trying to play: "+err);
                }
            }
            break;
			
        case 'stop':
            var song = songs[message.guild.id];
            try{
                if(song.dispatcher){//если проигрывается
                    for (var i=song.queue.length-1; i>=0; i--){
                        song.queue.splice(i, 1);//удаляем из списка песню, что находится в очереди
                    }
                    song.dispatcher.end();//закрываем аудио поток
                    console.log("Music stopped!");
                    message.channel.send("Работа остановлена!");
                    if(message.guild.voice.channel) 
                        message.guild.voice.connection.disconnect();
                        //если бот ещё не покинул голосовой канал, то сделает это
                }
            } catch(err){
                message.channel.send("Не смог остановить \\_(o.o)_/");
                console.log("Skip error: "+err);
                return;
              }           
          break;

        case 'game':
            if(!args[1]|| ! args[2]){//если нет названия игры или сервера
                console.log();
                message.channel.send
                ('Напишите через пробел название игры и сервер,который вам нужен, а также, если есть необходимость, третьим укажите порт');
                return;
            }     
            var gameName = args[1];
		    var serverName = args[2];
		    var serverPort = null;

            if(args[3]){//если есть порт, то он будет добавлен к объекту
               serverPort = args[3];
            }

            var gameState = Gamedig.query({
               type: gameName,
               host: serverName,
               port: serverPort
            });

            gameState.then((state) => {
                var gameInfo = state;

                var usefulInfo = {//создаём json
                    name: gameInfo.name,
                    map: gameInfo.map,
                    maxplayers: gameInfo.maxplayers,
                    playersOnline: gameInfo.players.length,
                    connect: gameInfo.connect,
                    ping: gameInfo.ping
                };
                var stringGameInfo = JSON.stringify(usefulInfo);//обращаем json в строку
                var responseText = '';              
                for(var key=0;key<6;key++){
                    responseText+=stringGameInfo.split(',')[key].concat('\n');
                }//приводим строку к удобному нам виду
                responseText=responseText.substring(1,responseText.length-2);
                message.channel.send(`${responseText}`);
                console.log(responseText);

            }).catch((error) => {
                message.channel.send('Что-то пошло не так...');
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