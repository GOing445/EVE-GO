var fs = require('fs');
var DB = require('../database.js');
var ESI = require('../esi.js');

module.exports = function(req, res){
    if(!req.user)res.redirect('/front');

    // console.log(req.query.code);
    

    ESI.getRefreshTokenFormCode(req.query.code,(refresh_token)=>{
        ESI.getTokenFormRefreshToken(refresh_token,(access_token)=>{
            ESI.verifyAccessToken(access_token,(token_body)=>{
                var char = {
                    id:token_body.CharacterID,
                    name:token_body.CharacterName,
                    onwer:req.user.id,
                    refreshToken:refresh_token
                }
                DB.addCharacter(char,()=>{
                    res.redirect(`/member/${req.user.id}`);
                });
            });
        });
    });
}