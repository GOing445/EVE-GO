var Logger = require('./logger');
var mysql      = require('mysql');
var connection;
const db_config = require("./DB.json");
const Collection = require('./node_modules/discord.js/src/util/Collection');
var ejs = require('./esi')

global.DB = {
    users : new Collection(),
    modules : new Collection(),
    fits : new Collection(),
    fittingTag : new Collection(),
    chars : new Collection(),
};
async function init() {
    
    console.log("init실행")
    module.exports.loadModule();
    module.exports.fatchUsers();
    // module.exports.fatchmodules();
    // module.exports.fatchfits();
    module.exports.fatchchars();
    // module.exports. fatchFittingTags();
}

class Character{ //이브온라인 캐릭터 객체
    constructor(data){
        // console.log(data);
        this.id = null;//캐릭터 아이디(기본식별자)
        this.name = null; // 이름
        this.onwer = null;//소유자 User.id
        this.refreshToken = null; //리프레시토큰
        this.API_version = null; //API 버전
    }
    async init(data){
        this.id = data.ID;
        this.name = data.Name;
        this.onwer = data.onwer;
        this.refreshToken = data.refreshToken; 
        this.APIversion = data.API_version;
    }
}

class User{ // 사용자 객체
    constructor(data){
        // console.log(data);
        this.id = null;//디스코드 아이디(기본식별자)
        this.isAdmin = false; // 어드민인가
        this.name = null;//디스코드 닉네임
        this.discord = null;//디스코드 User객체
        this.point = null; //새우
        // if(data) this.init(data);
    }
    async init(data){
        this.id = data.User_ID;
        this.discord = await global.Discordbot.findUserFromID(this.id,global.DiscordServerID);
        if(!this.discord) this.name = "unkown user";
        else this.name = (this.discord.nickname === null) ?data.UserName:this.discord.nickname;
        this.isAdmin = data.isAdmin=="001"?true:false;
        this.point = data.Point;
    }
}

module.exports.fatchUsers = function() {
    connection.query(`SELECT * FROM User`,function(err, rows, fields) {
        for(row of rows){
            let user = new User(row)
            user.init(row);
            global.DB.users.set(row.User_ID, user);
        }
        if(err)Logger.json(err);
    });
}
module.exports.fatchmodules = function() {
    
}
module.exports.fatchfits = function() {
    
}
module.exports.fatchchars = function() {
    connection.query(`SELECT * FROM \`Character\``,function(err, rows, fields) {
        for(row of rows){
            let user = new Character(row)
            user.init(row);
            global.DB.chars.set(row.ID, user);
        }
        if(err)Logger.json(err);
    });
}
module.exports.fatchFittingTags = function() {
    
}

