var request = require("request");
var fs = require("fs");
var DB = require('./database');
var Logger = require('./logger');

const eveapp = "Basic YzM0NDkzZGNhYTJlNDlmMjhjYTg5MDBmNmZiMjE3OTE6UTJXaUQ3Z2ViZFdsQ2dwZGdSY081NFRpTzVwcmY4YzU5dE1MdFZseA==";

// 두개의 날짜를 비교하여 차이를 알려준다.
function dateDiff(_date1, _date2) {
    var diffDate_1 = _date1 instanceof Date ? _date1 : new Date(_date1);
    var diffDate_2 = _date2 instanceof Date ? _date2 : new Date(_date2);

    var diff = Math.abs((diffDate_2.getTime() - diffDate_1.getTime())/1000);
    // console.log(diff);
    return diff;
}

class ESIRequest{
    // constructor(type,char_id,data){
    //     this.type = type;
    //     this.char_id = char_id;
    //     this.data = data;
    // }

    static GET(url,callback,times) {
        request({
            uri: url,
            method: "GET",
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10
        },
        function(error, response, body) {
            var fun_error = () => {
                if(times === undefined) times = 5;
                if(times == 0){
                    console.log("요청실패!");
                    return;
                }
                else{
                    let sso_status;
                    let sso_error;
                    try{
                        sso_status = data.sso_status;
                        sso_error = data.error;
                    }
                    catch(e){
                        console.log(e);
                        sso_status = "sso_status null";
                        sso_error = "error null";
                    }
                    console.log(`[${times}] data reload [${sso_status}]${sso_error}`);
                    console.log(body);
                    ESIRequest.GET(url,callback,times-1);
                }
            }
            // console.log(body);
            try {
                var data = JSON.parse(body);
            } catch (error) {
                console.log(body);
                console.log(error);
                setTimeout(fun_error, 500); 
                return;
            }
            if(data.error !== undefined) setTimeout(fun_error, 500); 
            else {
                return callback(data);
            }
        });
    }
}

//코드를 받아 리프레시 토큰을 반환
module.exports.getRefreshTokenFormCode = function(Code,callback){
    var url = 'https://login.eveonline.com/oauth/token';
    // console.log(Code);
    request.post({
        headers: {
            'Authorization' : eveapp,
            'content-type' : 'application/json',
            'Host' : 'login.eveonline.com'
        },
        url: url,
        json: {
            "grant_type":"authorization_code",
            "code":Code
          }
    },
    function(error, response, body) {
        // console.log(body);
        if(!body.refresh_token) setTimeout(() => {
            module.exports.getRefreshTokenFormCode(Code,callback);
        }, 1000); 
        else return callback(body.refresh_token);
    });
}
//엑세스 토큰 검사
module.exports.verifyAccessToken = function(access_token,callback){
    var url = `https://esi.evetech.net/verify/?datasource=tranquility&token=${access_token}`;
    ESIRequest.GET(url,callback,5);
}
//코드를 받아 리프레시 토큰을 반환222
module.exports.getRefreshTokenFormCode2 = function(Code,callback){
    var url = 'https://login.eveonline.com/oauth/token';
    // console.log(Code);
    request.post({
        headers: {
            'Authorization' : eveapp,
            'content-type' : 'application/json',
            'Host' : 'login.eveonline.com'
        },
        url: url,
        json: {
            "grant_type":"authorization_code",
            "code":Code
          }
    },
    function(error, response, body) {
        // console.log(body);
        return callback(body.refresh_token);
    });
}

//리프레시 토큰을 받아 엑세스 토큰으로 반환
module.exports.getTokenFormRefreshToken = function(RefreshToken,callback){
    var url = 'https://login.eveonline.com/oauth/token';
    try {
        request.post({
            headers: {
                'Authorization' : eveapp,
                'content-type' : 'application/json',
                'Host' : 'login.eveonline.com'
            },
            url:     url,
            json: {
                "grant_type":"refresh_token",
                "refresh_token":RefreshToken
              }
        },
        function(error, response, body) {
            try {
                return callback(body.access_token);
            } catch (error) {
                setTimeout(() => {
                    module.exports.getTokenFormRefreshToken(RefreshToken,callback);
                }, 1000);
            }
        });
    } catch (error) {
        return getTokenFormRefreshToken(RefreshToken);
    }
    
}

