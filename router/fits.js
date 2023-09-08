var fs = require('fs');


module.exports = function(req, res){
    console.log("?");
    Database.getAllFits();
    var files = fs.readdirSync(__dirname+'/../data/fits'); // 디렉토리를 읽어온다
    console.log(files);
    // sess = req.session;
    res.render('html',{ 
        title:"피팅",
        body: "fits.ejs",
        length: Object.keys( files ).length,
        fits: files,
        sess:req.user
    });
}