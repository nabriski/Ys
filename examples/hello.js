var Ys = require('../Ys').Ys;
//---------------------------------------------------
Ys(/\//).get().callback = function(req,res){

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}
//---------------------------------------------------
Ys.prototype.run();
