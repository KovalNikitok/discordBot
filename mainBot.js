'use strict';
const Discord = require('discord.js');	//подключаем библиотеку для создания ботов дискорд
//const YoutubeDl= require('youtube-dl.js');
const Bot = new Discord.Client(); //подключаем бота
let config = require('./config.json'); //подключаем конфиг бота
let token = config.token;	//подключаем токен из конфига бота
let prefix = config.prefix;	//подключаем префикс из конфига бота
const ytdl = require('ytdl-core');
const queue = new Map();
const streamOptions={seek:0,volume:1};
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
	Bot.on('message',async msg => {
//обработчик запросов от пользователя ботом	
		if (msg.author.bot) return;
		const servQue = queue.get(msg.guild.id);
	
		if (msg.content.startsWith(prefix+'play')) {
			execute(msg, servQue);
			return;
		} else if (msg.content.startsWith(prefix+'skip')) {
			skip(msg, servQue);
			return;
		} else if (msg.content.startsWith(prefix+'stop')) {
			stop(msg, servQue);
			return;
		} else if (msg.content.startsWith(prefix+'привет')){
			msg.reply('Хай!');
			return;
		} else if (msg.content.startsWith(prefix+'пока')){
			msg.reply('Ага, бывай!');
			return;
		} else {
			msg.channel.send('Такой комманды не существует!')
			return;
		}
	});

//функция для захода бота в голосовой канал и проигрывания музыки
	async function execute(message, servQue) { 	
		const args = message.content.split(' ');
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) return message.channel.send('Зайди в голосовой канал!'); //проверка на присутствие в голосовом чате пользователя
		if (!message.guild) return; //проверка на присутствие в гильдии пользователя
		if(!args[1]|| !args[1].startsWith("http")) { //проверка на то, является ли введённое пользователем сообщение ссылкой
			message.channel.send('Укажите ссылку!');
			console.log('It isn\'t link!');
			return;
		}
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) { //Проверка на доступ к каналу/разговору для бота
			return message.channel.send('У меня нет прав для подключения или разговора в вашем голосовом канале!');
		}
		const musicInfo = await ytdl.getInfo(args[1]); //присвоение youtube информации(название видео,ссылка)
		const music = { //создаём объект для хранения информации о музыке и дальнейшего воспроизведения её с ресурса youtube
			title : musicInfo.title,
			url : musicInfo.video_url,
		};
		if(!servQue){
			const QueContruct = {//создаём контракт для добавления музыки 
				msgChannel : message.Channel,
				voiceChannel : voiceChannel,
				musics : [],
				connection : null,
				volume : 1,
				playing : true,
			};
			queue.set(message.guild.id, QueContruct);
			QueContruct.musics.push(music);
			try {
				var connection= await voiceChannel.join();
				QueContruct.connection = connection;
				play(message.guild, QueContruct.musics[0]);
				message.channel.send('Музыка влетает!');
			} catch (error){
				console.log('Connection to voice chat error: '+error);
				queue.delete(message.guild.id);
				return message.channel.send('Возникла ошибка: '+error);
			}
		} else { 
			servQue.musics.push(music); //Если песня уже есть, то добавляем новую в очередь
			console.log(`${music.title} added to a list`);
			return message.channel.send(`Ваш ${music.title} добавлен в очередь.`);
		}
	}
//	Функция проигрывания музыки
	function play(guild, music){
		const servQue = queue.get(guild.id);
		if(!music){ //если 
			servQue.voice.channel.leave();
			queue.delete(guild.id);
			console.log('Music delete in a phase of playing!');
			return;
		}
		console.log(music.url);
		try{
			const stream = ytdl(music.url,{filter:"audioonly"});
		if(!music.url) stream = ytdl(music.title,{filter:"audioonly"});
		servQue.musics.shift();
		const dispatcher = servQue.connection.play(stream,streamOptions)//Запускаем поток для проигрывания песни с youtube по ссылке
			.on('end', function() {
				console.log(`Music  ${music.title} is end!`);
				play(guild,servQue.musics[0]);
		})	.on('error', error =>{
				console.log('Error of play stream: '+ error);
				return;
		});
		} catch(err){
			console.log('Play error: '+err);
			return;
		}
	}
	function skip(msg, servQue){
		try{
			if(!servQue){
				return msg.channel.send('Очередь пуста, нечего пропускать.');
			}	play(msg.guild,servQue.musics[0]);
		} catch(err){
			msg.channel.send('Пропустить не вышло!');
			console.log('Skip error: '+err);
			return;
		}
	}
	function stop(msg, servQue){
		try{
				servQue.musics = [];
				servQue.dispatcher.disconnect();
				msg.guild.id.voiceConnection.disconnect();
		} catch (err){
			msg.channel.send('Приостановить не удалось!');
			console.log('Stop error: '+err);
			return;
		}
	}	
Bot.login(token);