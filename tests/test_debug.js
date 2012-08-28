var Ys = require('../../Ys').Ys,http=require('http');
Ys("^/$").get = function(req,res){
    res.end("moko");
}
Ys.run({debug:true});
