var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;

module.exports = {
    test_init: function (test) {
        //config & run server
        Ys("^/$").get = function(req,res){
            res.end("Hello World!");
        }
        
        Ys("^/raw_html/$").get = function(req,res){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end("<h1>Hello World!</h1>");
        }
        
		Ys("^/html/$").get = function(req,res){
            res.end("<h1>Hello World!</h1>");
        }

        Ys("^/json_alias/$").rewrite = "/json/";

        Ys("^/json/$").get.json = function(req,res){
            res.returnObject({"message" : "Hello World"});
        } 


		fs.writeFileSync("/tmp/tmpl.html","<h1>Hello <%= name %>!</h1>");
        Ys("^/html_template/$").get.html("/tmp/tmpl.html").args=function(req,res){
			res.returnObject({"name" : "Bob"});
        }

		fs.writeFileSync("/tmp/static.txt","Hello World!");
		Ys("^/static.txt$").get.static("/tmp/");

		Ys("^(.*/[^\./]+)$").redirect = "$1/";//add trailing slash when needed
                
        Ys.run();
        test.done();
    },
    
    test_get: function (test) {

        request('http://localhost:8780/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"Hello World!");
            test.done();
         })
         
    },

    test_raw_html: function (test) {

        request('http://localhost:8780/raw_html/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello World!</h1>");
            test.done();
         })
         
    },

	test_html: function (test) {

        request('http://localhost:8780/raw_html/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello World!</h1>");
            test.done();
         })
         
    },


    test_json: function (test) {

        request('http://localhost:8780/json/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"application/json");
            test.equals(JSON.parse(body)["message"],"Hello World");
            test.done();
         })
         
    },

	test_redirect: function (test) {

        request('http://localhost:8780/json', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"application/json");
            test.equals(JSON.parse(body)["message"],"Hello World");
            test.done();
         })
         
    },

	test_rewrite: function (test) {

        request('http://localhost:8780/json', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"application/json");
            test.equals(JSON.parse(body)["message"],"Hello World");
            test.done();
         })
         
    },
	test_html_template: function (test) {

        request('http://localhost:8780/html_template/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello Bob!</h1>");
            test.done();
         })
         
    },

	test_static: function (test) {

        request('http://localhost:8780/static.txt', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/plain");
            test.equals(body,"Hello World!");
            test.done();
         })
         
    },	
	test_cleanup: function (test) {
        // clean up
        Ys.stop();
		fs.unlinkSync("/tmp/tmpl.html");
		fs.unlinkSync("/tmp/static.txt");
        test.done();
    },
    
};
