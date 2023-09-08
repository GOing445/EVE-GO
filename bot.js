var Logger = require('./logger');
const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");
var esi = require('./esi');
var DB = require('./database.js');


var junchi = false;
var isSunbi = false;

function commandIs(str, msg){
    return msg.content.startsWith("!" + str);
}

function userFind(usernic,message){
    var memberArr = message.channel.members.array()
    for(var i=0;i<memberArr.length;i++){
        if(memberArr[i].user.username.indexOf(usernic)!=-1){
            return memberArr[i];
        }
    }
    return false;    
}

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+'시간'+minutes+'분'+seconds+'초';
    return time;
}

client.on('ready', () => {
    console.log("bot is Online!");
});

client.on('message', message => {
    var data = new String();
    var date = new Date();
    data = message.content.toString();
    //var logContent = message.content.toString().replace();
    var dateString = "[" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDay() + " | " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]";

    console.log(dateString + message.author.username + " : " + data);

    if(data.startsWith("!")){
        if(message.author.bot === false){
            if(commandIs("help",message)){
                message.channel.sendMessage("그런거읍다");
            }
            else if(commandIs("정치",message)){
                if(message.member.hasPermission("ADMINISTRATOR")==false){
                    message.reply("이 명령어는 어드민 전용입니다.");
                }
                else if(junchi == false){
                    message.reply("정치질을 시작합니다.");
                    junchi = true;
                }else{
                    message.reply("정치질을 그만둡니다.");
                    junchi = false; 
                }
            }
            else if(commandIs("소라고둥",message)){
                var questionArr = message.content.toString().split(" "); 
                var answerArr = new Array("아니","아마도","그래","해봐","가끔씩은..?","지랄마","개소리하지마","(한숨)");
                if(questionArr.length>=2){
                    message.reply(answerArr[Math.floor(Math.random()*answerArr.length)]);
                }
                else{
                    message.reply("질문이 없으면 대답해줄수 없어.");
                }
            }
            else if(commandIs("사상검증",message)){
                var questionArr = message.content.toString().split(" "); 
                var answerArr = new Array("암크","###","스파이","트루 샨샤 노예");
                if(questionArr.length>=2){
                    message.reply(answerArr[Math.floor(Math.random()*answerArr.length)]);
                }
                else{
                    message.reply("질문이 없으면 대답해줄수 없어.");
                }
            }
            else if(commandIs("uptime",message)){
                var time = process.uptime();
                var uptime = (time + "").toHHMMSS();
                message.reply("서버가 켜진지 "+uptime+" 지났습니다.");
            }
            else if(commandIs("user",message)){ //특정유저 아이디 알아내기
                //message.reply(isAdmin(message.author.id));

                var argsArr = new Array; 
                argsArr = message.content.toString().split(" ");
                
                var arrayt = message.channel.members.array()
                //for(var i=0;i<arrayt.length;i++) console.log("["+i+"] "+arrayt[i].user.username+":"+typeof(arrayt[i]));
                if(userFind(argsArr[1],message)!=false){
                    var find = userFind(argsArr[1],message);
                    message.reply(find.user.username+":"+find.user.id)
                }
                else{
                    message.reply("해당유저를 찾을수 없었습니다.")
                }
            }
            else if(commandIs("esi_modulecheck",message)){ // esi 모듈체킹
                //message.reply(isAdmin(message.author.id));

                esi.newModule(message.content.replace('!esi_modulecheck ',''));
            }
            else if(commandIs("list",message)){
                var Output = "\n";
                var memberArr = message.channel.members.array()
                for(var i=0;i<memberArr.length;i++){
                    Output+="["+(i+1)+"]"+memberArr[i].user.username+" : "+memberArr[i].user.id+"\n";
                }
                message.reply(Output);
            }
            else if (commandIs("state", message)) {
                console.log(message.channel);
                message.reply("\n"+message.channel.name+"\n"+message.channel.guild.name);
            }
            else if (commandIs("NSFW",message)){
                var role = { //first you pass the id OR the member OR the user OR a role
                    VIEW_CHANNEL: true, //you set the perms that you want to overwrite
                    SEND_MESSAGES: true,
                    READ_MESSAGE_HISTORY: true,
                    ATTACH_FILES: true,
                    ADD_REACTIONS: true,
                    EMBED_LINKS: true,
                    MENTION_EVERYONE: true,
                    USE_EXTERNAL_EMOJIS: true,
                };

                message.guild.channels.find('name', '수용소').overwritePermissions(message.member, role);
                message.guild.channels.find('name', 'nsfw').overwritePermissions(message.member, role);
                
            }
            else if(commandIs("shutdown",message)){
                if(message.member.hasPermission("ADMINISTRATOR")==false){
                    message.reply("이 명령어는 어드민 전용입니다.");
                }
                return fuck[1][2][3]/2/3/4/5/6/7;
            }
            else if(commandIs("memberlist",message)){
                if(message.member.hasPermission("ADMINISTRATOR")==false){
                    message.reply("이 명령어는 어드민 전용입니다.");
                }
                return DB.handleDisconnect();
            }
            else{
                message.reply("없는 명령어입니다.");
            }
        }
    }
});

client.login('###############################');

Discord.Client.prototype.isUserHavePermission = function(server_id,user_id,permission_id){
    try{
        var server = this.guilds.get(server_id);
        var user = server.members.get(user_id);
        // console.log(server.id);
        // onsole.log(user._roles.find(role=>{return role==permission_id;}));
        if(user._roles.find(role=>{return role==permission_id;})==permission_id){
            return true;
        }
        else{
            return false;
        }
    }
    catch(e){
        console.error(e);
        return false;
    }
}

Discord.Client.prototype.findUserFromID = async function(User_ID,Server_IDs){
    let client = this;
    return new Promise(function(resolve, reject) {
        try{
            for(Server_ID of Server_IDs){
                var server = client.guilds.get(Server_ID);
                let user = server.members.get(User_ID)
                // console.log(user);
                if(user !== undefined)resolve(user);
            }
        }
        catch(e){
            console.error(e);
            reject(e);
        }
});
}

module.exports = client;