'use strict';
const Discord = require('discord.js');	//���������� ���������� ��� �������� ����� �������
const Bot = new Discord.Client(); //���������� ����
let config = require('./config.json'); //���������� ������ ����
let token = config.token;	//���������� ����� �� ������� ����
let prefix = config.prefix;	//���������� ������� �� ������� ����
const ytdl = require('ytdl-core');
const Gamedig = require('gamedig');
const streamOptions={seek:0,volume:1};
var songs = {};
Bot.on('ready', () => {
	console.log('��� �������:');
	Bot.generateInvite(["ADMINISTRATOR"]).then(link => {
		console.log(`${new Date()}`);
	});
}); //���������, ������������ �� �������, ��� ������� � ����� ���� �� ������ ��������
Bot.on('reconnecting', () => {
	    console.log('Reconnect!');
	});//���������, ������������ �� ������� ��� ��� ��������������� ����
Bot.on('disconnect', () => {
	console.log('Disconnect!');
});//���������, ������������ �� ������� ��� ���������� ����

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
                        message.channel.send(`���� ${names} ��������!`);
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
                message.channel.send('����� ���������� � ��������� ������!');
                return;
            }

            if(!args[1] || !args[1].startsWith("https://www.youtube.com/watch?v=")){
                message.channel.send('����� youtube - ������!');
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
                        message.channel.send(`���������!`);
                        play(connection, message);                    
                    });
            }
            break;
        // case 'play+':
        //     var song = songs[message.guild.id];
        //     try {
        //         song.queue.push(args[1]);
        //         message.channel.send('��� ���� �������� � �������.');
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
                    message.channel.send("������ �����������!");
                    if(message.guild.voice.channel) message.guild.voiceConnection.disconnect();
                }
            } catch(err){
                console.log("Skip error: "+err);
              }           
          break;
        case '������':
            message.reply("������!");
            break;
        case '����':
            message.reply("���, �����!");
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
            ('�������� ����� ������ �������� ���� � ������,������� ��� �����, � �����, ���� ���� �������������, ������� ������� ����');
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