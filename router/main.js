var fs = require('fs');
const Esi = require('../esi');
const logger = require('../logger');
const Discord = require('discord.js');
const recurit_hook = new Discord.WebhookClient('#######################', '#########################################');

var Database = require('../database');

var sanitizeHtml = require('sanitize-html');

//var passport = require('passport');
//var Strategy = require('passport-discord').Strategy;

module.exports = function(app, fs)
{   
    app.get('/',function(req,res){
        if(req.user)res.redirect(`/recruitlist`);
        else res.redirect(`/front`);
        // if(req.user)res.redirect(`/member/${req.user.id}`);
        // else res.redirect(`/front`);
    });
    app.get('/front',function(req,res){
        res.render('frontpage');
    });
    app.get('/reject',function(req,res){
        res.render('reject',{
            sess:req.user
        });
    });
    app.get('/recruit',async function(req,res){
        if(!req.user){
            res.redirect('/reject');
            console.log("1로그인 정보 없음 @");
        }
        if( await Database.getRecruitFromID(req.user.id) ) {
            res.redirect(`/recruitDetail/${req.user.id}`);
            return;
        }
        res.render('recruitForm',{
            sess:req.user,
            originForm:"<h1><strong>질문간 공백에 작성해주세요.</strong></h1><h3><strong>게시된 신청서는 수정이 어려우니 신중하게 작성해주세요.</strong></h3><p><br></p><p><br></p><p><br></p><p><strong>1. 일반 정보</strong></p><p><br></p><p><br></p><p><strong>a. 자신의 메인툰 닉네임과 플레이 하는 시간대를 적어주세요. 만약 AU 타임존 플레이어일 경우 확실하게 시간대를 적어주세요.</strong></p><p><br></p><p><br></p><p><strong>b. 자신이 컴뱃에 사용하는 툰의 목록을 적어주시고, 사용 목적을 적어주세요. ex, Rhea Zail (메인, sub)</strong></p><p>메인툰 / 드레드넛 , FAX 알트의 경우는 스킬보드를 함께 첨부해서 적어주세요. <a href=\"https://eveskillboard.com/\" target=\"_blank\">https://eveskillboard.com/</a></p><p><br></p><p><br></p><p><strong>2. 이브온라인 경험</strong></p><p><br></p><p><br></p><p><strong>a. 지금 소속한 꼽을 떠나려는 이유나 게릴라 킨더가든에 가입하려는 이유를 적어주세요.</strong></p><p><br></p><p><br></p><p><strong>b. 자신이 지금까지 PVP 를 해오면서 가장 인상 깊었던 자신의 킬 / 로스 메일을 하나 링크해주시고 이유를 적어주세요.</strong></p><p><br></p><p><br></p><p><strong>3. 자신을 vouch 해줄 인원이 있다면 닉네임을 적어주세요.</strong></p><p><br></p>"
        });
    });
    app.post('/recruit',async function(req,res){
        // if(req.user.data.admin==false){res.redirect('/');return;}
        if(!req.user){
            res.render("recruitError",{
                originForm:req.body.Body
            });
        }
        if( await Database.getRecruitFromID(req.user.id) ) {
            res.redirect(`/recruitDetail/${req.user.id}`);
            return;
        }
        let recruitForm = {
            title:`${req.body.Name} / ${req.user.username}(#${req.user.discriminator})`,
            author:req.user.id,
            type:101,
            body:req.body.Body,
            State:101
        }

        recruitForm.Body = sanitizeHtml(recruitForm.Body);
        if(recruitForm.Body.length >=10000) recruitForm.Body.slice(0, 9999)
        await Database.addRecruit(recruitForm);
        recurit_hook.send(`새로운 신청서가 접수되었습니다.\n${req.body.Name} / ${req.user.username}(#${req.user.discriminator})\nhttp://g-g.asuscomm.com/recruitDetail/${req.user.id}`);
        res.redirect(`/recruit`);
    });
    // app.post('/recruit',async function(req,res){
    //     if( await Database.getRecruitFromID(req.user.id) ) {
    //         res.redirect(`/recruitDetail/${req.user.id}`);
    //         return;
    //     }
    //     let recruitForm = {
    //         title:`${req.body.Name} / ${req.user.username}(#${req.user.discriminator})`,
    //         author:req.user.id,
    //         type:101,
    //         body:req.body.Body,
    //         State:101
    //     }
    //     // await Database.addRecruit(recruitForm);
    //     res.redirect(`/recruit`);
    // });
    app.post('/addRecruitComment/:recruitID',async function(req,res){
        let commentForm = {
            Recruit_ID:req.params.recruitID,
            Author:req.user.id,
            Body:req.body.Body,
        }
        await Database.addRecruitComment(commentForm);
        recurit_hook.send(`새로운 댓글이 등록되었습니다.\n${global.DB.users.get(req.user.id).name} : ${req.body.Body}\nhttp://g-g.asuscomm.com/recruitDetail/${req.params.recruitID}`);
        res.redirect(`/recruitDetail/${req.params.recruitID}`);
    });
    app.post('/addSubComment/:recruitID/:parentID',async function(req,res){
        let commentForm = {
            ParentComment_ID:req.params.parentID,
            Author:req.user.id,
            Body:req.body.Body,
        }
        await Database.addRecruitSubComment(commentForm);
        recurit_hook.send(`새로운 대댓글이 등록되었습니다.\n${global.DB.users.get(req.user.id).name} : ${req.body.Body}\nhttp://g-g.asuscomm.com/recruitDetail/${req.params.recruitID}`);
        res.redirect(`/recruitDetail/${req.params.recruitID}`);
    });
    app.get('/recruitlist',async function(req,res){
        let recruits = await Database.getAllRecruit();
        res.render('recruitList',{
            recruits : recruits,
            sess : req.user
        });
    });
    app.get('/recruitDetail/:recruitID',async function(req,res){
        try{
            if(!global.Discordbot.isUserHavePermission("525912172908380191",req.user.id,"525914346073751582")/*gg꼽원*/ && req.params.recruitID!=req.user.id){
                res.redirect('/reject');
            }
            else{
                let recruit = await Database.getRecruitFromID(req.params.recruitID);
                let comments = await Database.getCommentFromRecruit(req.params.recruitID)
                res.render('recruitDetail',{
                    recruit : recruit,
                    sess : req.user,
                    comments : comments
                });
            }
        }   
        catch(e){
            console.log(e);
            res.redirect('/reject');
        }
    });
    app.get('/recruitDetail/:recruitID',async function(req,res){
        if(!global.Discordbot.isUserHavePermission("525912172908380191",req.user.id,"525914346073751582")/*gg꼽원*/ && req.params.recruitID!=req.user.id){
            res.redirect('/reject');
        }
        else{
            let recruit = await Database.getRecruitFromID(req.params.recruitID);
            let comments = await Database.getCommentFromRecruit(req.params.recruitID);
            res.render('recruitDetail',{
                recruit : recruit,
                sess : req.user,
                comments : comments
            });
        }
        
    });
    app.get('/delrecruit/:recruitID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        else{
            await Database.deleteRecruit(req.params.recruitID);
            res.redirect("/recruitList");
        }
        
    });
    app.get('/setrecruit/:recruitID/:status',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        else{
            await Database.setRecruitState(req.params.recruitID,req.params.status);
            res.redirect(`/recruitDetail/${req.params.recruitID}`);
        }
        
    });
    app.get('/delcomment/:recruitID/:commentID',async function(req,res){
        var comment = await Database.getCommentFromID(req.params.commentID);
        if(req.user.data.admin==false&&comment.RecruitComment_ID!=req.user.id){res.redirect('/');return;}
        else{
            await Database.deleteComment(req.params.commentID);
            res.redirect(`/recruitDetail/${req.params.recruitID}`);
        }
        
    });
    app.get('/logout', function(req, res){
        sess = req.user;
        if(sess.username){
            // req.session.destory();  // 세션 삭제
            // res.clearCookie('sid'); // 세션 쿠키 삭제
            req.session.destroy(function(err){
                if(err){
                    console.log(err);
                }else{
                    res.redirect('/');
                }
            })
        }else{
            res.redirect('/');
        }
    });
    app.get('/addchar',function(req,res){
        var path = req.path.split('/');
        require('./'+path[1]+'.js')(req,res);
    });
    app.get('/memberdetail/:charid/updateCharSkill/',function(req,res){
        var char = global.DB.chars.get(req.params.charid*1);
        // var user = global.DB.users.get(char.onwer*1);
        // console.log(char);
        Esi.getTokenFormRefreshToken(char.refreshToken,function(token){
            Esi.updateCharSkills(req.params.charid,token,function(data){
                res.redirect('/memberdetail/'+req.params.charid);
            })
        });
    });
    app.get('/memberlist',function(req,res){
        require('./member.js')(req,res);
    });
    app.get('/member/:discordid',function(req,res){
        require('./member_detail.js')(req,res);
    });
    app.get('/memberdetail/:esiid',function(req,res){
        require('./member_esi_detail.js')(req,res);
    });
    app.get('/test',function(req,res){
        fs.readdir("./views/test", (err, files) => { 
            console.log(files)
            res.render('html',{ 
                title:"피팅",
                body: "test.ejs",
                sess:{data:{isAdmin:false}},
                files:files,
            });
        })
    });
    app.get('/test/:file',function(req,res){
        res.render('html',{ 
            title:"피팅",
            body: `test/${req.params.file}`,
            sess:{data:{isAdmin:false}},
        });
    });
    app.get('/fits',function(req,res){
        if(req.user)logger.json(req.user.data.admin);
        Database.getAllTags((err,tagTable,fields)=>{    
            Database.getFitsFromTags([],async(error, results, fields)=>{
                for(i in results){
                    results[i].Tags = await Database.getTagsFromFitID(results[i].fit_ID);
               }
                res.render('html',{ 
                    title:"피팅",
                    body: "fits.ejs",
                    length: Object.keys( results ).length,
                    fits: results,
                    sess:req.user,
                    tags:tagTable,
                    select_tags:false,
                });
            });
        })
        
    });
    app.get('/doctrine',function(req,res){
        
        
        Database.getDoctrines(async(error, results, fields)=>{
            res.render('html',{ 
                title:"피팅",
                body: "doctrines.ejs",
                doctrines: results,
                sess:req.user,
            });
        });
    });
    app.get('/doctrine/add',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        let fits = await Database.getAllFits();

        res.render('html',{ 
            title:"피팅",
            body: "doctrineadd.ejs",
            sess:req.user,
            fits:fits,
        });
    });
    app.post('/doctrine/add',function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        req.body.fits = [];

        if(Array.isArray(req.body.fitNames)){
            for(i in req.body.fitNames){
                req.body.fits.push({
                    name:req.body.fitNames[i],
                    role:req.body.fitRoles[i],
                });
            }
        }else{
            req.body.fits.push({
                name:req.body.fitNames,
                role:req.body.fitRoles,
            });
        }
        req.body.fitNames = undefined;
        req.body.fitRoles = undefined;

        req.body.roleGroup = JSON.parse(req.body.roleGroup);
        req.body.roleGroup.push(req.body.roleGroup[0]);
        req.body.roleGroup.shift();
        
        req.body.Author = req.user.id;

        // res.json(req.body);
        Database.addDoctrine(req.body,()=>{
            res.redirect('/doctrine')
        });
        
    });
    app.get('/doctrine/:Doctrine_ID',function(req,res){
        Database.getDoctrineFromID(req.params.Doctrine_ID,async(error, Doctrine, fields)=>{
            Database.getRoleGroupFromDoctrine(req.params.Doctrine_ID,async(error, RoleGroups, fields)=>{
                Database.getFitsFromDoctrine(req.params.Doctrine_ID,async(error, Fits, fields)=>{
                    for await(RoleGroup of RoleGroups){
                        RoleGroup.Fits=[];
                    }
                    for await(Fit of Fits){
                        Fit.Tags = await Database.getTagsFromFitID(Fit.fit_ID);
                        // console.log(Fit);
                        try{
                            RoleGroups.find(RoleGroup=>RoleGroup.Role_ID==Fit.Group_ID).Fits.push(Fit);
                        }catch(e){
                            console.log(e);
                        }
                    }
                    // console.log(RoleGroups);
                    res.render('html',{ 
                        title:"피팅",
                        body: "doctrins Detail.ejs",
                        doctrine: Doctrine[0],
                        RoleGroups : RoleGroups,
                        sess:req.user,
                    });
                });
            });
        });
    });
    app.get('/doctrine/link/:Doctrine_ID/:Role_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        let fits = await Database.getAllFits();
        res.render('html',{ 
            title:"피팅",
            body: "doctrinelink.ejs",
            Doctrine_ID:req.params.Doctrine_ID,
            Role_ID:req.params.Role_ID,
            sess:req.user,
            fits:fits,
        });
    });
    app.post('/doctrine/link/:Doctrine_ID/:Role_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        await Database.addDoctrine_Link(req.params.Doctrine_ID,req.params.Role_ID,req.body.Fit_ID);
        res.redirect(`/doctrine/${req.params.Doctrine_ID}`);
    });
    app.get('/doctrine/unlink/:Doctrine_ID/:Fit_ID/:Role_ID/',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        await Database.removeDoctrine_Link(req.params.Doctrine_ID,req.params.Role_ID,req.params.Fit_ID);
        res.redirect(`/doctrine/${req.params.Doctrine_ID}`);
    });
    app.get('/doctrine/addRole/:Doctrine_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        res.render('html',{ 
            title:"피팅",
            body: "doctrineroleadd.ejs",
            Doctrine_ID:req.params.Doctrine_ID,
            sess:req.user,
        });
    });
    app.post('/doctrine/addRole/:Doctrine_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        let data = {
            name:req.body.Role_name,
            desc:req.body.Role_desc
        }
        await Database.addRoleGroup(req.params.Doctrine_ID,data)
        res.redirect(`/doctrine/${req.params.Doctrine_ID}`);
    });
    app.get('/doctrine/editRole/:Doctrine_ID/:Role_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        var role = await Database.getRoleGroup(req.params.Doctrine_ID,req.params.Role_ID);
        res.render('html',{ 
            title:"피팅",
            body: "doctrineroleedit.ejs",
            Doctrine_ID:req.params.Doctrine_ID,
            Role_ID:req.params.Role_ID,
            role:role[0],
            sess:req.user,
        });
    });
    app.post('/doctrine/editRole/:Doctrine_ID/:Role_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        console.log(await Database.editRoleGroup(req.params.Doctrine_ID,req.params.Role_ID,req.body.Role_name,req.body.Role_desc))
        res.redirect(`/doctrine/${req.params.Doctrine_ID}`);
    });
    app.get('/doctrine/deleteRole/:Doctrine_ID/:Role_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        var role = await Database.deleteRoleGroup(req.params.Doctrine_ID,req.params.Role_ID);
        res.redirect(`/doctrine/${req.params.Doctrine_ID}`);
    });
    app.get('/doctrine/deleteDoctrine/:Doctrine_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        var role = await Database.deleteDoctrine(req.params.Doctrine_ID);
        res.redirect(`/doctrine`);
    });
    app.get('/doctrine/editDoctrine/:Doctrine_ID',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        var doctrine = await Database.getDoctrine(req.params.Doctrine_ID);
        res.render('html',{ 
            title:"피팅",
            body: "doctrineedit.ejs",
            Doctrine_ID:req.params.Doctrine_ID,
            doctrine:doctrine[0],
            sess:req.user,
        });
    });
    app.post('/doctrine/editDoctrine/:Doctrine_ID/',async function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        await Database.editDoctrine(req.params.Doctrine_ID,req.body.Name,req.body.SubTitle,req.body.CoverImage,req.body.Description);
        res.redirect(`/doctrine/${req.params.Doctrine_ID}`);
    });
    app.post('/fits',function(req,res){
        Database.getAllTags((err,tagTable,fields)=>{
            let select_tags = JSON.parse(req.body.select_tags);
            Database.getFitsFromTags(select_tags,async(error, results, fields)=>{
                for(i in results){
                     results[i].Tags = await Database.getTagsFromFitID(results[i].fit_ID);
                }
                res.render('html',{ 
                    title:"피팅",
                    body: "fits.ejs",
                    length: Object.keys( results ).length,
                    fits: results,
                    sess:req.user,
                    tags:tagTable,
                    select_tags:select_tags,
                });
            });
        })
    });
    app.get('/fits/add',function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        Database.getAllTags((err,tagTable,fields)=>{    
            res.render('html',{ 
                title:"GOing's server",
                body: "fitadd.ejs",
                sess: req.user,
                tags:tagTable,
            });
        });
    });
    app.post('/fits/add',function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        //logger(JSON.stringify(req.user,null,4));
        //req.body.author = req.user?req.user.username:"unknown";
        // logger.json(req.body);
        let fit = {
            fit_name : req.body.fit_name,
            fit_esi : req.body.fit_esi,
            fit_dec : req.body.fit_dec,
            // fit_author : 231709896238825473,
            fit_author : req.user.id,
        }
        Database.addFit(fit,()=>{
            if(req.body.select_tags){
                Database.connection.query(`SELECT LAST_INSERT_ID();`, function(err, LAST_INSERT_ID, fields) {
                    LAST_INSERT_ID = LAST_INSERT_ID[0]['LAST_INSERT_ID()'];
                    if( typeof req.body.select_tags == "string" ){
                        Database.addTag(LAST_INSERT_ID,req.body.select_tags);
                    }
                    else{
                        // console.log(req.body.select_tags);
                        for(select_tag of req.body.select_tags){
                            Database.addTag(LAST_INSERT_ID,select_tag);
                        }
                    }
                });
            }
            res.redirect('/');
        })
    });
    app.get('/fits/edit/:fitname',function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        Database.connection.query(`SELECT * from Fit WHERE fit_ID = ${req.params.fitname}`, function(err, rows, fields) {
            Database.getAllTags((err,tagTable,fields)=>{
                Database.getTagsFromFitID(req.params.fitname,(err,tags,fields)=>{
                    let origin = {
                        fit_ID : rows[0].fit_ID,
                        fit_name : rows[0].Name,
                        fit_esi : rows[0].Body,
                        fit_dec : rows[0].Desc,
                    };

                    let select_tag = {};
                    for(tag of tags){
                        select_tag[tag.Tag_ID] = true;
                    }

                    // console.log(origin)
                    res.render('html',{ 
                        title:"GOing's server",
                        body: "fitedit.ejs",
                        fit_origin:origin,
                        sess: req.user,
                        tags:tagTable,
                        select_tag:select_tag,
                    });
                });
            });
        });
    });
    app.post('/fits/edit/:fitname',function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        let fit = {
            fit_name : req.body.fit_name,
            fit_esi : req.body.fit_esi,
            fit_dec : req.body.fit_dec,
            // fit_author : 231709896238825473,
            fit_author : req.user.id,
        }
        Database.editFit(fit,req.params.fitname,()=>{
            Database.getTagsFromFitID(req.params.fitname,(err,tagTable,fields)=>{
                let origin_tags = [];
                for(t of tagTable) origin_tags.push(t.Tag_ID.toString());
                if( typeof req.body.select_tags == "string" ) req.body.select_tags = [req.body.select_tags];
                else if (!req.body.select_tags) req.body.select_tags = [];
                // console.log(req.body.select_tags);
                // console.log(origin_tags);
                //새로생긴태그 확인
                for(select_tag of req.body.select_tags){
                    if(origin_tags.indexOf(select_tag)==-1)Database.addTag(req.params.fitname,select_tag);
                }
                //없어진태그 확인
                for(origin_tag of origin_tags){
                    if(req.body.select_tags.indexOf(origin_tag)==-1)Database.delTag(req.params.fitname,origin_tag);
                }
            });
            res.redirect('/');
        })
    });
    // app.get('/fitdetail/:fit_ID',function(req,res){
    //     require('./fitdetail.js')(req,res);
    // });
    app.get('/fits/del/:fitname',function(req,res){
        if(req.user.data.admin==false){res.redirect('/');return;}
        Database.connection.query(`DELETE FROM \`ghtjd0127\`.\`Fit\` WHERE  \`fit_ID\`=${req.params.fitname}`, function(err, rows, fields) {
            res.redirect('/fits');
        });
    });
    app.get('/api/userlist',function(req,res){
        console.log(req.query.token);
        if(global.apiToken.some((token)=>token==req.query.token)){
            let users = global.DB.users.array();
            let data = [];
            for(user of users){
                try{
                    let eve_char = global.DB.chars.filter(char=>char.onwer == user.id).array();
                    let data_char = [];    
                    for(char of eve_char){
                        data_char.push({
                            id:char.id,
                            name:char.name,
                            onwer:char.onwer
                        });
                    }
                    data.push({
                        id:user.id,
                        name:user.name,
                        username:user.discord.user.username,
                        discriminator:user.discord.user.discriminator,
                        eve_char:data_char,
                    });
                }
                catch(error){

                }
            }
            res.json(data);
        }
        else{
            res.json({
                "error":"token expired"
            })
        }
    });
    app.get('/api/onwer/:charname',function(req,res){
        console.log(req.query.token);
        if(global.apiToken.some((token)=>token==req.query.token)){
            console.log(req.params.charname);
            let onwerID;
            let user;
            try{
                onwerID = global.DB.chars.array().find(char=>req.params.charname==char.name).onwer;
            }
            catch(error){
                res.json({
                    error:`character not found! '${req.params.charname}' is unkown character`
                })
            }
            try{
                user = global.DB.users.array().find(user=>user.id==onwerID);
            
                res.json({
                    id:user.id,
                    name:user.name,
                    discriminator:user.discord.user.discriminator,
                    username:user.discord.user.username,
                });
            }
            catch(error){
                res.json({
                    error:`onwer not found! '${onwerID}' is unkown user`
                })
            }
        }
        else{
            res.json({
                "error":"token expired"
            })
        }
    });
};