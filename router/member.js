var fs = require('fs');
var DB = require('../database.js');

module.exports = function(req, res){
    var sess = req;
    var len;
    var username;
    if(!req.user)res.redirect('/');
    if(req.user.data.isAdmin==false) res.redirect('/');
    console.log(req.user.username+"is join member list!");
    
    let users = global.DB.users.array();
    
    for(i in users){
        let user = users[i];
        users[i].eve_char = global.DB.chars.filter(char=>char.onwer == user.id).array();
    }

    // console.log(users[0].discord.user);

    res.render('html', {
        title: "GOing's server",
        body: "member.ejs",
        sess: req.user,
        users : users
    });
    //console.log(len);
}