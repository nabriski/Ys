


var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;

module.exports = {
    setUp: function (callback) {
        Ys("^(.*)/$").rewrite = "$1/index.html";
        Ys("/index.html").get = function(req,res){
            res.end("Hello!");
        };

        Ys("/index.html").post = function(req,res){
            res.end("koko");
        };
 
        Ys.run();
        callback();
    },

    tearDown: function (callback) {
        // clean up
        Ys.stop();
        callback();
    },
    
    test_rewrite_match_bug: function (test) {
        request('http://localhost:8780/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"Hello!");
            test.done();
         })
    },
    test_post_bug: function (test) {
        request.post('http://localhost:8780/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"koko");
            test.done();
         })
    },

    
};
