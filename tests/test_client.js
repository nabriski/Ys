process.on('uncaughtException', function (err) {
    var str = err.stack;
    console.log(str);
    process.exit();
});
//--------------------------------------------

var client = require('../../Ys').client;
client.getJSON('http://localhost:8780/json',function(json){
        console.log(json);
        process.exit();
});
