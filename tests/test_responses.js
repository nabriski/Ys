var Ys = require('../../Ys').Ys,
    request = require('superagent');
   
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
        var agent = request.agent();
        agent.get('http://localhost:8780/').type('html').end(function(err, res) {
            //test.assert(!err);

            console.log(res.body);
            test.equals(res.statusCode,200);
            test.equals(res.body,"Hello World!");
            test.done();
        }); 
    }
};
