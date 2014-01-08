var	fs = require('fs'),
    Ys = require('../../Ys').Ys;

var message = fs.readFileSync("./tests/message.txt");

Ys("^/$").get.html = function(req,res){
    res.end(message);
};


Ys.run({debug:true,port:8780,pidFile:"./tests/.debug_server_pid"});