module.exports.handleDisconnect = function() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.
    
    connection.connect(function (err) {              // The server is either down
        if(global.Discordbot.status != 0){
            // console.log("서버가 안열렸어양!",global.Discordbot.status);
            setTimeout(()=>{module.exports.handleDisconnect}, 500);
        }
        else{
            init();
            module.exports.connection = connection;
            if (err) {                                     // or restarting (takes a while sometimes).
                console.log('error when connecting to db:', err);
                setTimeout(module.exports.handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
            }                                     // to avoid a hot loop, and to allow our node script to
        }
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            module.exports.handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

setTimeout(module.exports.handleDisconnect, 2000);

module.exports.getAllFits = function(callback){
    return new Promise(function(resolve, reject){
        connection.query('SELECT Fit.*,Module.Name Ship_Name  from Fit,Module WHERE Fit.Ship_ID = Module.Module_ID ORDER BY `fit_ID` ASC', function(err, rows, fields) {
            if(err)Logger.json(err);
            if(callback)callback(err, rows, fields);
            resolve(rows);
        });
    });
}
module.exports.getAllTags = function(callback){
    connection.query('SELECT * from Tag', function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows, fields);
    });
}
module.exports.getTagsFromFitID = function(Fit_ID,callback){
    if(!callback){
        return new Promise(resolve=>{
            connection.query(`
                SELECT Tag.*
                FROM Fit,Tag,Tagging
                WHERE  Fit.fit_ID = Tagging.Fit_ID 
                AND  Tagging.Tag_ID = Tag.Tag_ID 
                AND Fit.fit_ID = ${Fit_ID}
            `, function(err, rows, fields) {
                if(!err)Logger.json(err);
                resolve(rows);
            });
        });
    }
    connection.query(`
        SELECT Tag.*
        FROM Fit,Tag,Tagging
        WHERE  Fit.fit_ID = Tagging.Fit_ID 
        AND  Tagging.Tag_ID = Tag.Tag_ID 
        AND Fit.fit_ID = ${Fit_ID}
    `, function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows, fields);
    });
}
module.exports.getFitsFromTags = function(select_tags,callback){
    // console.log("select_tags =",select_tags);
    let tags = [];
    for(tag in select_tags) if(select_tags[tag])tags.push(tag);
    let S_tags;
    if(tags.length>=1){
        S_tags = `( Tag.Tag_ID = ${tags[0]}`;
        for(let i=1;i<tags.length;i++){
            S_tags += ` OR Tag.Tag_ID = ${tags[i]}`
        }
        S_tags += ")";
    }
    else S_tags = 'true';

    // console.log("S_tags",S_tags);
    let qqq = `
        SELECT Fit.*,Module.Name ShipName
        FROM Fit,Tag,Tagging,Module
        WHERE  Fit.fit_ID = Tagging.Fit_ID 
        AND  Tagging.Tag_ID = Tag.Tag_ID 
        AND ${S_tags}
        AND Fit.Ship_ID=Module.Module_ID
        GROUP BY Fit.fit_ID
        HAVING COUNT(Tag.Tag_ID)>=${tags.length}
        ORDER BY Fit.Ship_ID
    `   
    // console.log(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        //console.log(rows)
        callback(err, rows, fields);
    });
}
module.exports.getDoctrines = function(callback){
    let qqq = `
        SELECT Doctrine.*, User.User_ID
        FROM Doctrine, User
        WHERE Doctrine.Author = User.User_ID
    `   
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows, fields);
    });
}
module.exports.getDoctrineFromID = function(Doctrine_ID,callback){
    let qqq = `
        SELECT Doctrine.*, User.User_ID
        FROM Doctrine, User
        WHERE Doctrine.Author = User.User_ID
        AND Doctrine.Doctrine_ID = ${Doctrine_ID}
    `   
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows, fields);
    });
}
module.exports.getRoleGroupFromDoctrine = function(Doctrine_ID,callback){
    let qqq = `
        SELECT *
        FROM RoleGroup
        WHERE Doctrine_ID = ${Doctrine_ID}
    `   
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows, fields);
    });
}
module.exports.getFitsFromDoctrine = function(Doctrine_ID,callback){
    let qqq = `
        SELECT Fit.*, Doctrine_Link.Doctrine_ID,Doctrine_Link.Group_ID
        FROM Doctrine_Link,Fit
        WHERE Doctrine_Link.Fit_ID = Fit.fit_ID
        AND Doctrine_Link.Doctrine_ID = ${Doctrine_ID}
    `   
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows, fields);
    });
}
module.exports.connection = connection;