//리프레시 토큰을 받아 엑세스 토큰으로 반환
module.exports.getTokenFormRefreshToken2 = function(RefreshToken,callback){
    var url = 'https://login.eveonline.com/oauth/token';
    try {
        request.post({
            headers: {
                'Authorization' : eveapp,
                'content-type' : 'application/json',
                'Host' : 'login.eveonline.com'
            },
            url:     url,
            json: {
                "grant_type":"refresh_token",
                "refresh_token":RefreshToken
              }
        },
        function(error, response, body) {
            // console.log("getTokenFormRefreshToken\n",body);
            //console.log("body.access_token\n",body.access_token);
            var access_token = body.access_token
            return callback(access_token);
        });
    } catch (error) {
        return getTokenFormRefreshToken2(RefreshToken);
    }
    
}

//캐릭터의 퍼블릭 데이터업데이트 모듈
module.exports.getCharPublicData = function(character_id,callback){
    var url = "https://esi.evetech.net/latest/characters/"+character_id;
    ESIRequest.GET(url,callback,5);
}
//캐릭터의 스킬큐 데이터업데이트 모듈
module.exports.getCharSkillQueue = function(character_id,token,callback){
    var url = "https://esi.evetech.net/latest/characters/"+character_id+"/skillqueue/?token="+token;
    ESIRequest.GET(url,callback,5);
} 
//캐릭터의 스킬 취득 함수
module.exports.getCharSkills = function(character_id,token,callback){
    var url = "https://esi.evetech.net/latest/characters/"+character_id+"/skills/?token="+token;
    ESIRequest.GET(url,callback,5);
}
//캐릭터의 스킬 데이터업데이트 모듈
module.exports.updateCharSkills = function(character_id,token,callback){
    var url = "https://esi.evetech.net/latest/characters/"+character_id+"/skills/?token="+token;
    //console.log("URL",url);
    //console.log(url);
    request({
        uri: url,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    },
    function(error, response, body) {
        try {
            var data = JSON.parse(body);
        } catch (error) {
            console.log(data);
            console.log(error);
        }
        var result = [
            {"id":"skills","text":"skills","parent":""},
            {"id":"255","name":"Gunnery","parent":"skills"},
            {"id":"256","name":"Missiles","parent":"skills"},
            {"id":"257","name":"Spaceship Command","parent":"skills"},
            {"id":"258","name":"Fleet Support","parent":"skills"},
            {"id":"266","name":"Corporation Management","parent":"skills"},
            {"id":"267","name":"Obsolete Books","parent":"skills"},
            {"id":"268","name":"Production","parent":"skills"},
            {"id":"269","name":"Rigging","parent":"skills"},
            {"id":"270","name":"Science","parent":"skills"},
            {"id":"272","name":"Electronic Systems","parent":"skills"},
            {"id":"273","name":"Drones","parent":"skills"},
            {"id":"274","name":"Trade","parent":"skills"},
            {"id":"275","name":"Navigation","parent":"skills"},
            {"id":"278","name":"Social","parent":"skills"},
            {"id":"1209","name":"Shields","parent":"skills"},
            {"id":"1210","name":"Armor","parent":"skills"},
            {"id":"1213","name":"Targeting","parent":"skills"},
            {"id":"1216","name":"Engineering","parent":"skills"},
            {"id":"1217","name":"Scanning","parent":"skills"},
            {"id":"1218","name":"Resource Processing","parent":"skills"},
            {"id":"1220","name":"Neural Enhancement","parent":"skills"},
            {"id":"1240","name":"Subsystems","parent":"skills"},
            {"id":"1241","name":"Planet Management","parent":"skills"},
            {"id":"1545","name":"Structure Management","parent":"skills"},
        ];
        var l_num = ["I","II","III","IV","V"];
        data.skills.forEach(function(element){
            result.push({
                "id":element.skill_id.toString(),
                "name":global.DB_ypeIDs[element.skill_id] ? global.DB_ypeIDs[element.skill_id].name + ' ' + l_num[element.active_skill_level-1] : "???",
                "parent":global.DB_ypeIDs[element.skill_id] ? global.DB_ypeIDs[element.skill_id].groupID.toString() : "267",
                "value":element.skillpoints_in_skill
            });
        });

        //console.log(body);
        try{
            fs.mkdirSync(__dirname +'/data/member/'+character_id);
        }
        catch(e){
            if ( e.code != 'EEXIST' ) throw e; // 존재할경우 패스처리함.
        }
        //console.log(data);
        fs.writeFile(__dirname +'/data/member/'+character_id+'/charSkills.json', JSON.stringify(result, null, '\t'), 'utf8', function(error){
            //console.log(__dirname +'/data/member/'+character_id+'/charSkillQueue.json');
        });
        return callback(result);
    });
}
//캐릭터의 월렛 데이터업데이트 모듈
module.exports.updateCharWalletBalance = function(character_id,token,callback,times){
    // var url = "https://esi.evetech.net/latest/characters/"+character_id+"/wallet/";
    var url = "https://esi.evetech.net/latest/characters/"+character_id+"/wallet/?token="+token;
    //console.log("URL",url);
    //console.log(url);
    ESIRequest.GET(url,callback,5);
}
//꼽 정보 받아오기
module.exports.getCorpDetailbyCorpId = function(corp_id,callback){
    var url = "https://esi.evetech.net/latest/corporations/"+corp_id;
    ESIRequest.GET(url,callback,5);
}
//얼라 정보 받아오기
module.exports.getAlliDetailbyAlliId = function(alli_id,callback){
    var url = "https://esi.evetech.net/latest/alliances/"+alli_id;
    ESIRequest.GET(url,callback,5);
}

