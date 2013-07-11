var fs = require('fs'),
    request = require('request');
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
    fs  = require("fs"),
    server = null;

module.exports = {
    test_init: function (test) {

        exec('cp ./tests/debug_server.js ./tests/debug_server.js.tmp', function (error, stdout, stderr) {
        
            var cwd = process.cwd();
            server = spawn("node",["./tests/debug_server.js.tmp"],{"cwd":cwd});
            server.stdout.setEncoding('utf8');
            server.stdout.on("data",function(data){
                if(data.indexOf("started!") >= 0 ){
                    server.stdout.removeAllListeners("data");
                    test.done();
                }
            });

            server.stderr.on('data', function (data) {
              console.log('stderr: ' + data);
            });

           server.on('close', function (code) {
              console.log('child process exited with code ' + code);
            });
         });
    },
    
    test_get: function (test) {

            request('http://localhost:8780/', function (error, res, body) {
                    
                test.equals(res.statusCode,200);
                test.equals(body,"Hello");
                test.done();                 
            });
    },
 
    test_restart_get: function (test) {
                    
        server.stdout.on("data",function(data){

            if(data.indexOf("started!") < 0 ) return;
            
            request('http://localhost:8781/', function (error, res, body) {
                    test.equals(res.statusCode,200);
                    test.equals(body,"Hello");
                    test.done();
            });  
         });
         setTimeout(function(){exec('sed -i s/8780/8781/ ./tests/debug_server.js.tmp')},2000);
    }, 
    test_cleanup: function (test) {
        server.on("exit",function(){
            test.done();
        });
        fs.unlinkSync("./tests/debug_server.js.tmp");
        server.kill();
        server.stdin.end(); 
    },
    
};
