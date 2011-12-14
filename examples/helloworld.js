var Ys = require('../Ys').Ys;

Ys("^/$").get = function(req,res){
    res.end("Hello World!");
}

Ys.run();