module.exports.addChar = function(userID,code,callback){
    module.exports.getRefreshTokenFormCode(code,function(refreshToken){
        module.exports.getTokenFormRefreshToken(refreshToken,function(token){
            //토큰체크
            var url = "https://esi.evetech.net/verify/?datasource=tranquility&token="+ token;
            request({
                uri: url,
                method: "GET",
                timeout: 10000,
                followRedirect: false,
                maxRedirects: 1
            },
            function(error, response, userbody) {
                try {
                    var rawdata = JSON.parse(userbody);
                } catch (error) {
                    console.log(data);
                    console.log(error);
                }
                var chardata = {
                    _id:rawdata.CharacterID,
                    onwer:userID,
                    CharacterName:rawdata.CharacterName,
                    refreshToken:refreshToken,
                    version:2
                };

                DB.addChar(userID,chardata,function(err,user){
                    if(err)console.log(err);
                    callback(err,user);
                });
            });
        });
    });
}

module.exports.getnoti = function(callback){
    var acc_token = "fyR97cZfMmME10FQzppTQSVvi7Dcm7BJ0Lj_tN-gjP8";
    module.exports.getTokenFormRefreshToken2(acc_token,(token)=>{
        var url = "https://esi.evetech.net/latest/characters/2114756857/notifications/?datasource=tranquility&token="+token;
        //console.log(url);
        request({
            uri: url,
            method: "GET",
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10
        },
        function(error, response, body) {
            //console.log(body);
            try {
                var data = JSON.parse(body);
                console.log("레아자일 고추길이",data.length);
            } catch (error) {
                return module.exports.getnoti(callback);
            }
            //console.log(data);
            return callback(data);
        });
    });
}

