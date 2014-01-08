var fs = require('fs'),
    path = require('path');
    request = require('superagent');
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
    fs  = require("fs"),
    server = null;



module.exports = {
    test_restart: function (test) {

            var cwd = process.cwd();
            var dir = path.dirname(module.filename);
            process.chdir(dir);
            fs.writeFileSync("message.txt", "hello!");
            process.chdir(cwd);

            var started = false,restarted = false;

            server = spawn("node",["./tests/debug_server.js"],{"cwd":cwd});
            //server.unref();
            server.stdout.setEncoding('utf8');
            server.stdout.on("data",function(data){

                console.log(data);
               if(data.indexOf("Server running") >= 0) started = true;
               if(data.indexOf("child restarted") >= 0) restarted = true;

               if(!started) return;

               request.get("http://localhost:8780").end(function(err,res){
                    if(started && !restarted){
                        console.log("ok");
                        test.equals(res.text,"hello!");
                        var cwd = process.cwd();
                        var dir = path.dirname(module.filename);
                        process.chdir(dir);
                        fs.writeFileSync("message.txt", "goodbye!");
                        process.chdir(cwd);
                    }
                    else if(restarted){
                        console.log("ok2 "+error);
                        //test.equals(res.text,"goodbye!");
                        console.log("kill!");
                        /*exec("cat ./tests/.debug_server_pid | xargs kill",{},function(){
                            test.done();
                        });    */
                    }
                    
                    //server.kill();
               });
               /* if(data.indexOf("started!") >= 0 ){
                    server.stdout.removeAllListeners("data");
                    test.done();
                }*/
            });

            server.stderr.on('data', function (data) {
              console.log('stderr: ' + data);
            });

    }
       
};
