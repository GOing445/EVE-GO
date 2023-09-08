// /member/:discordid
var fs = require('fs');
var ejs = require('../esi.js');

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
var app = require('express');
var server = require('http').createServer(app);
var io = require('socket.io')(server);


module.exports = function(req, res){
    //console.log("노말페이지");
    if(!req.user){
        res.redirect('/front');
        res.redirect('/front');
        return;
    }
    console.log(req.user.id==req.params.discordid);
    // console.log(req.user.data.isAdmin==true?"어드민임!":"어드민아님!");
    if(req.user.id!=req.params.discordid&&req.user.data.isAdmin==false){
        res.redirect('/');
        return;
    }
    var user = global.DB.users.get(req.params.discordid);
    let soketSecret = Date.now();
    // console.log(user);
    
    req.dataManager = new MyEmitter();
    // console.log('req.dataManager : ',req.dataManager);
    req.dataManager.emit('event','ㅅㅂ');
    chars = global.DB.chars.filter(char=>char.onwer == req.params.discordid);
    for(char of chars.array()){
        ejs.evecharupdateSOKET(char,req.dataManager,soketSecret);
    }
    // console.log(io);
    // console.log('chars',chars);
    res.render('html', {
        title: "GOing's server",
        body: "body.ejs",
        user: user,
        sess:req.user,
        eve_char : chars,
        soketSecret : soketSecret,
    });
    req.dataManager.on('refresh', function() {
        for( var char of userdata.eve_char ) {
            ejs.evecharupdateSOKET(char,req.dataManager);
        }
    });
    
    req.soketIO.on('connection', function(socket) {
        //console.log("으악");
        // 접속된 모든 클라이언트에게 메시지를 전송한다
        
        req.dataManager.on('event', function(charData) {
            //console.log("event called",charData);
            req.soketIO.emit(soketSecret, charData );
        });
        // force client disconnect from server
        socket.on('forceDisconnect', function() {
            socket.disconnect();
        })
        // 클라이언트로부터의 메시지가 수신되면
        req.soketIO.on('refresh', function() {
            req.dataManager.emit('refresh');
        });
        socket.on('disconnect', function() {
            console.log('user disconnected: ' + socket.name);
        });
    });
    
}