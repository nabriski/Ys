var fs = require('fs'),
	Ys = require('../../Ys').Ys;

module.exports = {
    setUp: function (callback) {
        Ys("/").get = function(req,res){
            res.end("Hello!");
        };

        Ys.run({pidFile:"/tmp/YsPid",port:8989,onInit:function(){
            callback();
        }});
    },

    tearDown: function (callback) {
        // clean up
        Ys.stop({onShutdown:function(){
            fs.unlinkSync("/tmp/YsPid");
            callback();
        }});
    },
    
    testPidFile: function (test) {
        test.equal(process.pid,parseInt(fs.readFileSync("/tmp/YsPid")));
        test.done();
    },
        
};