module.exports.evecharupdate = function(char){
    var key = char._id;
    return new Promise(function (resolve, reject) { 
        module.exports.getTokenFormRefreshToken(char.refreshToken,function(token){
            if(!token){ // 없는 캐릭터!!! 삭제 ㄱㄱ
                /*fs.readFile(__dirname + "/../data/user.json", "utf8", function(err, data){ //삭제를 위한 코드열기
                    var data = JSON.parse(data);
                    var obj_keys = Object.keys(data);

                    for(var i=0;i<obj_keys.length;i++){
                        if(data[obj_keys[i]].eve_char[key]) data[obj_keys[i]].eve_char[key] = undefined; //삭제
                    }
                    
                    fs.writeFile(__dirname + "/../data/user.json",JSON.stringify(data, null, '\t'), "utf8", function(err, data){
                        result = {"success": 1};
                        //Logger("["+req.ip.replace('::ffff:','')+"] "+req.user.username+"#"+req.user.discriminator+"(<@!"+req.user.id+">)님이 캐릭터 "+chardata.CharacterName+"를 등록했습니다.\nhttps://evewho.com/pilot/"+chardata.CharacterName.replace(/(\s)/gi,"+")+"\nhttps://image.eveonline.com/Character/"+charname+"_128.jpg");
                    });
                    reject();
                });*/
                reject();
            }
            else{
                //console.log("token",token);
                Promise.all(
                    [
                        new Promise((resolve, reject)=>{ //퍼블릭데이터 얻기
                            //console.time(key+"퍼블릭데이터");
                            module.exports.getCharPublicData(key,function(publicData){
                                //console.log("퍼블",publicData);
                                Promise.all(
                                    [
                                        new Promise((resolve,reject)=>{//꼽데이터 추가
                                            module.exports.getCorpDetailbyCorpId(publicData.corporation_id,function(corpDetail){
                                                publicData.corporation_name = corpDetail.name;
                                                publicData.corporation_ticker = corpDetail.ticker;
                                                resolve(corpDetail)
                                            });
                                        }),
                                        new Promise((resolve,reject)=>{//얼라데이터 추가
                                            if(publicData.alliance_id){
                                                module.exports.getAlliDetailbyAlliId(publicData.alliance_id,function(alliDetail){
                                                    publicData.alliance_name = alliDetail.name;
                                                    publicData.alliance_ticker = alliDetail.ticker;
                                                    resolve(alliDetail);
                                                });
                                            }
                                            else{
                                                resolve();
                                            }
                                        })
                                    ]
                                ).then(function(result){
                                    //resolve(result);
                                    //console.timeEnd(key+"퍼블릭데이터");
                                    resolve(publicData);
                                });
                            });
                        }),
                        new Promise((resolve, reject)=>{ //월렛데이터 얻기
                            //console.time("월렛데이터");
                            
                            module.exports.updateCharWalletBalance(key,token,function(WalletBalance){
                                //console.timeEnd(key+"월렛데이터");
                                // console.log("월렛 데이터 : ",WalletBalance);
                                resolve(WalletBalance);
                            });
                        }),
                        new Promise((resolve, reject)=>{ //스킬큐데이터 얻기
                            //console.time(key+"스킬큐데이터");
                            module.exports.getCharSkillQueue(key,token,function(skillQueue){
                                //console.log(skillQueue);
                                try {
                                    for(var i=0;i<Object.keys(skillQueue).length;i++){
                                        //console.log(skillQueue[i].skill_id);
                                        //console.log(global.DB_ypeIDs[skillQueue[i].skill_id]);
                                        try {
                                            skillQueue[i].skill_name = global.DB_ypeIDs[skillQueue[i].skill_id].name;
                                        } catch (error) {
                                            //console.log("알수없는 스킬발견",skillQueue[i].skill_id);
                                            skillQueue[i].skill_name = "UnknownSkill";
                                        }
                                        if(skillQueue[i].finish_date)skillQueue[i].remaining_date = dateDiff(skillQueue[i].finish_date, new Date().toUTCString());
                                        else skillQueue[i].remaining_date = "학생 월세밀렸어!";
                                    }
                                } catch (error) {
                                    resolve(undefined);
                                }
                                
                                //console.timeEnd(key+"스킬큐데이터");
                                resolve(skillQueue);
                            });
                        }),
                        new Promise((resolve, reject)=>{ //스킬포인트 얻기
                            module.exports.getCharSkills(key,token,function(skills){
                                resolve(skills.total_sp);
                            });
                        })
                    ]
                ).then(function(result) {
                    resolve({
                        esiid : key,
                        publicData : result[0],
                        WalletBalance : result[1],
                        skillQueue : result[2],
                        skillPoint : result[3]
                    });
                });
            }
        });
    });
}
class CharData {
    /*
        타입목록
        public
        corp
        alli
        wallet
        skillQueue
        total_sp
    */
    constructor(type,char_id,data){
        this.type = type;
        this.char_id = char_id;
        this.data = data;
    }
}
    
