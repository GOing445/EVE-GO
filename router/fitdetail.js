var fs = require('fs');
var request = require("request");
var ejs = require('../esi.js');


var DataBase = require('../database');

function fitParser(rawfit,callback){
    let lines = rawfit.trim().split(/\r\n|\n/g);
    let fit = {
        title:null,
        ship:{
            id:null,
            name:null
        },
        author:null,
        createDate:0000,
        desc:0000,
        dogma:{
            high:0,
            mid:0,
            low:0,
            rigs:0,
            subsystem:0,
        },
        midSlot:[],
        highSlot:[],
        lowSlot:[],
        rigSlot:[],
        subsysSlot:[],
        drone:[],
        cargo:[],
        rawFit:rawfit
    };
    let blocks;
    let header = headerParse(lines[0]);
    fit.title = header.title;
    fit.ship.id = header.id;
    fit.ship.name = header.name;
    blocks = sliceBlock(rawfit);
    for(block of blocks){
        for(line of block.lines){
            switch(block.slot){
                case 'high' : fit.highSlot.push(findModuleFromName(line)); break;
                case 'mid' : fit.midSlot.push(findModuleFromName(line)); break;
                case 'low' : fit.lowSlot.push(findModuleFromName(line)); break;
                case 'rigs' : fit.rigSlot.push(findModuleFromName(line)); break;
                case 'subsystem' : fit.subsysSlot.push(findModuleFromName(line)); break;    
                case 'drone' : fit.drone.push(findModuleFromName(line.replace(/\s+x+[\d]+$/g,""))); break;    
                case 'cargo' : fit.cargo.push(findModuleFromName(line.replace(/\s+x+[\d]+$/g,""))); break;                
            }
        }
    }
    getShipDogma(fit.ship.id,(dogma)=>{
        fit.dogma = dogma;
        callback(fit);
        return fit;
    });
}
function getShipDogma(shipID,callback) {
    let dogma = {
        high:0,
        mid:0,
        low:0,
        rigs:0,
        subsystem:0,
    }
    
    var url = `https://esi.evetech.net/latest/universe/types/${shipID}/`;
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
            dogma.low = data.dogma_attributes.find(dog=>dog.attribute_id == 12).value;
            dogma.mid = data.dogma_attributes.find(dog=>dog.attribute_id == 13).value;
            dogma.high = data.dogma_attributes.find(dog=>dog.attribute_id == 14).value;
            dogma.rigs = data.dogma_attributes.find(dog=>dog.attribute_id == 1154).value;
            if(shipID==29990||shipID==29984||shipID==29986||shipID==29988) dogma.subsystem = 4;
            callback(dogma);
            return dogma;
        } catch (error) {
            console.log(data);
            console.log(error);
        }
        return callback(dogma);
    });
}

function headerParse(header){
    let temp = header.replace(/[\[\]]/g,'');
    
    ejs.newModule(temp.split(',')[0],true);
    
    return {
        id : getItemCode(temp.split(',')[0],true),
        name : temp.split(',')[0],
        title:temp.split(',')[1]
    }
}

function getItemCode(name) {
    name = name.split(',')[0].replace(/\s+x+[\d]+$/g,"").trim();

    for(item in global.DB_ypeIDs){
        if(global.DB_ypeIDs[item].name==name){
            return item;
        }
    }
    return 447;
}

class Block{
    constructor(data){
        this.slot = null;
        this.lines = [];
        if(data) this.init(data);
    }
    init(data){
        this.slot = data.slot;
        for(line of data.lines){
            this.lines.push(line);
        }
    }
    push(line){
        this.lines.push(line);
    }
    slotCheck(){
        // console.log(global.eveModules);
        try{
            if(this.slot) return;
            if(this.lines.some(line=>line.search(/[x\d]+$/g)!=-1)){ // 여러개있는 아이템이 있을경우
                if(this.lines.every(line=>findModuleFromName(line.replace(/[x\d]+$/g,'').trim()).type == 7)) this.slot = "drone";
                else this.slot = "cargo";   
            }
            else if(this.lines.every(line=>findModuleFromName(line).type == 2)) this.slot = 'high';
            else if(this.lines.every(line=>findModuleFromName(line).type == 3)) this.slot = 'mid';
            else if(this.lines.every(line=>findModuleFromName(line).type == 4)) this.slot = 'low';
            else if(this.lines.every(line=>findModuleFromName(line).type == 5)) this.slot = 'rigs';
            else if(this.lines.every(line=>findModuleFromName(line).type == 6)) this.slot = 'subsystem';
            else this.slot = 'ㅎㅎ?'
        }
        catch(error){
            
        }
    }
}

function findModuleFromName(name) { //TODO DB모듈로 옮겨야함
    name = name.trim();
    let body = Object.values(global.eveModules).find(eveModule=>eveModule.name==name);
    if(!body){
        ejs.newModule(name);
        setTimeout(() => {
            
            // return findModuleFromName(name);
        }, 1000);
    }
    else{
        return body;
    }
}

function sliceBlock(rawfit){
    let lines = rawfit.trim().split(/\r\n|\n/g);
    let blocks = [];
    let block = new Block();
    for(let i=1;i<lines.length;i++){
        let line = lines[i];
        getItemCode(line);
        if(line.trim() == ''){
            block.slotCheck();
            if(block.lines.length!=0)blocks.push(block);
            block = new Block;
        }else{
            block.push(line.split(',')[0].trim());
        }
    }
    block.slotCheck();
    if(block.lines.length!=0)blocks.push(block);
    return blocks;
}


module.exports = function(req, res){
    let sess = req.session;
    let fit_ID = req.params.fit_ID; 


    DataBase.connection.query(`SELECT * from Fit WHERE fit_ID = ${fit_ID}`, function(err, fits, fields) {
        let Author_ID = fits[0].Author;
        DataBase.connection.query(`SELECT * from User WHERE User_ID = ${Author_ID}`, function(err, users, fields) {
            DataBase.getTagsFromFitID(fit_ID,function(err, tags, fields) {
                if(fits[0].Ship_ID == 0){
                    let id = getItemCode(fits[0].Body.trim().split(/\r\n|\n/g)[0].replace(/[\[\]]/g,'').split(',')[0]);
                    // console.log("test",`UPDATE Fit SET Ship_ID = '${id}' WHERE fit_ID = '${fit_ID}';`)
                    DataBase.connection.query(`UPDATE Fit SET Ship_ID = ${id} WHERE fit_ID = ${fit_ID};`, function(err, users, fields) {});
                }
                fitParser(fits[0].Body,(fit)=>{
                    fit.title = fits[0].Name;
                    fit.author = users[0].UserName;
                    fit.createDate = fits[0].CreateData;
                    fit.desc = fits[0].Desc;
                    console.log(fit);
                    res.render('html',{ 
                        title:fits[0].Name,
                        body: "fit.ejs",
                        sess: req.user,
                        fit : fit,
                        tags : tags,
                    });
                });
            });
        });
    });
}