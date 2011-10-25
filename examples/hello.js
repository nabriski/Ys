var Ys = require('../Ys').Ys;
//---------------------------------------------------
Ys("^/$").get = function(req,res){

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}
//---------------------------------------------------
Ys("^/json$").get.json = function(req,res){
    return {"message":"Hello World"};
}
//---------------------------------------------------


Ys.run();
