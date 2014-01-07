var fs = require('fs'),
    path = require('path');
    request = require('superagent');
	spawn = require('child_process').spawn,
    fs  = require("fs"),
    server = null;



module.exports = {
    test_restart: function (test) {

            var cwd = process.cwd();
            var dir = path.dirname(module.filename);
            process.chdir(dir);
            fs.writeFileSync("message.txt", "hello");
            process.chdir(cwd);
            server = spawn("node",["./tests/debug_server.js"],{"cwd":cwd});
            server.stdout.setEncoding('utf8');
            server.stdout.on("data",function(data){
               console.log(data);
               request.get("http://localhost:8780").end(function(err,res){
                   console.log(err);
                    console.log(res.text);    
                    test.done();
               });
               /* if(data.indexOf("started!") >= 0 ){
                    server.stdout.removeAllListeners("data");
                    test.done();
                }*/
            });

            server.stderr.on('data', function (data) {
              console.log('stderr: ' + data);
            });

           server.on('close', function (code) {
              console.log('child process exited with code ' + code);
            });

            /*request.get("http://localhost:8780").end(function(err,res){
                   console.log(err);
                    console.log(res.text);    
                    test.done();
               });*/



    }
       
};
