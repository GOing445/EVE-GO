let client = global.Discordbot;

const blacklist = ["/fitdetail","/fits","/member","/logout","/doctrine"];
const ggOnly = ["/recruitlist"];
const justlogin = [];

module.exports = function (req, res, next) {
    console.log(req.url)
    if(req.url.toLowerCase().startsWith("/logout")){
        next();
        return;
    }    
    if(ggOnly.find(url=>{return req.url.toLowerCase().startsWith(url);})!=undefined){
        console.log("뿌빠뽕")
        if(!req.user){
            res.redirect('/reject');
            console.log("1로그인 정보 없음 @");
        }
        else if(
            !client.isUserHavePermission("525912172908380191",req.user.id,"525914346073751582") //게릴라가드닝 꼽원
            ){
            console.log("2권한 없음 @@")
            sess = req.user;
            res.redirect('/recruit');
        }
        else{
            next();
        }
    }
    else if(blacklist.find(url=>{return req.url.toLowerCase().startsWith(url);})!=undefined) {
        if(!req.user){
            res.redirect('/reject');
            console.log("1로그인 정보 없음 @");
        }
        else if(
            !client.isUserHavePermission("525912172908380191",req.user.id,"525914346073751582")&& //게릴라가드닝 꼽원
            !client.isUserHavePermission("525912172908380191",req.user.id,"676574721181220895")&& //게릴라킨더가드닝 꼽원
            !client.isUserHavePermission("274796444945350667",req.user.id,"572955327234834459")   //개발서버 .G.G 뱃지
            ){
            console.log("2권한 없음 @@")
            sess = req.user;
            if(sess.username){
                // req.session.destroy(function(err){
                //     if(err){
                //         console.log(err);
                //     }else{
                //         res.redirect('/reject');
                //     }
                // })
                res.redirect('/reject');
            }
            else{
                res.redirect('/reject');
            }
        }
        else{
            next();
        }
    }
    else if(justlogin.find(url=>{return req.url.toLowerCase().startsWith(url);})!=undefined){
        if(!req.user){
            res.redirect('/reject');
            console.log("1로그인 정보 없음 @");
        }
        else{
            next();
        }
    }
    else{
        next();
    }
}