var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;


module.exports = {
    test_init: function (test) {
        //config & run server
        
        frontend = Ys.instance(),backend=Ys.instance();
        frontend("^/$").get = function(req,res){
            res.end("I am frontend");
        }
        backend("^/$").get = function(req,res){
            res.end("I am backend");
        }
        
               
        frontend.run();
        backend.run({port:8781});
        test.done();
    },
    
    test_get_frontend: function (test) {

        request('http://localhost:8780/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"I am frontend");
            test.done();
         })
         
    },
   
    test_get_backend: function (test) {

        request('http://localhost:8781/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"I am backend");
            test.done();
         })
         
    }, 
	test_cleanup: function (test) {
        // clean up
        frontend.stop();
        backend.stop();
        test.done();
    },
    
};
