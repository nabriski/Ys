var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;


module.exports = {
    test_init: function (test) {
        //config & run server
        
        frontend = Ys.instance(),backend=Ys.instance();
        frontend("^/.*$").proxy = "http://localhost:8781/";

        backend("^/stuff/$").get = function(req,res){
            res.end("Backend Response");
        }
        
               
        frontend.run();
        backend.run({port:8781});
        test.done();
    },
    
    test_get_proxied: function (test) {

        request('http://localhost:8780/stuff/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"Backend Response");
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
