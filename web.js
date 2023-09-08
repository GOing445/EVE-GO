console.log(process.versions);

var Logger = require('./logger');
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var session = require('express-session');
var crypto = require('crypto');
// let morgan = require('morgan');
var fs = require("fs");
var ejs = require('ejs');
global.Discordbot = require('./bot');
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);
var request = require("request");

global.apiToken = ["yCcVxpNFGcgkhPF7RnaKLtabh5T"];

var port = 80;

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}

// app.use(morgan({}));

//DB해버리기~
var DB = require('./database');

global.hosturl = "http://g-g.asuscomm.com";
// global.hosturl = `http://127.0.0.1:${port}`;

global.DiscordServerID = ["358234877679632394","525912172908380191"];

global.DB_ypeIDs = JSON.parse(fs.readFileSync(__dirname+'/data/type_ID.json', 'utf8'));
if(global.DB_ypeIDs[3418].name == "Capacitor Management")console.log("TypeID is OK");
else console.log("TypeID is Broken!!");
//passport 선언
var passport = require('passport')
var Strategy = require('passport-discord').Strategy

//passport 에서 요구할 권한들
var scopes = ['identify', 'email'/*,'connections','guilds'*/];

var loggg = function (req, res, next) {
    console.log(req);
    next();
};


//passport
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new Strategy({
    clientID: '474528585206595585',
    clientSecret: 'dYvPtT1sITkg0NJriqA7jmQ8OUfQhGCK',
    callbackURL: global.hosturl+'/login',
    scope: scopes
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

app.use(session({
    secret: '!@#G1591O#@!$',
    resave: false,
    saveUninitialized: false
}));
var dataManager = function (req, res, next) {
    req.dataManager = new MyEmitter();
    req.soketIO = io;
    //console.log(io);
    next();
};
app.use(dataManager);
// app.use(dataManager);
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/discord', passport.authenticate('discord', { scope: scopes }), function(req, res) {});

app.get('/login',
    passport.authenticate('discord', {
        failureRedirect: '/' // 실패시 리다이렉션
    }),
    function(req, res) {
        var ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
        console.log("아이피",req.headers['x-forwarded-for'] ,  req.connection.remoteAddress);
        // var ip = req.headers['x-forwarded-for'];
        Logger(`[${ip}] ${req.user.username}#${req.user.discriminator}(<@!${req.user.id}>)님이 웹사이트 로그인에 성공하셨습니다.`);
        DB.findUserFromID(req.user.id, function(err, user){
            //오류검출
            if(err) return console.log(err)
            //IF USER NOT FOUND
            if(!user) {
                DB.addUser(req.user,function(err, user){
                    if(err) return console.error(err);
                    console.dir(user);
                });
                return console.log();
            }
            req.user.data = user;
            req.user.data.isAdmin = req.user.data.isAdmin == '001'?true:false;
            // console.log(req.user);

            res.redirect('/');
        });
    }
);
app.get('/info', checkAuth, function(req, res) {
    //console.log(req.user)
    console.log(req.user);
    res.json(req.user);
});
app.get('/status', function(req, res) {
    let out = "";

    console.log(global.DB.users.length)
    for(let [id, user] of global.DB.users){
        // let user = global.DB.users[i]
        out+=`${user.id} ${user.name}<br>`;
    }
    res.send(out);
});

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.send('not logged in :(');
}

// origin code
require('date-utils');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
server.listen(port, function(){
    console.log(`Express server has started on port ${port}`);
    Logger("Server Up!");
});

app.use(express.static(__dirname + '/public'));


let discord_auth = require('./discord_auth');
app.use(discord_auth);

var router = require('./router/main')(app, fs);