module.exports.findUserFromID = function(id,callback){
    return new Promise(async function(resolve, reject) {
        // console.log(`SELECT * FROM User WHERE User_ID = "${id}"`);
        connection.query(`SELECT * FROM User WHERE User_ID = "${id}"`, function(err, rows, fields) {
            if(!err)Logger.json(err);
            if(callback)callback(err, rows.length?rows[0]:undefined);
            resolve(rows[0])
        });
    });
}
module.exports.addUser = function(user,callback){
    // let date = new Date();
    let qqq = `INSERT INTO \`ghtjd0127\`.\`User\` (\`User_ID\`, \`isAdmin\`, \`UserName\`, \`Locale\`, \`Discriminator\`, \`eMail\`, \`AccessToken\`, \`RegistDate\`) VALUES ('${user.id}', '0', '${user.username}', '${user.locale}', '${user.discriminator}', '${user.email}', '${user.accessToken}', CURRENT_TIMESTAMP)`;
    Logger(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        callback(err, rows);
        module.exports.fatchUsers();
    });
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
module.exports.addFit = function(fit,callback){
    console.log(111,fit.fit_esi.trim().split(/\r\n|\n/g)[0]);
    let ship_id = headerParse(fit.fit_esi.trim().split(/\r\n|\n/g)[0]).id;

    let qqq = `INSERT INTO ghtjd0127.Fit VALUES (0,'${fit.fit_name}', '${JSON.stringify(fit.fit_esi).replace(/^[\s"]+|[\s"]+$/g,'').replace(/'/g,'\\\'')}', '${fit.fit_dec}', '${fit.fit_author}', '${getDateTime()}',${ship_id})`
    Logger(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(err)Logger.json(err);
        callback(err, rows);
    });
}
module.exports.addTag = function(fit_id,tag_id){
    let qqq = `INSERT INTO ghtjd0127.Tagging VALUES (${fit_id},${tag_id})`;
    Logger(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        // callback(err, rows);
    });
}
module.exports.delTag = function(fit_id,tag_id){
    let qqq = `DELETE FROM \`ghtjd0127\`.\`Tagging\` WHERE  \`Fit_ID\`=${fit_id} AND \`Tag_ID\`=${tag_id};`;
    Logger(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        // callback(err, rows);
    });
}
module.exports.editFit = function(fit,fit_ID,callback){
    connection.query(`DELETE FROM \`ghtjd0127\`.\`Fit\` WHERE  \`fit_ID\`=${fit_ID};`,function(err, rows, fields){
        if(!err)Logger.json(err);
        let qqq = `INSERT INTO ghtjd0127.Fit VALUES (${fit_ID},'${fit.fit_name}', '${JSON.stringify(fit.fit_esi).replace(/^[\s"]+|[\s"]+$/g,'').replace(/'/g,'\\\'')}', '${fit.fit_dec}', '${fit.fit_author}', '${getDateTime()}',0)`
        Logger(qqq);
        connection.query(qqq, function(err, rows, fields) {
            if(!err)Logger.json(err);
            callback(err, rows);
        }); 
    });
}
module.exports.addDoctrine = function(data,callback){
    connection.query(
        `INSERT INTO \`ghtjd0127\`.\`Doctrine\` (\`Name\`, \`SubTitle\`, \`Author\`, \`Desc\`, \`CoverImg\`)
        VALUES ('${data.Name}', '${data.SubTitle}', '${data.Author}', '${data.Description}', '${data.CoverImage}');
        `,function(err, rows, fields){
            connection.query(`SELECT LAST_INSERT_ID();`,async function(err, Doctrine_ID, fields) {
                Doctrine_ID = Doctrine_ID[0]['LAST_INSERT_ID()'];
                console.log("Doc_id",Doctrine_ID);
                for await (role of data.roleGroup){
                    role.Role_ID = await module.exports.addRoleGroup(Doctrine_ID,role);
                }
                console.log(data.roleGroup);
                for await (fit of data.fits){
                    let role = data.roleGroup.find(role=>role.name==fit.role);
                    
                    fit.Role_ID = await module.exports.addDoctrine_Link(Doctrine_ID,role.Role_ID,fit.name);
                }
                callback();
            });
    });
}
module.exports.addRoleGroup = function(Doctrine_ID,data){
    return new Promise(function(resolve, reject){
        connection.query(
            `INSERT INTO \`ghtjd0127\`.\`RoleGroup\` (\`Doctrine_ID\`, \`Name\`, \`Desc\`)
            VALUES ('${Doctrine_ID}', '${data.name}', '${data.desc}');
            `,function(err, rows, fields){
                connection.query(`SELECT LAST_INSERT_ID();`,async function(err, Role_ID, fields) {
                    Role_ID = Role_ID[0]['LAST_INSERT_ID()'];
                    resolve(Role_ID);
                });
        });
    });
}
module.exports.addDoctrine_Link = function(Doctrine_ID,Role_ID,Fit_ID){
    return new Promise(function(resolve, reject){
        connection.query(
            `INSERT INTO \`ghtjd0127\`.\`Doctrine_Link\` (\`Doctrine_ID\`, \`Fit_ID\`, \`Group_ID\`)
            VALUES ('${Doctrine_ID}', '${Fit_ID}', '${Role_ID}');
            `,function(err, rows, fields){
                connection.query(`SELECT LAST_INSERT_ID();`,async function(err, Role_ID, fields) {
                    Role_ID = Role_ID[0]['LAST_INSERT_ID()'];
                    resolve(Role_ID);
                });
        });
    });
}
module.exports.removeDoctrine_Link = function(Doctrine_ID,Role_ID,Fit_ID){
    return new Promise(function(resolve, reject){
        connection.query(`DELETE FROM \`ghtjd0127\`.\`Doctrine_Link\` WHERE  \`Doctrine_ID\`=${Doctrine_ID} AND \`Fit_ID\`=${Fit_ID} AND \`Group_ID\`=${Role_ID};`,
            function(err, rows, fields){
                resolve();
        });
    });
}
module.exports.getRoleGroup = function(Doctrine_ID,Role_ID){
    return new Promise(function(resolve, reject){
        connection.query(`SELECT * FROM RoleGroup WHERE Doctrine_ID = '${Doctrine_ID}' AND Role_ID ='${Role_ID}';`,
            function(err, rows, fields){
                resolve(rows);
        });
    });
}
module.exports.getDoctrine = function(Doctrine_ID){
    return new Promise(function(resolve, reject){
        connection.query(`SELECT * FROM Doctrine WHERE Doctrine_ID = '${Doctrine_ID}';`,
            function(err, rows, fields){
                resolve(rows);
        });
    });
}
module.exports.editRoleGroup = function(Doctrine_ID,Role_ID,newName,newDesc){
    return new Promise(function(resolve, reject){
        connection.query(`UPDATE \`ghtjd0127\`.\`RoleGroup\` SET \`Name\`=\'${newName}\', \`Desc\`=\'${newDesc}\' WHERE  \`Doctrine_ID\`=${Doctrine_ID} AND \`Role_ID\`=${Role_ID};`,
            function(err, rows, fields){
                resolve(rows);
        });
    });
}
module.exports.editDoctrine = function(Doctrine_ID,newName,newSubTitle,newCover,newDesc){
    return new Promise(function(resolve, reject){
        connection.query(`UPDATE \`ghtjd0127\`.\`Doctrine\` SET \`Name\`=\'${newName}\', \`SubTitle\`=\'${newSubTitle}\', \`CoverImg\`=\'${newCover}\', \`Desc\`=\'${newDesc}\' WHERE  \`Doctrine_ID\`=${Doctrine_ID};`,
            function(err, rows, fields){
                resolve(rows);
        });
    });
}
module.exports.deleteRoleGroup = function(Doctrine_ID,Role_ID){
    return new Promise(function(resolve, reject){
        connection.query(`DELETE FROM \`ghtjd0127\`.\`RoleGroup\` WHERE  \`Doctrine_ID\`=${Doctrine_ID} AND \`Role_ID\`=${Role_ID}; `,
            function(err, rows, fields){
                resolve(rows);
        });
    });
}
module.exports.deleteDoctrine = function(Doctrine_ID){
    return new Promise(function(resolve, reject){
        connection.query(`DELETE FROM \`ghtjd0127\`.\`Doctrine\` WHERE  \`Doctrine_ID\`=${Doctrine_ID};`,
            function(err, rows, fields){
                resolve(rows);
        });
    });
}

