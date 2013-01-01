var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;


module.exports = {
    test_init: function (test) {
        //config & run server
        
        a = Ys.instance(),b=Ys.instance();
        a("^/$").get = function(req,res){
            res.end("I am A");
        }

        b("^/$").get = function(req,res){
            res.end("I am B");
        }
        
               
        a.run({onInit:function(){
            b.run({port:8781,onInit:function(){
                test.done();
            }});
        
        }});
    },
    
    test_get_a: function (test) {

        request('http://localhost:8780/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"I am A");
            test.done();
         })
         
    },
   
    test_get_b: function (test) {

        request('http://localhost:8781/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"I am B");
            test.done();
         })
         
    }, 
	test_cleanup: function (test) {
        // clean up
        a.stop();
        b.stop();
        test.done();
    },
    
};
