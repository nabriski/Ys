var fs = require('fs'),
    request = require('request');
	spawn = require('child_process').spawn,
	exec = require('child_process').exec;

var server = null;
module.exports = {
    test_init: function (test) {

        exec('cp debug_server.js debug_server.js.tmp', function (error, stdout, stderr) {
        
            var init_done = false;
            var cwd = process.cwd();
            server = spawn("node",["debug_server.js.tmp"],{"cwd":cwd});
            server.stdout.setEncoding('utf8');
            server.stdout.on("data",function(data){

                if(init_done)
                    return;
                
                console.log(data);

                init_done = true;
                test.done();
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
            var init_done = false;

            if(init_done)
                return; 

            console.log(data);
            init_done = true;

            setTimeout(function(){
                console.log("bang!");
                request('http://localhost:8781/', function (error, res, body) {
                        test.equals(res.statusCode,200);
                        test.equals(body,"Hello");
                        test.done();
                });  
            },1000);
         });
         exec('sed -i s/8780/8781/ debug_server.js.tmp', function(){});
    }, 
    test_cleanup: function (test) {
        server.on("exit",function(){
            test.done();
        });

        server.kill();
        server.stdin.end(); 
    },
    
};