function getDateTime(date){
    if(!date)date = new Date();
    // console.log(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()+1}:${date.getMinutes()+1}:${date.getSeconds()+1}`);
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()+1}:${date.getMinutes()+1}:${date.getSeconds()+1}`;
} 



class eve_Module{
    constructor(data){
        this.id = null;
        this.name = null;
        this.type = null;
        if(data) this.init(data);
    }
    init(data){
        this.id = data.Module_ID;
        this.name = data.Name;
        this.type = data.Module_Type;
    }
}


module.exports.loadModule = function() {
    let body = {};
    
    let qqq = `
        SELECT *
        FROM Module
    `
    console.log(qqq);
    connection.query(qqq, function(err, rows, fields) {
        for(row of rows){
            body[row.Module_ID]=new eve_Module(row);
        }
        global.eveModules = body;
    });
}

module.exports.saveModule = function(item){
    let qqq = `INSERT INTO \`ghtjd0127\`.\`Module\` (\`Module_ID\`, \`Name\`, \`Module_Type\`) VALUES ('${item.id}', '${item.name.replace(/'/g,"''")}', '${item.type}');`;
    Logger(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        module.exports.loadModule();
    });
}

module.exports.addCharacter = function(char,callback){
    let qqq = `INSERT INTO \`ghtjd0127\`.\`Character\` (\`ID\`, \`Name\`, \`onwer\`, \`refreshToken\`, \`API_version\`) VALUES ('${char.id}', '${char.name}', '${char.onwer}', '${char.refreshToken}', '2');`;
    Logger(qqq);
    connection.query(qqq, function(err, rows, fields) {
        if(!err)Logger.json(err);
        module.exports.fatchchars();
        callback();
    });
} 

module.exports.addRecruit = async function(recruitForm,callback){

    return new Promise(async function(resolve, reject) {
        let qqq = 
        `INSERT INTO \`ghtjd0127\`.\`Recruit\` (\`Title\`,\`Author\`, \`RecruitType\`, \`Body\`, \`State\`)
            VALUES (
                '${recruitForm.title}',
                '${recruitForm.author}',
                '${recruitForm.type}', 
                '${recruitForm.body}', 
                '${recruitForm.State}'
            );
        `;


        Logger(qqq);
        connection.query(qqq, function(err, rows, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            if(callback)callback(err, rows);
            resolve(rows);
        });
    });
}

