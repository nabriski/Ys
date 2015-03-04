var fs = require('fs'),
    request = require('request'),
	Ys = require('../../Ys').Ys;

        

module.exports = {
    test_init: function (test) {
        //config & run server
        frontend = Ys.instance(),backend=Ys.instance();
        frontend("^/.*$").proxy = "http://localhost:8781/";

        backend("^/stuff/$").get = function(req,res){
            res.end("Backend Response");
        };

        backend("^/redirect/$").redirect = "/stuff/";

        backend("^/post-stuff/$").post = function(req,res){

            var body = "";
            req.on('data', function (data) {
                    body += data;
            });

            req.on('end', function () {
                res.end("Backend Post Response: "+body);
            });
        };

        backend("^/put-stuff/$").put = function(req,res){

            var body = "";
            req.on('data', function (data) {
                    body += data;
            });

            req.on('end', function () {
                res.end("Backend Post Response: "+body);
            });
        };

               
        frontend.run({
                onInit:function(){
                    backend.run(
                        {
                            port:8781,
                            onInit:function(){
                                test.done();
                        }   
                    });
                }
        });
    },
    
    test_get_proxied: function (test) {

        request('http://localhost:8780/stuff/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"Backend Response");
            test.done();
         });
         
    },
  
    test_backend_redirect: function (test) {

        request('http://localhost:8780/redirect/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"Backend Response");
            test.done();
         });
         
    },
    test_get_proxied_post: function (test) {

        request(
                {
                    url:'http://localhost:8780/post-stuff/',
                    method:'post',
                    body : "koko"
                }, 
                function (error, res, body) {
                    test.equals(res.statusCode,200);
                    test.equals(body,"Backend Post Response: koko");
                    test.done();
         });
         
    },

    test_get_proxied_put: function (test) {

        request(
                {
                    url:'http://localhost:8780/put-stuff/',
                    method:'put',
                    body : "koko"
                }, 
                function (error, res, body) {
                    test.equals(res.statusCode,200);
                    test.equals(body,"Backend Post Response: koko");
                    test.done();
         });
         
    },


    test_cleanup: function (test) {
        // clean up
        frontend.stop({onShutdown:function(){
            backend.stop({onShutdown: function(){
                test.done();
            }});
        }});
    }
    
};
