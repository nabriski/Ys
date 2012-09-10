process.on('uncaughtException', function (err) {
    var str = err.stack;
    console.log(str);
    process.exit();
});
//--------------------------------------------
var Ys = require('../../Ys').Ys;

Ys("^/json$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"});
}
Ys.run();
//--------------------------------------------

var client = require('../../Ys').client;
client.getJSON('http://localhost:8780/json',function(json){
        if(json["message"] === "Hello World")
            console.log("test passed");
        else
            console.log("test failed");
        process.exit();
});