module.exports.getRecruitFromID = async function(id,callback){
    return new Promise(async function(resolve, reject) {

        let qqq = `SELECT * FROM ghtjd0127.Recruit WHERE Author = ${id};`;


        Logger(qqq);
        await connection.query(qqq, function(err, rows, fields) {
            
            console.log(rows[0]);

            if(err)Logger.json("SQL ERR! : ",err);
            if(callback)callback(err, rows[0]);
            resolve(rows[0]);
            
        });
    });
}
module.exports.getAllRecruit = async function(callback){
    return new Promise(async function(resolve, reject) {

        let qqq = `SELECT * FROM ghtjd0127.Recruit;`;


        Logger(qqq);
        await connection.query(qqq, function(err, rows, fields) {
            
            console.log(rows[0]);

            if(err)Logger.json("SQL ERR! : ",err);
            if(callback)callback(err, rows);
            resolve(rows);
            
        });
    });
}
module.exports.addRecruitComment = async function(commentForm,callback){

    return new Promise(async function(resolve, reject) {
        let qqq = 
        `INSERT INTO \`ghtjd0127\`.\`RecruitComment\` (\`Recruit_ID\`, \`Author\`, \`Body\`) VALUES (
            '${commentForm.Recruit_ID}',
            '${commentForm.Author}', 
            '${commentForm.Body}'
            );
        `;


        Logger(qqq);
        connection.query(qqq, function(err, rows, fields) {
            if(err)Logger.json(err);
            if(callback)callback(err, rows);
            resolve(rows);
        });
    });
}
module.exports.addRecruitSubComment = async function(commentForm,callback){

    return new Promise(async function(resolve, reject) {
        let qqq = 
        `INSERT INTO \`ghtjd0127\`.\`RecruitComment\` (\`ParentComment_ID\`, \`Author\`, \`Body\`) VALUES (
            '${commentForm.ParentComment_ID}',
            '${commentForm.Author}', 
            '${commentForm.Body}'
            );
        `;


        Logger(qqq);
        connection.query(qqq, function(err, rows, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            if(callback)callback(err, rows);
            resolve(rows);
        });
    });
}
module.exports.getCommentFromRecruit = async function(id,callback){

    return new Promise(async function(resolve, reject) {
        let qqq = `SELECT * FROM ghtjd0127.RecruitComment WHERE Recruit_ID=${id};`;
        Logger(qqq);
        connection.query(qqq,async function(err, comments, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            for await (comment of comments){
                comment.username = (await module.exports.findUserFromID(comment.Author)).UserName;
                comment.subcomment = await module.exports.getSubCommentFromComment(comment.RecruitComment_ID);
            }
            console.log(comments)
            resolve(comments)
        });
    });
}
module.exports.getCommentFromID = async function(id,callback){

    return new Promise(async function(resolve, reject) {
        let qqq = `SELECT * FROM ghtjd0127.RecruitComment WHERE RecruitComment_ID=${id};`;
        Logger(qqq);
        connection.query(qqq,async function(err, comments, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            console.log(comments)
            resolve(comments[0])
        });
    });
}
module.exports.getSubCommentFromComment = async function(id,callback){
    return new Promise(async function(resolve, reject) {
        qqq = `SELECT * FROM ghtjd0127.RecruitComment WHERE ParentComment_ID=${id};`;
        connection.query(qqq,async function(err, subcomments, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            for await (subcomment of subcomments)subcomment.username = (await module.exports.findUserFromID(subcomment.Author)).UserName;
            console.log(subcomments)
            resolve(subcomments)
        });
    });
}
module.exports.setRecruitState = async function(id,status,callback){
    return new Promise(async function(resolve, reject) {
        qqq = `UPDATE \`ghtjd0127\`.\`Recruit\` SET \`State\` = '${status}' WHERE (\`Author\` = '${id}');`;
        connection.query(qqq,async function(err, rows, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            resolve(rows)
        });
    });
}
module.exports.deleteComment = async function(id,callback){
    return new Promise(async function(resolve, reject) {
        qqq = `DELETE FROM \`ghtjd0127\`.\`RecruitComment\` WHERE (\`RecruitComment_ID\` = '${id}' or \`ParentComment_ID\` = '${id}');`;
        connection.query(qqq,async function(err, rows, fields) {
            if(err)Logger.json("SQL ERR! : ",err);
            resolve(rows)
        });
    });
}
module.exports.deleteRecruit = async function(id,callback){
    return new Promise(async function(resolve, reject) {
        qqq = `DELETE FROM \`ghtjd0127\`.\`Recruit\` WHERE (\`Author\` = '${id}');`;
        
        connection.query(qqq,async function(err, rows, fields) {
            if(err)Logger.json(err);
            connection.query(`DELETE FROM \`ghtjd0127\`.\`RecruitComment\` WHERE (\`Recruit_ID\` = '${id}');`,async function(err, rows2, fields){
                if(err)Logger.json(err);
                resolve(rows)
            });
        });
        
    });
}