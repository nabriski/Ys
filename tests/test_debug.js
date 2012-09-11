var fs = require('fs'),
    request = require('request');
	spawn = require('child_process').spawn;

var server = null;

module.exports = {
    test_init: function (test) {
        server = spawn("node",["debug_server.js"]);
        var init_done = false;
        server.stdout.on("data",function(){

            if(init_done)
                return;

            init_done = true;
            test.done();
        });
    },
    
    test_get: function (test) {

            request('http://localhost:8780/', function (error, res, body) {
           
                if(error) test.ok(false,error.Error);
                    
                test.equals(res.statusCode,200);
                test.equals(body,"Hello");
                test.done();
             });
         
    },
  
    test_cleanup: function (test) {
        server.on("exit",function(){
            test.done();
        });
        server.kill(); 
    },
    
};
