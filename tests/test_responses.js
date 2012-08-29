var Ys = require('../../Ys').Ys,
    request = require('request');

module.exports = {
    setUp: function (callback) {
        //config & run server
        Ys("^/$").get = function(req,res){
            res.end("Hello World!");
        }

        /*Ys("^/raw_html/$").get = function(req,res){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end("<h1>Hello World!</h1>");
        }

        Ys("^/json/$").get.json = function(req,res){
            res.returnObject({"message" : "Hello World"});
        }*/
        
        Ys.run();
        callback();
    },
    tearDown: function (callback) {
        // clean up
        Ys.stop();
        callback();
    },
    test_get: function (test) {

        var request = require('request');
        request('http://localhost:8780/', function (error, res, body) {
            
            test.equals(res.statusCode,200);
            test.equals(body,"Hello World!");
            test.done();

         })
         
    }
};