module.exports.evecharupdateSOKET = function(char,soket){
    // requestID = 'event';
    // console.log(char);
    var key = char.id;
    // console.log(key,char.refreshToken);
    module.exports.getTokenFormRefreshToken(char.refreshToken,function(token){
        // console.log("토큰취득");
        // console.log(token);
        if(!token){
            //  reject();
         }
         else{
             //퍼블릭데이터 얻기
            //  console.time(key+"퍼블릭데이터");
             module.exports.getCharPublicData(key,function(publicData){
                 soket.emit('event',new CharData('public',key,publicData));
                 //꼽데이터 추가
                 module.exports.getCorpDetailbyCorpId(publicData.corporation_id,function(corpDetail){
                     soket.emit('event',new CharData('corp',key,corpDetail));
                 });
                 //얼라데이터 추가
                 if(publicData.alliance_id){
                     module.exports.getAlliDetailbyAlliId(publicData.alliance_id,function(alliDetail){
                         soket.emit('event',new CharData('alli',key,alliDetail));
                     });
                 }
             });
               //월렛데이터 얻기
             //console.time("월렛데이터");
               module.exports.updateCharWalletBalance(key,token,function(WalletBalance){
                 //console.timeEnd(key+"월렛데이터");
                 //console.log("월렛 데이터 : ",WalletBalance);
                 soket.emit('event',new CharData('wallet',key,WalletBalance));
             });
             //스킬큐데이터 얻기
             //console.time(key+"스킬큐데이터");
             module.exports.getCharSkillQueue(key,token,function(skillQueue){
                 //console.log(skillQueue);
                 try {
                     for(var i=0;i<Object.keys(skillQueue).length;i++){
                        //  console.log(skillQueue[i].skill_id);
                         //console.log(global.DB_ypeIDs[skillQueue[i].skill_id]);
                         try {
                             skillQueue[i].skill_name = global.DB_ypeIDs[skillQueue[i].skill_id].name;
                         } catch (error) {
                             //console.log("알수없는 스킬발견",skillQueue[i].skill_id);
                             skillQueue[i].skill_name = "UnknownSkill";
                         }
                         if(skillQueue[i].finish_date) skillQueue[i].remaining_date = dateDiff(skillQueue[i].finish_date, new Date().toUTCString());
                         else skillQueue[i].remaining_date = "학생 월세밀렸어!";
                     }
                 } catch (error) {
                     soket.emit('event',new CharData('skillQueue',key,null));
                 }
                   //console.timeEnd(key+"스킬큐데이터");
                 soket.emit('event',new CharData('skillQueue',key,skillQueue));
             });
             //스킬포인트 얻기
             module.exports.getCharSkills(key,token,function(skills){
                 soket.emit('event',new CharData('total_sp',key,skills.total_sp));
             });
         }
    });
}
module.exports.newModule = function(module_id,isShip){
    if(typeof module_id != 'number') module_id = module.exports.getItemCode(module_id);
    var url = `https://esi.evetech.net/latest/universe/types/${module_id}`;
    // console.log(url);
    request({
        uri: url,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    },
    function(error, response, body) {
        
        try {
            var data = JSON.parse(body);
            let item ={
                id:data.type_id,
                name:data.name,
                type:undefined
            };
            if(isShip) item.type = 1; // 함선인가
            else if(data.dogma_effects?data.dogma_effects.find(e=>e.effect_id==11):false) item.type = 4; //로우
            else if(data.dogma_effects?data.dogma_effects.find(e=>e.effect_id==13):false) item.type = 3; //미드
            else if(data.dogma_effects?data.dogma_effects.find(e=>e.effect_id==12):false) item.type = 2; //하이
            else if(data.dogma_effects?data.dogma_effects.find(e=>e.effect_id==2663):false) item.type = 5; //리그
            else if(data.dogma_effects?data.dogma_effects.find(e=>e.effect_id==3772):false) item.type = 6; //섭시
            else if(data.dogma_effects?data.dogma_effects.find(e=>e.effect_id==10):false) item.type = 7; //드론 (드론은 드론을 가르키는게 없다! 그래서 10번인 공격모듈속성을 가지고있지만 아무런 슬롯에도 들어가지 않는 항목은 드론이나 파이터로 추측한다. )
            else item.type = 8 // 탄약
            // console.log(item);
            DB.saveModule(item);
        } catch (error) {
            console.log("data",data);
            console.log(error);
        }
    });
}
module.exports.getItemCode  = function(name) {
    if(!name) return undefined;
    name = name.split(',')[0].replace(/\s+x+[\d]+$/g,"").trim();

    //let url = 'https://esi.evetech.net/latest/search/?categories=inventory_type&datasource=tranquility&language=en-us&search=%27+' + name + '+%27&strict=true'

    
    for(item in global.DB_ypeIDs){
        if(global.DB_ypeIDs[item].name==name){
            return item;
        }
    }
    console.log("실패",name.indexOf(/\s+x+[\d]+$/g),",",name);
    return undefined;
}
