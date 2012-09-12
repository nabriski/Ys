var	Ys = require('../../Ys').Ys;

Ys("^/$").get.html = function(req,res){
    res.end("Hello");
};

Ys.run({debug:true,port:8780});
