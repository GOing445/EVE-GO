// /member/:discordid/:esiid

var fs = require('fs');
var ejs = require('../esi.js');
var DB = require('../database.js');
var async = require("async");

// var mongoose = require('mongoose');
// var db = mongoose.connection;
// var Schema = mongoose.Schema;


// 두개의 날짜를 비교하여 차이를 알려준다.
function dateDiff(_date1, _date2) {
    var diffDate_1 = _date1 instanceof Date ? _date1 : new Date(_date1);
    var diffDate_2 = _date2 instanceof Date ? _date2 : new Date(_date2);
    //console.log(diffDate_1);
    //console.log(diffDate_2);

    //diffDate_1 = new Date(diffDate_1.getFullYear(), diffDate_1.getMonth()+1, diffDate_1.getDate());
    //diffDate_2 = new Date(diffDate_2.getFullYear(), diffDate_2.getMonth()+1, diffDate_2.getDate());
    //console.log(diffDate_1);
    //console.log(diffDate_2);

    var diff = Math.abs((diffDate_2.getTime() - diffDate_1.getTime())/1000);
    var days = Math.floor(diff / 86400);
    var hours   = Math.floor((diff - (days * 86400)) / 3600);
    var minutes = Math.floor((diff - (days * 86400) - (hours * 3600)) / 60);
    var seconds = Math.floor(diff - (days * 86400) - (hours * 3600) - (minutes * 60));
    
    return days+"일"+hours+'시간'+minutes+'분'+seconds+'초';
}

module.exports = function(req, res){
    // console.log(req.path);

    
    if(req.user) console.log(req.user.username);
    else console.log('no login data');
    if(req.user) username = req.user.username;
    else res.redirect('/');

    var char = global.DB.chars.get(req.params.esiid*1);
    var user = global.DB.users.get(char.onwer);
    if(req.user.data.isAdmin==false){ //어드민이 아닐경우에만 권한을 체크
        if(char.onwer != req.user.id) res.redirect('/'); //사용자와 일치하는가?
    }
    console.log(user);
    if(!char){
        console.log(`${req.params.discordid} not have ${req.params.esiid}!!!`);
        // res.redirect('/');
        return;
    }
    //DB.findCharFromID(req.params.discordid,req.params.esiid,function(err,char){
    //console.log(char);
    
    //var user = JSON.parse(user);
    //var char = user[req.params.discordid].eve_char[req.params.esiid];
    
    //console.log("char",char.eve_char);
    //var char = char.eve_char[req.params.esiid];


    // console.log("char?",char);

    ejs.getTokenFormRefreshToken(char.refreshToken,function(token){   
        console.time("wrap");
        Promise.all(
            [
                new Promise((resolve, reject)=>{ //퍼블릭데이터 얻기
                    console.time("퍼블릭데이터");
                    ejs.getCharPublicData(req.params.esiid,function(publicData){
                        ejs.getCorpDetailbyCorpId(publicData.corporation_id,function(corpDetail){//꼽데이터 추가
                            publicData.corporation_name = corpDetail.name;
                            publicData.corporation_ticker = corpDetail.ticker;
                            
                            console.timeEnd("퍼블릭데이터")
                            resolve(publicData);
                        });
                    });
                }),
                new Promise((resolve, reject)=>{ //월렛데이터 얻기
                    console.time("월렛데이터");
                    ejs.updateCharWalletBalance(req.params.esiid,token,function(WalletBalance){
                        //console.log("월렛발란스 데이터",WalletBalance);
                        console.timeEnd("월렛데이터");
                        resolve(WalletBalance);
                    });
                }),
                new Promise((resolve, reject)=>{ //스킬큐데이터 얻기
                    console.time("스킬큐데이터");
                    ejs.getTokenFormRefreshToken(char.refreshToken,function(token){
                        ejs.getCharSkillQueue(req.params.esiid,token,function(skillQueue){
                            //console.log(skillQueue);
                            for(var i=0;i<Object.keys(skillQueue).length;i++){
                                //console.log(skillQueue[i].skill_id);
                                //console.log(global.DB_ypeIDs[skillQueue[i].skill_id]);
                                try {
                                    skillQueue[i].skill_name = global.DB_ypeIDs[skillQueue[i].skill_id].name;
                                } catch (error) {
                                    skillQueue[i].skill_name = "UnknownSkill";
                                }
                                skillQueue[i].remaining_date = dateDiff(skillQueue[i].finish_date, new Date().toUTCString());
                            }
                            console.timeEnd("스킬큐데이터");
                            resolve(skillQueue);
                        });
                    });
                }),
                new Promise((resolve, reject)=>{ //스킬데이터 얻기
                    console.time("스킬데이터");
                    fs.readFile(__dirname+'/../data/member/'+req.params.esiid+"/charSkills.json", 'utf8', function(err, data){
                        // console.log("err",err);
                        if(err)resolve(undefined);
                        try {
                            data = JSON.parse(data);
                        } catch (error) {
                            console.log(error)
                            reject(undefined);
                        }
                        resolve(data);
                        });
                })
            ]
        ).then(function(result) {
            //console.log("성공!",result);
            console.timeEnd("wrap");
            res.render('html', {
                title: "GOing's server",
                body: "member_esi_detail.ejs",
                sess: req.user,
                user : user,
                esiid : req.params.esiid,
                publicData : result[0],
                WalletBalance : result[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                skillQueue : result[2],
                skillchart : result[3]
            });
        });
    });
}